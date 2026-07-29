import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

// Get RLS policies on users table
const r = await client.query(
  "SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public'"
);
console.log('RLS Policies on users:', JSON.stringify(r.rows, null, 2));

// Get column type
const r2 = await client.query(
  "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='users'"
);
console.log('Columns:', JSON.stringify(r2.rows, null, 2));

await client.end();
