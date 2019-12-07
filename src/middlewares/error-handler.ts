import { ValidationError } from '@hapi/joi';
import { isBoom } from '@hapi/boom';
import { ResponseError } from '../libs/response/error';
import { ServerContext } from '../libs/types';

// TODO: logging

interface TransformResponse {
    status: number;
    body: ResponseError;
}

const isJoi = (err: any): err is ValidationError => Boolean(err.isJoi);

const transformResponse = (err: Error): TransformResponse => {
    const rs: TransformResponse = {
        status: 500,
        body: {
            errorCode: 'UNHANDLED',
            errorMessage: '',
        },
    };
    if (isBoom(err)) {
        const { statusCode } = err.output;
        const { errorCode, errorMessage } = err.data || ({} as any);
        rs.status = statusCode;
        rs.body = {
            errorCode,
            errorMessage,
        };
    } else if (isJoi(err)) {
        // Valdation Error
        rs.status = 400;
        rs.body = {
            // TODO: 클라이언트에서 Validation 에러를 공통적으로 처리할 필요가 있다는 요구를 하면 바꾸자.
            errorCode: 'UNHANDLED',
            // NOTE: 사용자에게 에러 메세지를 그대로 전달할 이유가 없음.
            errorMessage:
                // TODO: 환경 설정 값 하나의 파일에서 받아오자.
                process.env.NODE_ENV !== 'production'
                    ? `Invalid request.\nPlease check the request value.\n${err.message}` // NOTE: 개발 환경에서는 뭐가 문젠지 그대로 보여주는게 낫지 않을까 싶어서 추가.
                    : 'Invalid request.\nPlease check the request value.', // NOTE: 운영 환경에서는 이상한 내용이 나가면 안된다.
        };
    } else {
        rs.status = 500;
        // TODO: Boom 아닌 에러인 경우 어떻게 핸들링 할지 정하지 않음
        rs.body = {
            errorCode: 'UNEXPECTED',
            errorMessage: 'An unexpected error has occurred. Please try again.', // TODO: unexpected_error
        };
    }

    // NOTE: 일단 개발 환경에서 디버깅을 쉽게 하기 위해 에러 로그를 남겨준다.
    // TODO: 환경 설정 값 하나의 파일에서 받아오자.
    if (process.env.NODE_ENV !== 'production') {
        console.error('[Error Handler]', err);
    }

    return rs;
};

/**
 *
 */
export const errorHandlerMiddleware = async (ctx: ServerContext, next: () => Promise<any>) => {
    try {
        await next();
    } catch (err) {
        // logger.error(err.message, {
        //     txId: ctx.state && ctx.state.txId,
        //     err,
        // });

        const response = transformResponse(err);
        ctx.status = response.status;
        const { errorCode, errorMessage } = response.body;
        // NOTE: 에러 코드가 존재하는 경우만 메세지까지 serve.
        if (errorCode) {
            ctx.body = {
                errorCode,
                errorMessage,
            };
        } else {
            ctx.body = {
                errorCode: 'UNEXPECTED',
                errorMessage: 'An unexpected error has occurred. Please try again.', // TODO: unexpected_error
            };
        }
    }
};
