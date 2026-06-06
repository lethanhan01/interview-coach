import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';
import { ErrorCode } from '../common/exceptions/error-code.enum';
import { RefreshResponseDto } from './dto/refresh-response.dto';

@Injectable()
export class AuthService {
  private readonly supabase: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    this.supabase = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  async refreshToken(refreshToken: string): Promise<RefreshResponseDto> {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session) {
      throw new InterviewAIException(
        ErrorCode.TOKEN_EXPIRED,
        HttpStatus.UNAUTHORIZED,
        'Refresh token invalid or expired',
      );
    }
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in ?? 3600,
    };
  }

  async logout(userId: string): Promise<void> {
    const { error } = await this.supabase.auth.admin.signOut(userId);
    if (error) {
      throw new InterviewAIException(
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Logout failed',
      );
    }
  }
}
