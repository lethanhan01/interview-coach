import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../infrastructure/database/prisma/prisma.service';
import { resolveRuntimeRole } from '@core/runtime/runtime-role';

type DependencyStatus = 'up' | 'down';

export interface DependencyHealth {
  status: DependencyStatus;
  latencyMs: number;
  error?: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async check() {
    const [db, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);
    return {
      status: db.status === 'up' && redis.status === 'up' ? 'ok' : 'degraded',
      role: resolveRuntimeRole(),
      timestamp: new Date().toISOString(),
      services: { db, redis },
    };
  }

  private async checkDatabase(): Promise<DependencyHealth> {
    const startedAt = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - startedAt };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - startedAt,
        error: this.formatError(error),
      };
    }
  }

  private async checkRedis(): Promise<DependencyHealth> {
    const startedAt = Date.now();
    const client = new Redis({
      host: this.config.get<string>('REDIS_HOST') ?? 'localhost',
      port: this.config.get<number>('REDIS_PORT') ?? 6379,
      lazyConnect: true,
      connectTimeout: 1_500,
      commandTimeout: 1_500,
      maxRetriesPerRequest: 0,
      enableReadyCheck: false,
    });

    try {
      await client.connect();
      await client.ping();
      return { status: 'up', latencyMs: Date.now() - startedAt };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - startedAt,
        error: this.formatError(error),
      };
    } finally {
      client.disconnect();
    }
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
