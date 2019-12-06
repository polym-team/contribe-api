import * as Joi from '@hapi/joi';

/**
 * 허용된 에러 코드
 */
export const errorCode = <const>[
    'UNAUTH', // 사용자 인증 실패
    'UNEXPECTED', // 예기치 않은 에러
    'UNHANDLED', // 클라이언트에서 별도 예외처리 필요 없을때 사용
];
export type ErrorCode = typeof errorCode[number];

export const responseErrorSchema = Joi.object({
    errorCode: Joi.string().required(),
    errorMessage: Joi.string().required(), // error.message를 기본 값으로 하더라도 response로 나갈땐 결국 항상 존재해야 함
}).description('Error');

export interface ResponseError {
    errorCode: ErrorCode;
    errorMessage?: string;
}
