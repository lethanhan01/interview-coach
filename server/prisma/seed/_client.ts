import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { buildPgConnectionConfig } from '../../src/prisma/db-timezone';

export const prisma = new PrismaClient({
  adapter: new PrismaPg(buildPgConnectionConfig(process.env['DATABASE_URL'])),
});

export const DEMO_EMAIL = 'demo@interviewai.dev';
export const DEMO_PASSWORD = 'Demo@123456!';
