import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(
  password: string,
  encoded: string,
): Promise<boolean> {
  const [algorithm, salt, expected] = encoded.split('$');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const derived = (await scrypt(
    password,
    Buffer.from(salt, 'base64url'),
    64,
  )) as Buffer;
  const expectedBuffer = Buffer.from(expected, 'base64url');
  return (
    expectedBuffer.length === derived.length &&
    timingSafeEqual(expectedBuffer, derived)
  );
}
