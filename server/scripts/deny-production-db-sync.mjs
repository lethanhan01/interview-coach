const operation = process.argv[2] ?? 'database operation';

if (process.env.NODE_ENV === 'production') {
  console.error(
    `Refusing ${operation} in production. Use reviewed migrations and an approved backup/PITR runbook instead.`,
  );
  process.exit(1);
}
