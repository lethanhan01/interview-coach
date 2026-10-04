import { UserRole } from '@prisma/client';

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
}

export interface AuthTokenVerifier {
  getAccessCookieName(): string;
  verifySessionToken(token: string): Promise<AuthenticatedUserPayload>;
}

export const AUTH_TOKEN_VERIFIER = Symbol('AUTH_TOKEN_VERIFIER');
