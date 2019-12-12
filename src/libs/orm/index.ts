import * as _ from 'lodash';
import {
    PrimaryGeneratedColumn as TypeOrmPrimaryGeneratedColumn,
    Column as TypeOrmColumn,
    LessThan,
    MoreThan,
    FindOperator,
    FindManyOptions as FindAllManyOptions,
    EntityManager,
} from 'typeorm';
import * as moment from 'moment';

export {
    EntityManager,
    getManager,
    Entity,
    ChildEntity,
    TableInheritance,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeUpdate,
    FindConditions,
    Raw,
    Not,
    IsNull,
    In,
    Like,
    Between,
    ObjectType,
    VersionColumn,
    PrimaryColumn,
    OneToMany,
    ManyToOne,
    PrimaryGeneratedColumn as PrimaryGeneratedColumn2,
    Column as Column2,
    AfterInsert,
} from 'typeorm';

export type FindAllManyOptions<T> = FindAllManyOptions<T>;

/**
 *
 */
export function PrimaryGeneratedColumn(...args: any[]): Function {
    // @ts-ignore
    const propertyDecorator = TypeOrmPrimaryGeneratedColumn(...args);
    return (target: Object, propertyKey: string) => {
        // TODO: MP-573
        const metadataKey = `model:${target.constructor.name}`;
        const propertyKeys = Reflect.getMetadata(metadataKey, target);
        if (propertyKeys) {
            Reflect.defineMetadata(metadataKey, [...propertyKeys, propertyKey], target);
        } else {
            Reflect.defineMetadata(metadataKey, [propertyKey], target);
        }
        propertyDecorator(target, propertyKey);
    };
}

/**
 *
 */
export function Column(...args: any[]): Function {
    // @ts-ignore
    const propertyDecorator = TypeOrmColumn(...args);
    return (target: Object, propertyKey: string) => {
        // TODO: MP-573
        const metadataKey = `model:${target.constructor.name}`;
        const propertyKeys = Reflect.getMetadata(metadataKey, target);
        if (propertyKeys) {
            Reflect.defineMetadata(metadataKey, [...propertyKeys, propertyKey], target);
        } else {
            Reflect.defineMetadata(metadataKey, [propertyKey], target);
        }
        propertyDecorator(target, propertyKey);
    };
}

/**
 * skip, take 외의 옵션은 허용하지 않는다
 * @see https://ecubelabs.atlassian.net/wiki/spaces/WIKI/pages/186384414
 */
export interface FindManyOptions {
    /**
     * Page (paginated) where from entities should be taken.
     * Starts from 1.
     */
    page?: number;
    /**
     * Limit (paginated) - max number of entities should be taken.
     */
    limit?: number;
}

/**
 * @param options
 */
export const convertOptions = (options?: FindManyOptions) => {
    let skip;
    let take;
    if (options && options.page) {
        skip = ((options.page || 1) - 1) * (options.limit || 1);
    }
    if (options && options.limit) {
        take = options.limit;
    }
    return {
        skip,
        take,
    };
};

/**
 *
 */
export interface FindOrder {
    order: {
        [prop: string]: 'DESC' | 'ASC';
    };
}

/**
 * @param prop
 */
export const desc = (prop: string): FindOrder => ({
    order: {
        [prop]: 'DESC',
    },
});

/**
 * @param prop
 */
export const asc = (prop: string): FindOrder => ({
    order: {
        [prop]: 'ASC',
    },
});

/**
 * LessThan is not working for date column
 * @see https://github.com/typeorm/typeorm/issues/2286
 * @param date
 */
export const LessThanDate = (date: Date) => LessThan(moment(date).format('YYYY-MM-DD HH:MM:SS'));

/**
 * MoreThan is not working for date column
 * @see https://github.com/typeorm/typeorm/issues/2286
 * @param date
 */
export const MoreThanDate = (date: Date) => MoreThan(moment(date).format('YYYY-MM-DD HH:MM:SS'));

/**
 * 중복된 데이터를 insert 하려는 경우 발생하는 에러.
 */
