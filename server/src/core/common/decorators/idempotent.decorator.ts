import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_METADATA_KEY = 'IDEMPOTENT_METADATA_KEY';

export interface IdempotentOptions {
  /**
   * If true, requests to this endpoint MUST provide an Idempotency-Key header.
   * If false or omitted, the idempotency mechanism activates only when the header is provided.
   */
  required?: boolean;

  /**
   * Custom cache time-to-live for completed response in seconds.
   * Defaults to 86400 (24 hours).
   */
  ttlSeconds?: number;
}

/**
 * Decorator to configure HTTP Redis Idempotency on mutation endpoints.
 */
export const Idempotent = (options: IdempotentOptions = {}) =>
  SetMetadata(IDEMPOTENT_METADATA_KEY, options);
