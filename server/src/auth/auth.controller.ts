import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './dto/authenticated-user.dto';

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Returns the current authenticated user's profile including their role.
   * Used by the client to hydrate auth context after login.
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async me(@Req() req: AuthenticatedRequest) {
    const user = req.user!;
    const dbUser = await this.authService.getMe(user.id);
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }
    return {
      success: true,
      data: {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        status: dbUser.status,
        emailVerified: user.emailVerified,
      },
    };
  }

  /**
   * Logout endpoint — client should also call supabase.auth.signOut().
   * This endpoint is kept for any server-side cleanup if needed.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
