import * as Jwt from 'jsonwebtoken';

export const userJwtSecret = '????';

export interface JwtUserEncodeData {
    userId: number;
}

export const encodeUserToken = (data: JwtUserEncodeData) => Jwt.sign(data, userJwtSecret);
