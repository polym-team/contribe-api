import { IsOptional, IsString, MaxLength, IsEmail, Length, IsDate } from 'class-validator';
import { badRequest } from '@hapi/boom';
import { PrimaryGeneratedColumn, Column, Entity } from '../../../libs/orm';
import { ResponseError } from '../../../libs/response/error';
import { generateSalt, generateHash } from '../../../libs/password';
import { DddModel, Identifier } from '../../../libs/ddd';
import { Nullable } from '../../../libs/types';

type CtorType = {
    email: string;
    phoneNumber?: string;
    password: string;
    countryCode: string;
    timezone: string;
    language: string;
};

export type UserUpdateType = {
    firstName?: string;
    lastName?: string;
    countryCode?: string;
    timezone?: string;
    language?: string;
};

@Entity()
export class User extends DddModel<User> {
    @PrimaryGeneratedColumn({ unsigned: true })
    @Identifier()
    userId!: number;

    @Column()
    @IsString()
    @MaxLength(32)
    @IsOptional()
    firstName?: string;

    @Column({ nullable: true })
    @IsString()
    @MaxLength(32)
    @IsOptional()
    lastName?: string;

    @Column({ unique: true })
    @IsEmail()
    @Length(6, 64)
    email!: string;

    @Column({ nullable: true, unique: true })
    @IsString()
    @IsOptional()
    phoneNumber?: string;

    /**
     * SHA-512
     */
    @Column({ length: 128 })
    @IsString()
    @Length(128)
    password!: string;

    /**
     * generateSalt에 의해 들어간 값.
     */
    @Column({ length: 64 })
    private passwordSalt!: string;

    @Column()
    @IsString()
    @Length(2)
    countryCode!: string;

    @Column()
    @IsString()
    @MaxLength(32)
    timezone!: string;

    @Column()
    @IsString()
    @Length(2)
    language!: string;

    @Column({ nullable: true })
    @IsDate()
    @IsOptional()
    registeredAt?: Date;

    @Column({ nullable: true })
    @IsDate()
    @IsOptional()
    unregisteredAt?: Date;

    @Column({ nullable: true })
    @IsDate()
    @IsOptional()
    termsAgreedAt?: Date;

    @Column({ nullable: true })
    @IsDate()
    @IsOptional()
    privacyAgreedAt?: Date;

    /**
     *
     */
    public toNullable(): Nullable<User> {
        throw new Error(`NOT IMPLEMENTED ${this}`);
    }

    constructor(args?: CtorType) {
        super();
        if (args) {
            this.email = args.email;
            this.phoneNumber = args.phoneNumber;
            this.countryCode = args.countryCode;
            this.timezone = args.timezone;
            this.language = args.language;

            this.changePassword(args.password);

            // NOTE: 아래 컬럼은 현재 기획상 별도로 관리되어야 하는 non-audit column
            const now = new Date();
            this.registeredAt = now;
            this.termsAgreedAt = now;
            this.privacyAgreedAt = now;
        }
    }

    static async of(args: CtorType): Promise<User> {
        const rs = new User(args);
        await rs.validate();
        return rs;
    }

    /**
     * 기본적인 사용자 정보를 업데이트 할 수 있음
     */
    async update({ firstName, lastName, countryCode, timezone, language }: UserUpdateType): Promise<User> {
        if (firstName !== undefined) {
            this.firstName = firstName;
        }
        if (lastName !== undefined) {
            this.lastName = lastName;
        }
        if (countryCode !== undefined) {
            this.countryCode = countryCode;
        }
        if (timezone !== undefined) {
            this.timezone = timezone;
        }
        if (language !== undefined) {
            this.language = language;
        }

        try {
            await this.validate();
        } catch (err) {
            throw badRequest<ResponseError>('사용자 모델 validate 실패', {
                errorCode: 'UNHANDLED',
                errorMessage: 'Unacceptable format.',
            });
        }
        return this;
    }

    /**
     * 패스워드 변경
     */
    changePassword(originPassword: string) {
        this.passwordSalt = generateSalt();
        this.password = generateHash(`${originPassword}${this.passwordSalt}`);
    }

    /**
     * 모델이 갖고 있는 패스워드가 인자의 패스워드와 동일한지 검사함.
     * throw하지 않으면 유효한것.
     */
    async validatePassword(password: string): Promise<User> {
        const expectedPassword = generateHash(`${password}${this.passwordSalt}`);
        if (this.password !== expectedPassword) {
            throw badRequest<ResponseError>('패스워드 검증 실패', {
                errorCode: 'UNAUTH',
                errorMessage: 'Authentication failed', // TODO: 에러 메세지!!
            });
        }
        return this;
    }

    /**
     * 이메일 변경.
     * TODO: 미래엔 복잡해질것
     * TODO: 인증 관련 처리
     * @param email
     */
    changeEmail(email: string) {
        this.email = email;
    }

    /**
     * 연락처 변경.
     * TODO: 미래엔 복잡해질것
     * TODO: 인증 관련 처리
     * @param phoneNumber
     */
    changePhoneNumber(phoneNumber: string) {
        this.phoneNumber = phoneNumber;
    }
}
