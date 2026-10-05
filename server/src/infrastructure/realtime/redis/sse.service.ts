import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
  MessageEvent,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, map } from 'rxjs';
import Redis from 'ioredis';

const DEFAULT_REDIS_CONNECT_TIMEOUT_MS = 10_000;
const DEFAULT_REDIS_COMMAND_TIMEOUT_MS = 3_000;

interface SseMessage {
  event: string;
  data: unknown;
}

@Injectable()
export class SseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SseService.name);
  private publisher!: Redis;
  private subscriber!: Redis;
  private readonly channelSubscribers = new Map<string, number>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const password = this.config.get<string>('REDIS_PASSWORD') || undefined;
    const connectTimeout = this.readPositiveMs(
      'REDIS_CONNECT_TIMEOUT_MS',
      DEFAULT_REDIS_CONNECT_TIMEOUT_MS,
    );
    const commandTimeout = this.readPositiveMs(
      'REDIS_COMMAND_TIMEOUT_MS',
      DEFAULT_REDIS_COMMAND_TIMEOUT_MS,
    );
    const options = {
      host: this.config.get<string>('REDIS_HOST'),
      port: this.config.get<number>('REDIS_PORT'),
      ...(password ? { password } : {}),
      connectTimeout,
    };
    this.publisher = new Redis({ ...options, commandTimeout });
    // Subscriber stays in subscribe mode, so no commandTimeout is applied.
    this.subscriber = new Redis(options);

    this.publisher.on('error', (err: Error) => {
      this.logger.warn(`SSE Redis publisher connection error: ${err.message}`);
    });
    this.subscriber.on('error', (err: Error) => {
      this.logger.warn(`SSE Redis subscriber connection error: ${err.message}`);
    });
  }

  private readPositiveMs(key: string, fallback: number): number {
    const value = Number(this.config.get<number | string>(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  async onModuleDestroy() {
    await Promise.all([this.publisher.quit(), this.subscriber.quit()]);
  }

  async emit(channel: string, event: string, data: unknown): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify({ event, data }));
  }

  async emitError(channel: string, code: string, message: string): Promise<void> {
    await this.emit(channel, 'error', {
      error: {
        code,
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }

  subscribe(channel: string): Observable<MessageEvent> {
    return new Observable<SseMessage>((observer) => {
      const subscriberCount = this.channelSubscribers.get(channel) ?? 0;
      this.channelSubscribers.set(channel, subscriberCount + 1);
      if (subscriberCount === 0) {
        void this.subscriber.subscribe(channel, (err) => {
          if (err) observer.error(err);
        });
      }
      const handler = (receivedChannel: string, message: string) => {
        if (receivedChannel !== channel) return;
        try {
          observer.next(JSON.parse(message) as SseMessage);
        } catch {
          this.logger.warn(`Failed to parse SSE message on channel ${channel}`);
        }
      };
      this.subscriber.on('message', handler);
      return () => {
        this.subscriber.off('message', handler);
        const remainingSubscribers =
          (this.channelSubscribers.get(channel) ?? 1) - 1;
        if (remainingSubscribers <= 0) {
          this.channelSubscribers.delete(channel);
          // convention: Rule 6 - Non-fatal cleanup: unsubscription error during client disconnect
          this.subscriber.unsubscribe(channel).catch((err: unknown) => {
            this.logger.debug?.(
              `Failed to unsubscribe from Redis channel ${channel}: ${err instanceof Error ? err.message : String(err)}`,
            );
          });
        } else this.channelSubscribers.set(channel, remainingSubscribers);
      };
    }).pipe(
      map(
        (msg): MessageEvent => ({
          type: msg.event,
          data: msg.data as string | object,
        }),
      ),
    );
  }
}
