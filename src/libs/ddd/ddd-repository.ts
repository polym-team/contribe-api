import { flatMap } from 'lodash';
import { Inject } from 'typedi';
import { badImplementation } from '@hapi/boom';
import {
    EntityManager,
    throwBy,
    DuplicateEntryError,
    Specification,
    ObjectType,
    FindAllManyOptions,
    FindOrder,
    FindManyOptions,
    convertOptions,
} from '../orm';
import { ResponseError } from '../response/error';
import { DddModel } from './ddd-model';
import { DddEvent } from './ddd-event';
import { DddContext } from './ddd-context';

export abstract class DddRepository<T extends DddModel<T>> {
    @Inject()
    private context!: DddContext;

    protected entityClass?: ObjectType<T>; // ex) User

    /**
     * @param entities
     */
    public async save(entities: T[]) {
        entities.forEach((entity) => entity.setTxId(this.context.txId));
        // NOTE:
        //   You can't call saveEntities() and saveEvents() parallel using Promise.all() since you have to wait until auto increment key's been generated.
        //   See https://stackoverflow.com/questions/11277945/new-entity-id-in-domain-event
        await this.saveEntities(entities);
        await this.saveEvents(flatMap(entities, (entity) => entity.getPublishedEvents()));
    }

    /**
     * @param entities
     */
    private async saveEntities(entities: T[]) {
        return this.context.entityManager
            .save(entities, { reload: true })
            .catch(throwBy(this.context.entityManager))
            .catch((err) => {
                if (err instanceof DuplicateEntryError) {
                    throw new DuplicateEntityError();
                }
                throw err;
            });
    }

    /**
     * @param events
     */
    private async saveEvents(events: DddEvent[]) {
        const eventsWithTxId = events.map((event) => event.withTxId(this.context.txId));
        this.context.publishEvents(eventsWithTxId);
        return this.context.entityManager.save(DddEvent, eventsWithTxId);
    }

    /**
     * @param spec
     * @param options
     * @param order
     */
    public async findAll(spec: Specification<T>, options?: FindManyOptions, order?: FindOrder): Promise<T[]> {
        if (!this.entityClass) {
            throw badImplementation<ResponseError>('findAll을 사용하려면 entityClass를 지정해야 합니다.', {
                errorCode: 'UNEXPECTED',
                errorMessage: 'bad implementation', // TODO: 에러 메세지
            });
        }
        return this.context.entityManager.find<T>(this.entityClass, {
            where: spec.where,
            ...convertOptions(options),
            ...order,
        } as FindAllManyOptions<T>);
    }

    public async countAll(spec: Specification<T>): Promise<number> {
        if (!this.entityClass) {
            throw badImplementation<ResponseError>('countAll을 사용하려면 entityClass를 지정해야 합니다.', {
                errorCode: 'UNEXPECTED',
                errorMessage: 'bad implementation', // TODO: 에러 메세지
            });
        }
        return this.context.entityManager.count<T>(this.entityClass, spec.where as FindAllManyOptions<T>);
    }
}

/**
 * 중복된 데이터를 추가하려는 경우 발생하는 에러.
 */
export class DuplicateEntityError extends Error {
    constructor() {
        super();
        this.name = 'DuplicateEntityError';
        Error.captureStackTrace(this, this.constructor);
    }
}
