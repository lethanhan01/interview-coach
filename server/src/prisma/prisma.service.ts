import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
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
const DEFAULT_TRANSACTION_MAX_WAIT_MS = 15_000;
const DEFAULT_TRANSACTION_TIMEOUT_MS = 30_000;
const DEFAULT_CONNECT_RETRIES = 3;
const DEFAULT_CONNECT_RETRY_DELAY_MS = 1_500;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private bootstrapDatabaseAvailable = false;

  constructor() {
    const adapter = new PrismaPg({
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
    });
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
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
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

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.$connect();
        await this.$queryRaw`SELECT 1`;
        this.bootstrapDatabaseAvailable = true;
        return;
      } catch (error) {
        const transient = isTransientPrismaConnectionError(error);
        const formattedError = formatDatabaseStartupError(error);

        if (!transient) {
          this.logger.error(
            `Prisma startup check failed with a non-transient database error: ${formattedError}`,
          );
          throw error;
        }

        if (attempt === maxAttempts) {
          this.logger.warn(
            `Database is unavailable after ${maxAttempts} startup attempt(s). The API will continue booting and /health will report db=down until the connection recovers. Last error: ${formattedError}`,
          );
          return;
        }

        this.logger.warn(
          `Database startup check failed on attempt ${attempt}/${maxAttempts}; retrying in ${retryDelayMs}ms. Error: ${formattedError}`,
        );
        await delay(retryDelayMs);
      }
    }
  }
}

function readPositiveIntEnv(name: string, defaultValue: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return defaultValue;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
