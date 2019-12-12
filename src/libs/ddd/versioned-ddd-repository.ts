import { badRequest } from '@hapi/boom';
import { ResponseError } from '../response/error';
import { DddRepository } from './ddd-repository';
import { VersionedDddModel } from './versioned-ddd-model';

export abstract class VersionedDddRepository<T extends VersionedDddModel<T>> extends DddRepository<T> {
    public async save(entities: T[]) {
        const versionOf: { [key: string]: number } = entities.reduce((versionOf: { [key: string]: number }, entity) => {
            if (entity.getId()) {
                // id 가 없는 것은 새로 생성하는 entity. 새로 생성하는 entity 는 버젼 체크 대상이 아니다.
                versionOf[entity.getId().toString()] = entity.version;
            }
            return versionOf;
        }, {});

        await super.save(entities);

        entities
            .filter((entity) => entity.version > 1) // version === 1 이면 새로 생성한 entity 이므로 버젼 체크 할 필요 없음
            .forEach((entity, i) => {
                if (entity.version !== versionOf[entity.getId().toString()] + 1) {
                    throw badRequest<ResponseError>(
                        `OptimisticLockVersionMismatchError(${entities[0].constructor.name}(${entity.getId()}))`,
                        {
                            errorCode: 'UNHANDLED',
                            errorMessage: "Something went wrong and we couldn't complete your request.", // TODO: 메시지 정리
                        },
                    );
                }
            });
    }
}
