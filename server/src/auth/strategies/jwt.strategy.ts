import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../dto/authenticated-user.dto';

interface SupabaseJwtPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('SUPABASE_JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  /**
   * Called after JWT signature is verified.
   * Role is initially set to 'user' as placeholder;
   * JwtAuthGuard will hydrate the real role from the database.
   */
  validate(payload: SupabaseJwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: UserRole.user, // placeholder — real role loaded from DB in guard
      emailVerified: Boolean((payload as { email_confirmed_at?: string }).email_confirmed_at),
    };
  }
}

