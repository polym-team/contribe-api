import { ServerContext } from '../libs/types';

// TODO: logging

/**
 *
 */
export const requestLoggerMiddleware = async (ctx: ServerContext, next: () => Promise<any>) => {
    const start = Date.now();

    try {
        await next();
    } finally {
        // const duration = Date.now() - start;
        // const txId = ctx.state && ctx.state.txId;
        // logger.info(`${`[${ctx.method}, ${txId}] -> ${ctx.url}\r\n<- ${ctx.status}, ${ctx.url} - ${duration}ms`}`, {
        //     txId,
        //     tags: ['request'],
        //     req: {
        //         headers: JSON.stringify(ctx.request.headers || ''),
        //         query: JSON.stringify(ctx.request.query || ''),
        //         body: JSON.stringify(ctx.request.body || ''),
        //     },
        //     user: ctx.state.user && { idx: ctx.state.user.userId },
        // });
    }
};
