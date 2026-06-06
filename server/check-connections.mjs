/**
 * Connection health check — Supabase + OpenAI
 * Run: node check-connections.mjs
 * Loads server/.env via dotenv
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manual .env parse (avoid dotenv dep issues)
function loadEnv(path) {
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv(resolve(__dirname, '.env'));

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
];

let allPresent = true;
for (const key of required) {
  if (!process.env[key]) {
    console.error(`MISSING env var: ${key}`);
    allPresent = false;
  }
}
if (!allPresent) process.exit(1);

// ── Supabase check ──────────────────────────────────────────────────────────

async function checkSupabase() {
  const url = process.env.SUPABASE_URL;
  // Validate URL format before connecting
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    throw new Error(`SUPABASE_URL format invalid — expected https://<ref>.supabase.co, got: ${url}`);
  }
  const client = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
  // Ping via rpc('now') — falls back gracefully if function doesn't exist
  const { error } = await client.rpc('now');
  if (error && error.code !== 'PGRST202') {
    // PGRST202 = function not found — that's fine, means connection worked
    throw new Error(`${error.message} (code: ${error.code})`);
  }
  return true;
}

// ── OpenAI check ────────────────────────────────────────────────────────────

async function checkOpenAI() {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // List models — no tokens consumed
  const models = await openai.models.list();
  const hasGpt4o = models.data.some((m) => m.id.startsWith('gpt-4o'));
  if (!hasGpt4o) throw new Error('gpt-4o not available on this API key');
  return true;
}

// ── Run ─────────────────────────────────────────────────────────────────────

let ok = true;

process.stdout.write('Supabase ... ');
try {
  await checkSupabase();
  console.log('OK');
} catch (e) {
  console.log(`FAIL — ${e.message}`);
  ok = false;
}

process.stdout.write('OpenAI   ... ');
try {
  await checkOpenAI();
  console.log('OK');
} catch (e) {
  console.log(`FAIL — ${e.message}`);
  ok = false;
}

process.exit(ok ? 0 : 1);
