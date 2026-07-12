import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  buildPgConnectionConfig,
  quotePostgresLiteral,
  resolveDbTimeZone,
} from './db-timezone';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const adapter = new PrismaPg({
      ...buildPgConnectionConfig(process.env['DATABASE_URL']),
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
    super({
      adapter,
      transactionOptions: {
        maxWait: 10_000,
        timeout: 15_000,
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.$executeRawUnsafe(
      `SET TIME ZONE ${quotePostgresLiteral(resolveDbTimeZone())}`,
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
