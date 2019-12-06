import * as KoaJwt from 'koa-jwt';
import { unauthorized } from '@hapi/boom';
import { userJwtSecret } from '../libs/jwt/user-token';
import { ServerContext } from '../libs/types';
// import { UserService } from '../services/users/application/service';

export const authGuardMiddleware = KoaJwt({
    secret: userJwtSecret,
});

/**
 * - 반드시 authGuardMiddleware 이후에 실행되어야 한다.
 * - 토큰에 있는 userId로 사용자 정보를 가져온다.
 */
export const userHandlerMiddleware = async (ctx: ServerContext, next: () => Promise<any>) => {
    const { user: decodedToken, container } = ctx.state;
    if (decodedToken && decodedToken.userId) {
        // const userService = container.get(UserService);

        try {
            // const user = await userService.getByUserId(decodedToken.userId);
            // ctx.state.user = user;
        } catch (error) {
            const err = unauthorized('없는 사용자');
            err.data = {
                errorCode: 'UNAUTH',
                errorMessage: 'Unauthorized',
            } as any;
            throw err;
        }
    } else {
        ctx.state.user = undefined;
    }
    await next();
};
