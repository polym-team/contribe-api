import 'reflect-metadata';
import * as Koa from 'koa';
import { createConnection } from 'typeorm'; // TODO: TEMP
import * as koaBody from 'koa-body';
import * as cors from '@koa/cors';
import * as gracefulShutdown from 'http-graceful-shutdown';
import {
    errorHandlerMiddleware,
    requestLoggerMiddleware,
    uuidMiddleware,
    dependencyInjectorMiddleware,
} from './middlewares';
import { globalRouter } from './routes';
import { getConfig } from './config';

const isProd: boolean = getConfig('/isProduction');
// NOTE: confidence로 가져오면 객체가 손상되기 때문에 여기서 분기 처리를 한다.
const corsWhitelist = isProd
    ? [/https:\/\/.+\.ctri\.be.*/gi]
    : [/https:\/\/.+\.ctri\.be.*/gi, /http:\/\/localhost(:\d{4})?/gi];
const ormconfig = getConfig('/ormconfig');

(async () => {
    const conn = await createConnection(ormconfig); // TODO: TEMP

    const app = new Koa();

    app.use(errorHandlerMiddleware); // NOTE: 특별한 이유가 없다면 가장 첫 미들웨어로 사용해서 응답 값 핸들링에 문제가 없도록 해야한다.
    app.use(requestLoggerMiddleware);
    app.use(
        cors({
            origin: (ctx) => {
                const requestOrigin = ctx.request.headers.origin;
                if (
                    corsWhitelist.some((reg) => {
                        reg.lastIndex = 0;
                        return reg.test(requestOrigin);
                    })
                ) {
                    return requestOrigin;
                }
                // NOTE: 에러는 안내지만 모바일같은 환경에서 무난하게 사용 가능하도록 그냥 둠.
                return '';
            },
        }),
    );
    app.use(uuidMiddleware);
    app.use(dependencyInjectorMiddleware);
    app.use(koaBody());

    /**
     * Route middleware
     */
    app.use(globalRouter.middleware());

    const server = app.listen(3000);

    gracefulShutdown(server, {
        signals: 'SIGINT SIGTERM',
        timeout: 30000,
        onShutdown: async () => {
            console.log('The server shuts down when the connection is cleaned up.');
            await conn.close();
        },
        finally: () => {
            console.log('bye 👋');
            process.exit();
        },
    });

    console.log('Server running on port 3000');
})();
