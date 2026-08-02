import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(12) @MaxLength(128) password: string;
  @IsString() @MaxLength(100) @Matches(/\S/, { message: 'firstname must not be blank' }) firstname: string;
  @IsString() @MaxLength(100) @Matches(/\S/, { message: 'lastname must not be blank' }) lastname: string;
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
  @IsEmail() email: string;
  @IsString() code: string;
  @IsString() @MinLength(12) @MaxLength(128) newPassword: string;
}
