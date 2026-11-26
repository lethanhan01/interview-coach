import { IsBoolean, IsEmail, IsEnum, IsUUID } from 'class-validator';
import { UserRole } from '@core/common/enums';

export class AuthenticatedUser {
  @IsUUID()
  id: string;

  @IsEmail()
  email: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsBoolean()
  emailVerified: boolean;
}
