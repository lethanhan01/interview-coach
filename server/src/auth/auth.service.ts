import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRole, type User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly supabase;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.supabase = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_ANON_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  async validateAccessToken(accessToken: string): Promise<{
    id: string;
    email: string;
    emailVerified: boolean;
  }> {
    const { data, error } = await this.supabase.auth.getClaims(accessToken);
    const claims = data?.claims;
    if (
      error ||
      !claims ||
      typeof claims.sub !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(claims.sub) ||
      typeof claims.email !== 'string'
    ) {
      throw new UnauthorizedException('Invalid or expired Supabase access token');
    }
    return {
      id: claims.sub,
      email: claims.email,
      emailVerified: Boolean(claims.email_confirmed_at),
    };
  }

  /**
   * Upsert user on first login. Creates a new user with role='user' if not exists.
   */
  async ensureUser(supabaseId: string, email: string): Promise<User> {
    return this.prisma.user.upsert({
      where: { id: supabaseId },
      update: { email }, // keep email in sync if it changes
      create: {
        id: supabaseId,
        email,
        role: UserRole.user,
        status: 'active',
      },
    });
  }

  /**
   * Get authenticated user info for /auth/me endpoint.
   */
  async getMe(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async logout(): Promise<void> {
    return Promise.resolve();
  }
}
