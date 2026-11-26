import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildPgConnectionConfig } from './db-timezone';
import {
  formatDatabaseStartupError,
  isTransientPrismaConnectionError,
} from './prisma-connection-error';

const DEFAULT_POOL_MAX = 5;
const DEFAULT_CONNECTION_TIMEOUT_MS = 30_000;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;
const DEFAULT_KEEPALIVE_INITIAL_DELAY_MS = 10_000;
const DEFAULT_MAX_LIFETIME_SECONDS = 1_800;
const DEFAULT_TRANSACTION_MAX_WAIT_MS = 15_000;
const DEFAULT_TRANSACTION_TIMEOUT_MS = 30_000;
const DEFAULT_CONNECT_RETRIES = 3;
const DEFAULT_CONNECT_RETRY_DELAY_MS = 1_500;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger: Logger;
  private bootstrapDatabaseAvailable = false;
  constructor() {
    const logger = new Logger(PrismaService.name);
    const adapter = new PrismaPg(
      {
        ...buildPgConnectionConfig(process.env['DATABASE_URL']),
        max: readPositiveIntEnv('PRISMA_POOL_MAX', DEFAULT_POOL_MAX),
        connectionTimeoutMillis: readPositiveIntEnv(
          'PRISMA_CONNECTION_TIMEOUT_MS',
          DEFAULT_CONNECTION_TIMEOUT_MS,
        ),
        idleTimeoutMillis: readPositiveIntEnv(
          'PRISMA_IDLE_TIMEOUT_MS',
          DEFAULT_IDLE_TIMEOUT_MS,
        ),
        keepAlive: true,
        keepAliveInitialDelayMillis: DEFAULT_KEEPALIVE_INITIAL_DELAY_MS,
        maxLifetimeSeconds: DEFAULT_MAX_LIFETIME_SECONDS,
      },
      {
        onPoolError: (error) => {
          logger.warn(
            `PostgreSQL idle pool client error (connection evicted): ${formatDatabaseStartupError(error)}`,
          );
        },
        onConnectionError: (error) => {
          logger.warn(
            `PostgreSQL active connection error: ${formatDatabaseStartupError(error)}`,
          );
        },
      },
    );
    super({
      adapter,
      transactionOptions: {
        maxWait: readPositiveIntEnv(
          'PRISMA_TRANSACTION_MAX_WAIT_MS',
          DEFAULT_TRANSACTION_MAX_WAIT_MS,
        ),
        timeout: readPositiveIntEnv(
          'PRISMA_TRANSACTION_TIMEOUT_MS',
          DEFAULT_TRANSACTION_TIMEOUT_MS,
        ),
      },
    });
    this.logger = logger;
  }
  async onModuleInit() {
    await this.connectWithRetry();
  }
  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      this.logger.warn(
        `Prisma disconnect encountered an error during shutdown: ${formatDatabaseStartupError(error)}`,
      );
    }
  }
  isBootstrapDatabaseAvailable(): boolean {
    return this.bootstrapDatabaseAvailable;
  }
  private async connectWithRetry(): Promise<void> {
    const maxAttempts = readPositiveIntEnv(
      'PRISMA_CONNECT_RETRIES',
      DEFAULT_CONNECT_RETRIES,
    );
    const retryDelayMs = readPositiveIntEnv(
      'PRISMA_CONNECT_RETRY_DELAY_MS',
      DEFAULT_CONNECT_RETRY_DELAY_MS,
    );
    await this.connectAttempt(1, maxAttempts, retryDelayMs);
  }
  private async connectAttempt(
    attempt: number,
    maxAttempts: number,
    retryDelayMs: number,
  ): Promise<void> {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.bootstrapDatabaseAvailable = true;
    } catch (error) {
      const transient = isTransientPrismaConnectionError(error);
      const formattedError = formatDatabaseStartupError(error);
      if (!transient) {
        this.logger.error(
          `Prisma startup check failed with a non-transient database error: ${formattedError}`,
        );
        throw error;
      }
      if (attempt >= maxAttempts) {
        this.logger.warn(
          `Database is unavailable after ${maxAttempts} startup attempt(s). The API will continue booting and /health will report db=down until the connection recovers. Last error: ${formattedError}`,
        );
        return;
      }
      this.logger.warn(
        `Database startup check failed on attempt ${attempt}/${maxAttempts}; retrying in ${retryDelayMs}ms. Error: ${formattedError}`,
      );
      await delay(retryDelayMs);
      await this.connectAttempt(attempt + 1, maxAttempts, retryDelayMs);
    }
  }
}
function readPositiveIntEnv(name: string, defaultValue: number): number {
  const rawValue = process.env[name];
  if (!rawValue) return defaultValue;
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw new Error(`${name} must be a positive integer.`);
  return parsed;
}
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
