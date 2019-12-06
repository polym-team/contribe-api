import * as uuidV4 from 'uuid/v4';
import { ServerContext } from '../libs/types';

export const uuidMiddleware = async (ctx: ServerContext, next: () => Promise<any>) => {
    ctx.state.txId = uuidV4();
    await next();
};
