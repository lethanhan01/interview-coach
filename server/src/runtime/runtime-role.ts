export type RuntimeRole = 'api' | 'worker' | 'all';

export function resolveRuntimeRole(
  argv = process.argv,
  env = process.env,
): RuntimeRole {
  const argument = argv.find((value) => value.startsWith('--role='));
  const value = argument?.slice('--role='.length) ?? env.RUNTIME_ROLE;
  if (value === undefined)
    return env.WORKERS_ENABLED === 'false' ? 'api' : 'all';
  if (value === 'api' || value === 'worker' || value === 'all') return value;
  throw new Error('RUNTIME_ROLE must be api, worker, or all');
}

export function workersEnabled(): boolean {
  return resolveRuntimeRole() !== 'api';
}