export class DuplicateEntryError extends Error {
    constructor(public driver: string) {
        super(driver);
        this.name = 'DuplicateEntryError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 각 드라이버마다 다른 에러 코드에 대한 에러 객체를 정의해둔다.
 * OrmError에서 에러를 만들때 사용함.
 */
const ErrorMap: {
    [key: string]: Record<number, any>; // TODO: any대신 ErrorConstructor 쓸 수 있게 바꿔야 함
} = {
    mysql: {
        1062: DuplicateEntryError,
    },
    sqlite: {
        19: DuplicateEntryError,
    },
};

class OrmError extends Error {
    /**
     * DB driver 상관 없이 추상화 된 에러를 반환하기 위해 존재한다.
     * @param err orm에서 반환한 에러를 입력받는다.
     * @param driver 어떤 드라이버를 사용했는지 입력받는다.
     */
    static of(err: any, driver: string) {
        const SelectedError = ErrorMap[driver][err.errno];
        return SelectedError ? new SelectedError(driver) : err;
    }
}

/**
 * @param entityManager
 */
export const throwBy = (entityManager: EntityManager) => {
    return (err: Error) => {
        const driver = entityManager.connection.options.type;
        throw OrmError.of(err, driver);
    };
};

/**
 * Array는 or 조건
 * Object는 and 조건을 표현한것이다.
 */
type Condition<T> = {
    [P in keyof T]?: Condition<T>[] | FindOperator<T | string | number> | string | number;
};

export const where = <T>(spec?: Specification<T> | Condition<T> | (Specification<T> | Condition<T>)[]) =>
    new Specification<T>(spec);

/**
 * **!! 주의 !!** 동일한 프로퍼티를 필터링 하는 경우 아래의 사용 예를 따라야 합니다.
 *
 * 쿼리로 치면 아래같은 느낌이다.
 * ```sql
 * select ~~~ from ~~~ where id in (1, 2, 3) and id in (1)
 * ```
 * 객체 필터링의 책임을 전부 orm에 넘기지 마세요.
 * ### 잘못된 예시
 * ```ts
 * const cond = where(isIdOfIn([1, 2, 3]))
 *     .and(isIdOfIn([1])); // 1, 2, 3 집합 속에서 다시 1만 가져오고 싶다?
 * repo.findAll(cond); // Error!
 * ```
 *
 * 원하는 값을 계산해서 넘겨야 합니다.
 * ### 올바른 예시
 * ```ts
 * const cond = where(isIdOfIn([1]));
 * repo.findAll(cond);
 * ```
 */
export class Specification<T> {
    where: Condition<T> | Condition<T>[] = {};

    get isEmpty(): boolean {
        if (_.isArray(this.where)) {
            return this.where.length === 0;
        }
        return Object.keys(this.where).length === 0;
    }

    // merge
    constructor(spec?: Specification<T> | Condition<T> | (Specification<T> | Condition<T>)[]) {
        if (spec) {
            this.where = _.isArray(spec)
                ? spec.map(Specification.specToCondition)
                : Specification.specToCondition(spec);
        }
    }

    static specToCondition<T>(spec: Specification<T> | Condition<T>) {
        if (spec instanceof Specification) {
            if (spec.isEmpty) {
                return {};
            }
            return spec.where;
        }
        return spec;
    }

    and(spec: Specification<T>): Specification<T> {
        if (spec.isEmpty) {
            return this;
        }
        // TODO: 개 거지같은 병합. 여러 라이브러리들이 원하는 형태로 머지하지 않아서 일단 대충 조건 맞춰서 함
        const src = { ...this.where };
        Object.keys(spec.where).forEach((key) => {
            if ((src as any)[key]) {
                // src가 이미 여러 조건을 담았을때
                if (_.isArray((src as any)[key])) {
                    // dst도 여러 대상이면 그냥 합침
                    if (_.isArray((spec.where as any)[key])) {
                        (src as any)[key] = [...(src as any)[key], ...(spec.where as any)[key]];
                    } else {
                        (src as any)[key] = [...(src as any)[key], (spec.where as any)[key]];
                    }
                } else if (_.isArray((spec.where as any)[key])) {
                    // dst가 여러 조건을 담았을때
                    (src as any)[key] = [(src as any)[key], ...(spec.where as any)[key]];
                } else {
                    // 양쪽 다 배열이 아닌 경우
                    (src as any)[key] = [(src as any)[key], (spec.where as any)[key]];
                }
            } else {
                // 이미 존재하는게 없으니 그냥 그대로 넣어줌
                (src as any)[key] = (spec.where as any)[key];
            }
        });
        this.where = src;
        return this;
    }

    or(spec: Specification<T>): Specification<T> {
        if (spec.isEmpty) {
            return this;
        }
        if (_.isArray(this.where)) {
            this.where = [...this.where];
        } else {
            this.where = [this.where];
        }

        if (_.isArray(spec.where)) {
            this.where.push(...spec.where);
        } else {
            this.where.push(spec.where);
        }
        return this;
    }
}
