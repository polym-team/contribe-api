import { Subject } from 'rxjs';
import { DddContext } from '../ddd/ddd-context';
import { DddEvent } from '../ddd/ddd-event';

const handlers: [new (...args: any[]) => DddEvent, new (...args: any[]) => any, string][] = [];

/**
 * @param eventClass
 * @param serviceClass
 * @param serviceMethod
 */
export function registerEventHandler(
    eventClass: new (...args: any[]) => DddEvent,
    serviceClass: new (...args: any[]) => any, // TODO: any?
    serviceMethod: string,
) {
    handlers.push([eventClass, serviceClass, serviceMethod]);
}

const subject = new Subject<DddEvent>();

subject.subscribe((event) => {
    handlers.forEach(([eventClass, serviceClass, serviceMethod]) => {
        if (event.type === eventClass.name) {
            const context = DddContext.of(event.txId);
            const service = context.get(serviceClass);
            // @ts-ignore
            (service[serviceMethod].call(service, event) as Promise)
                .catch((err: Error) => {
                    console.error('TODO: error logging', err, event);
                })
                .finally(() => {
                    context.dispose();
                });
        }
    });
});

/**
 * @param events
 */
export function handleEvents(events: DddEvent[]) {
    events.forEach((event) => subject.next(event));
}
