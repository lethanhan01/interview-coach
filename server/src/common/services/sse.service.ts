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

interface SseMessage {
  event: string;
  data: unknown;
}

@Injectable()
export class SseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SseService.name);
  private publisher: Redis;
  private subscriber: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const options = {
      host: this.config.get<string>('REDIS_HOST'),
      port: this.config.get<number>('REDIS_PORT'),
    };
    this.publisher = new Redis(options);
    this.subscriber = new Redis(options);
  }

  async onModuleDestroy() {
    await this.publisher.quit();
    await this.subscriber.quit();
  }

  async emit(channel: string, event: string, data: unknown): Promise<void> {
    const payload = JSON.stringify({ event, data });
    await this.publisher.publish(channel, payload);
  }

  subscribe(channel: string): Observable<MessageEvent> {
    return new Observable<SseMessage>((observer) => {
      this.subscriber.subscribe(channel, (err) => {
        if (err) {
          observer.error(err);
        }
      });

      const handler = (receivedChannel: string, message: string) => {
        if (receivedChannel === channel) {
          try {
            const parsed = JSON.parse(message) as SseMessage;
            observer.next(parsed);
          } catch {
            this.logger.warn(
              `Failed to parse SSE message on channel ${channel}`,
            );
          }
        }
      };

      this.subscriber.on('message', handler);

      return () => {
        this.subscriber.off('message', handler);
        this.subscriber.unsubscribe(channel).catch(() => {});
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
