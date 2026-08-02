import { Client } from 'pg';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const client = new Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

// Get ALL policies in the public schema
const r = await client.query(
  "SELECT schemaname, tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname"
);
console.log('All policies:', JSON.stringify(r.rows, null, 2));

// Search for any that reference users.role
const policies_with_role = r.rows.filter(p => 
  (p.qual && p.qual.includes('role')) || 
  (p.with_check && p.with_check.includes('role'))
);
console.log('\nPolicies referencing role:', JSON.stringify(policies_with_role, null, 2));

await client.end();
