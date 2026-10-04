export const SESSION_TYPES = ['hr', 'technical'] as const;

export type SessionType = (typeof SESSION_TYPES)[number];

export function isSessionType(value: string): value is SessionType {
  return (SESSION_TYPES as readonly string[]).includes(value);
}
