import { EntityManager } from 'typeorm';
import { Container } from 'typedi';
import { DddEvent } from './ddd-event';
import * as uuid from 'uuid/v4';

export class DddContext {
    static of(txId: string): DddContext {
        return new DddContext(txId);
    }

    dispose: () => void;

    get: <T>(clazz: new (...args: any[]) => T) => T;

    private constructor(txId: string) {
        this._txId = txId;

        const containerId = uuid();
        const container = Container.of(containerId);
        container.set(DddContext, this);

        this.dispose = () => {
            Container.reset(containerId);
        };

        this.get = (clazz) => container.get(clazz);
    }

    // @Inject('txId')
    private _txId!: string;

    get txId(): string {
        // console.log(this._txId);
        return this._txId;
    }

    // #region EntityManager
    // @Inject()
    private _entityManager!: EntityManager;

    get entityManager(): EntityManager {
        // console.log(this._txId);
        return this._entityManager;
    }

    set entityManager(entityManager: EntityManager) {
        this._entityManager = entityManager;
    }
    // #endregion

    // #region event
    private events: DddEvent[] = [];

    publishEvents(events: DddEvent[]) {
        this.events.push(...events);
    }

    getPublishedEvents(): DddEvent[] {
        return [...this.events];
    }
    // #endregion
}
