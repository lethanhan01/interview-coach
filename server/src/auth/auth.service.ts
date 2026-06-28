import { Injectable } from '@nestjs/common';
import { RefreshResponseDto } from './dto/refresh-response.dto';

@Injectable()
export class AuthService {
  async refreshToken(): Promise<RefreshResponseDto> {
    return {
      accessToken: 'dev-mock-token',
      refreshToken: 'mvp-refresh-token',
      expiresIn: 3600,
    };
  }

  async logout(): Promise<void> {
    return undefined;
  }
}
