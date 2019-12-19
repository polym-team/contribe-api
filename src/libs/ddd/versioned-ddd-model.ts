import { VersionColumn } from '../orm';
import { DddModel } from './ddd-model';

export abstract class VersionedDddModel<T extends VersionedDddModel<T>> extends DddModel<T> {
    // NOTE:
    // - version 은 not null 이어야 한다.
    // - DddModel -> VersionedDddModel 로 변경할 경우 version 이 null 이 되는 것을 막기 위해 version = 1 을 기본값으로 설정한다.
    // - version = 0 으로 하지 않은 이유는 !0 과 !undefined 모두 true 로 evaluate 하기 때문에 버그를 예방하기 위해서.
    @VersionColumn({ default: 1 })
    public version!: number;
}
