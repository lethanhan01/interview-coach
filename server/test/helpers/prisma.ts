import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildPgConnectionConfig } from '../../src/infrastructure/database/prisma/db-timezone';

export const prisma = new PrismaClient({
  adapter: new PrismaPg(buildPgConnectionConfig(process.env['DATABASE_URL'])),
});
