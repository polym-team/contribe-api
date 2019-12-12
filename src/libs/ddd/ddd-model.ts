import { validate } from 'class-validator';
import { flatMap } from 'lodash';
import { CreateDateColumn, UpdateDateColumn, Column } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Nullable } from '../types';
import { DddEvent } from './ddd-event';

export abstract class DddModel<T> {
    /**
     * Primary key를 제공하는 메서드 구현.
     */
    public getId(): number | string {
        const identifierKey: string = Reflect.getMetadata(
            `model:${this.constructor.name}:id`,
            this.constructor.prototype,
        );
        // TODO: ts-ignore 없이는 못하나?
        // @ts-ignore
        return this[identifierKey];
    }

    /**
     *
     */
    protected getClasses(): Function[] {
        return [this.constructor];
    }

    /**
     * FIXME: this 의 date type property 가 toNullable() 하면 string 으로 바뀌는것 같다
     */
    public toNullable(): Nullable<T> {
        const nullable = {};
        // TODO: MP-573
        const propertyKeys = new Set(
            flatMap(
                this.getClasses(), //
                (clazz) => Reflect.getMetadata(`model:${clazz.name}`, clazz.prototype),
            ).filter((key) => !!key),
        );
        propertyKeys.forEach((propertyKey) => {
            // FIXME: ts-ignore 없앨 수 있나?
            // @ts-ignore
            nullable[propertyKey] = typeof this[propertyKey] !== 'undefined' ? this[propertyKey] : null;
        });
        // FIXME: 더 좋은 방법이 있다면 수정해주면 좋겠다. https://github.com/Ecube-Labs/haulla-api/pull/86#issuecomment-517926696
        return nullable as Nullable<T>;
    }

    // #region Audit columns
    // 로직이나 쿼리로 인해 나중에 값이 채워지는 컬럼들이므로 validator로 검증하지 않는다.
    // Response로 사용하지 않는다.
    @Exclude()
    @CreateDateColumn()
    private createdAt!: Date;

    @Exclude()
    @Column()
    private createdBy!: string;

    @Exclude()
    @UpdateDateColumn()
    private updatedAt!: Date;

    @Exclude()
    @Column()
    private updatedBy!: string;
    // #endregion

    protected async validate() {
        const errors = await validate(this);
        if (errors.length) {
            throw errors;
        }
    }

    setTxId(txId: string) {
        if (!this.getId()) {
            this.createdBy = txId;
        }
        this.updatedBy = txId;
    }

    // #region event
    private events: DddEvent[] = [];

    protected publishEvent(event: DddEvent) {
        this.events.push(event);
    }

    public getPublishedEvents(): DddEvent[] {
        return [...this.events];
    }
    // #endregion
}

/**
 *
 */
export function Identifier(): Function {
    return (target: Object, propertyKey: string) => {
        // TODO: MP-573
        const metadataKey = `model:${target.constructor.name}:id`;
        const identifierKey = Reflect.getMetadata(metadataKey, target);
        if (identifierKey) {
            throw new Error('Only one identifier is allowed.');
        }
        Reflect.defineMetadata(metadataKey, propertyKey, target);
    };
}

/**
 *
 */
export function Property(): Function {
    // @ts-ignore
    return (target: Object, propertyKey: string) => {
        // TODO: MP-573
        const metadataKey = `model:${target.constructor.name}`;
        const propertyKeys = Reflect.getMetadata(metadataKey, target);
        if (propertyKeys) {
            Reflect.defineMetadata(metadataKey, [...propertyKeys, propertyKey], target);
        } else {
            Reflect.defineMetadata(metadataKey, [propertyKey], target);
        }
    };
}
