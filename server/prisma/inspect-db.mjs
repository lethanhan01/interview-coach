import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const client = new Client({ connectionString: process.env.DIRECT_URL });
await client.connect();
console.log('Connected');

const r1 = await client.query(
  "SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'users'::regclass"
);
console.log('Constraints:', JSON.stringify(r1.rows, null, 2));

const r2 = await client.query(
  'SELECT typname, enumlabel FROM pg_type JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid ORDER BY typname, enumsortorder'
);
console.log('Enums:', JSON.stringify(r2.rows, null, 2));

const r3 = await client.query('SELECT DISTINCT role FROM users');
console.log('Distinct roles in users:', JSON.stringify(r3.rows, null, 2));

const r4 = await client.query("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'users'");
console.log('Users columns:', JSON.stringify(r4.rows, null, 2));

await client.end();
