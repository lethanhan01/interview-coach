import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestStore {
  requestId: string;
  correlationId: string;
  userId?: string;
  startTime: number;
}

export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestStore>();

  static run<R>(store: RequestStore, callback: () => R): R {
    return this.storage.run(store, callback);
  }

  static get(): RequestStore | undefined {
    return this.storage.getStore();
  }

  static getCorrelationId(): string {
    return this.storage.getStore()?.correlationId ?? 'no-correlation-id';
  }

  static getRequestId(): string {
    return this.storage.getStore()?.requestId ?? 'no-request-id';
  }

  static getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }
}
