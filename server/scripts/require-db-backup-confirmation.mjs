const value = String(process.env.DB_BACKUP_CONFIRMED ?? '').trim().toLowerCase();

if (value !== 'true' && value !== '1' && value !== 'yes') {
  throw new Error(
    'Set DB_BACKUP_CONFIRMED=true after backing up the database before running destructive sync commands.',
  );
}
