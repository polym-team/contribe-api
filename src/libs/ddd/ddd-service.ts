import { Inject } from 'typedi';
import { getConnection } from 'typeorm';
import { DddContext } from './ddd-context';
import { DddEvent } from './ddd-event';
import { registerEventHandler, handleEvents } from '../event-store';

export class DddService {
    @Inject()
    context!: DddContext;
}

export function Transactional() {
    return function(target: DddService, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function(this: DddService) {
            const thiz = this;
            const args = arguments; // eslint-disable-line prefer-rest-params
            let result: any;
            await getConnection().manager.transaction(async (entityManager) => {
                // Replace entityManager set in DddContext
                // We should use entityManger. see https://github.com/typeorm/typeorm/issues/2927
                thiz.context.entityManager = entityManager;
                result = await originalMethod.apply(thiz, args);
            });
            handleEvents(thiz.context.getPublishedEvents());
            return result;
        };
        return descriptor;
    };
}

export function EventHandler<T extends DddEvent>(eventClass: new (...args: any[]) => T) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // FIXME: target 이 DddService 를 상속하지 않으면 throw Error();
        registerEventHandler(eventClass, target.constructor, propertyKey);
    };
}
