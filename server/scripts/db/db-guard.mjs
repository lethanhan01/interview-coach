const args = process.argv.slice(2);
const hasDenyProd =
  args.includes('--deny-prod') || args.some((a) => a.startsWith('db:'));
const hasRequireBackup = args.includes('--require-backup');
const operation = args.find((a) => !a.startsWith('--')) ?? 'database operation';

if (hasDenyProd && process.env.NODE_ENV === 'production') {
  console.error(
    `Refusing ${operation} in production. Use reviewed migrations and an approved backup/PITR runbook instead.`,
  );
  process.exit(1);
}

if (hasRequireBackup) {
  const value = String(process.env.DB_BACKUP_CONFIRMED ?? '')
    .trim()
    .toLowerCase();
  if (value !== 'true' && value !== '1' && value !== 'yes') {
    console.error(
      'Error: Set DB_BACKUP_CONFIRMED=true after backing up the database before running destructive sync commands.',
    );
    process.exit(1);
  }
}
