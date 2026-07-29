/**
 * Manual migration script: Add UserRole enum to PostgreSQL
 * Executes statements one by one (no single transaction) to avoid ALTER TYPE + policy conflicts
 */
import { Client } from 'pg';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env') });

const client = new Client({ connectionString: process.env.DIRECT_URL });

const statements = [
  // Step 1: Create UserRole enum if not exists
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
      CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
    END IF;
  END $$`,
  // Step 2: Drop old check constraint
  `ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role`,
  // Step 3: Migrate 'candidate' data to 'user'
  `UPDATE users SET role = 'user' WHERE role = 'candidate' OR role NOT IN ('user', 'admin')`,
  // Step 4: Drop ALL RLS policies referencing users.role (any table)
  `DROP POLICY IF EXISTS "users: admin read all" ON users`,
  `DROP POLICY IF EXISTS "users: admin update status" ON users`,
  `DROP POLICY IF EXISTS "users: read own" ON users`,
  `DROP POLICY IF EXISTS "users: update own" ON users`,
  `DROP POLICY IF EXISTS "question_bank: admin delete" ON question_bank`,
  `DROP POLICY IF EXISTS "question_bank: admin insert" ON question_bank`,
  `DROP POLICY IF EXISTS "question_bank: admin update" ON question_bank`,
  // Step 5: Drop column default before type change
  `ALTER TABLE users ALTER COLUMN role DROP DEFAULT`,
  // Step 6: Convert column type to enum
  `ALTER TABLE users ALTER COLUMN role TYPE "UserRole" USING role::"UserRole"`,
  // Step 7: Restore default
  `ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user'::"UserRole"`,
  // Step 8: Recreate users RLS policies with enum types
  `CREATE POLICY "users: admin read all"
    ON users FOR SELECT
    USING ((SELECT u.role FROM users u WHERE u.id = auth.uid()) = 'admin'::"UserRole")`,
  `CREATE POLICY "users: admin update status"
    ON users FOR UPDATE
    USING ((SELECT u.role FROM users u WHERE u.id = auth.uid()) = 'admin'::"UserRole")`,
  `CREATE POLICY "users: read own"
    ON users FOR SELECT USING (id = auth.uid())`,
  `CREATE POLICY "users: update own"
    ON users FOR UPDATE USING (id = auth.uid())`,
  // Step 9: Recreate question_bank admin RLS policies
  `CREATE POLICY "question_bank: admin delete"
    ON question_bank FOR DELETE
    USING ((SELECT u.role FROM users u WHERE u.id = auth.uid()) = 'admin'::"UserRole")`,
  `CREATE POLICY "question_bank: admin insert"
    ON question_bank FOR INSERT
    WITH CHECK ((SELECT u.role FROM users u WHERE u.id = auth.uid()) = 'admin'::"UserRole")`,
  `CREATE POLICY "question_bank: admin update"
    ON question_bank FOR UPDATE
    USING ((SELECT u.role FROM users u WHERE u.id = auth.uid()) = 'admin'::"UserRole")`,
];

try {
  await client.connect();
  console.log('Connected to database');
  for (const stmt of statements) {
    const preview = stmt.trim().substring(0, 80).replace(/\n/g, ' ');
    process.stdout.write(`  Running: ${preview}... `);
    await client.query(stmt);
    console.log('OK');
  }
  console.log('\n✅ Migration completed successfully');
} catch (err) {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
} finally {
  await client.end();
}

