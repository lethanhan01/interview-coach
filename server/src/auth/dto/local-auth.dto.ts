import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(12) @MaxLength(128) password: string;
  @IsOptional() @IsString() @MaxLength(200) fullName?: string;
}

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

export class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(12) @MaxLength(128) newPassword: string;
}

export class PasswordResetRequestDto {
  @IsEmail() email: string;
}

export class PasswordResetConfirmDto {
  @IsString() token: string;
  @IsString() @MinLength(12) @MaxLength(128) newPassword: string;
}
