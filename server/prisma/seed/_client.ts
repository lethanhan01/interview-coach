import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createClient } from '@supabase/supabase-js';
import type { WebSocketLikeConstructor } from '@supabase/supabase-js';
import WebSocket from 'ws';

const SUPABASE_REALTIME_TRANSPORT =
  WebSocket as unknown as WebSocketLikeConstructor;

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

export const DEMO_EMAIL = 'demo@interviewai.dev';
export const DEMO_PASSWORD = 'Demo@123456';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: SUPABASE_REALTIME_TRANSPORT },
  },
);
