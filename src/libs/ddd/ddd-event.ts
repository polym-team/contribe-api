import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    BeforeInsert,
    AfterLoad,
} from 'typeorm';

@Entity()
export abstract class DddEvent {
    @PrimaryGeneratedColumn({ unsigned: true })
    private id!: number;

    @Column()
    type: string;

    @Column()
    private occurredAt: Date;

    @Column()
    txId!: string;

    @CreateDateColumn()
    private createdAt!: Date;

    @UpdateDateColumn()
    private updatedAt!: Date;

    // All stringified properties of the event except the properties which occupy columns.
    @Column()
    private data!: string;

    @BeforeInsert()
    private serialize() {
        const { id, type, occurredAt, txId, createdAt, updatedAt, data, ...props } = this;
        this.data = JSON.stringify(props);
    }

    @AfterLoad()
    private deserialize() {
        const props = JSON.parse(this.data);
        Object.assign(this, props);
    }

    constructor() {
        this.type = this.constructor.name;
        this.occurredAt = new Date();
    }

    withTxId(txId: string) {
        this.txId = txId;
        return this;
    }
}
