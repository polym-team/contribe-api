import { Container } from 'typedi';
import { getManager, EntityManager } from 'typeorm';
import { ServerContext } from '../libs/types';

export const dependencyInjectorMiddleware = async (ctx: ServerContext, next: () => Promise<any>) => {
    const { txId } = ctx.state;
    const container = Container.of(txId);

    try {
        ctx.state.container = container;
        container.set(EntityManager, getManager());
        container.set('txId', txId);
        await next();
    } finally {
        Container.reset(txId);
    }
};
