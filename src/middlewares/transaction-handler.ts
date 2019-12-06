import { EntityManager, getConnection } from 'typeorm';
import { ServerContext } from '../libs/types';

export const transactionHandlerMiddleware = async (ctx: ServerContext, next: () => Promise<any>) => {
    const { container } = ctx.state;

    await getConnection().manager.transaction(async (entityManager) => {
        // Replace entityManager set in dependencyInjector middleware
        // We should use entityManger. see https://github.com/typeorm/typeorm/issues/2927
        container.set(EntityManager, entityManager);
        await next();
    });
};
