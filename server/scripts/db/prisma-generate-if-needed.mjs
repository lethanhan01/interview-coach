import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const serverRoot = resolve(import.meta.dirname, '..', '..');
const sourceSchema = resolve(serverRoot, 'prisma', 'schema.prisma');
const generatedDir = resolve(serverRoot, 'node_modules', '.prisma', 'client');
const generatedSchema = resolve(generatedDir, 'schema.prisma');
const generatedEntry = resolve(generatedDir, 'index.js');
const generatedTypes = resolve(generatedDir, 'index.d.ts');
const stampFile = resolve(generatedDir, '.schema-sha256');

const normalizedSha256 = (filePath) =>
  createHash('sha256')
    .update(readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n'))
    .digest('hex');

const force = process.argv.includes('--force');
const currentHash = existsSync(sourceSchema)
  ? normalizedSha256(sourceSchema)
  : null;

const hasClientFiles =
  Boolean(currentHash) &&
  existsSync(generatedEntry) &&
  existsSync(generatedTypes);

const matchesStamp =
  hasClientFiles &&
  existsSync(stampFile) &&
  readFileSync(stampFile, 'utf8').trim() === currentHash;

const matchesGeneratedSchema =
  hasClientFiles &&
  existsSync(generatedSchema) &&
  normalizedSha256(generatedSchema) === currentHash;

if (!force && (matchesStamp || matchesGeneratedSchema)) {
  if (!matchesStamp) {
    writeFileSync(stampFile, currentHash, 'utf8');
  }
  console.log('[prisma] Client is up to date — skipping prisma generate.');
  process.exit(0);
}

console.log(
  '[prisma] Schema changed or client missing — running prisma generate...',
);
const result = spawnSync('npx', ['prisma', 'generate'], {
  cwd: serverRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if ((result.status ?? 1) === 0 && currentHash && existsSync(generatedDir)) {
  writeFileSync(stampFile, currentHash, 'utf8');
}

process.exit(result.status ?? 1);
