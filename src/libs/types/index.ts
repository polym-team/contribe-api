import { ParameterizedContext } from 'koa';
import { ContainerInstance } from 'typedi';

export type Nullable<T> = { [P in keyof T]: undefined extends T[P] ? T[P] | null : T[P] };
export type Paginated<T> = { items: T; count: number };
export type ServerContext = ParameterizedContext<{ txId: string; container: ContainerInstance; user?: any }>; // TODO: user any
