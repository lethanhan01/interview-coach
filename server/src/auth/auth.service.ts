import { Injectable } from '@nestjs/common';
import { RefreshResponseDto } from './dto/refresh-response.dto';

@Injectable()
export class AuthService {
  refreshToken(): Promise<RefreshResponseDto> {
    return Promise.resolve({
      accessToken: 'dev-mock-token',
      refreshToken: 'mvp-refresh-token',
      expiresIn: 3600,
    });
  }

  logout(): Promise<void> {
    return Promise.resolve();
  }
}
