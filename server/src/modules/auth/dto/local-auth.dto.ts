import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ format: 'email', example: 'user@example.com' })
  @IsEmail()
  email: string;
  @ApiProperty({ minLength: 12, maxLength: 128, format: 'password' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password: string;
  @ApiProperty({ maxLength: 100, example: 'An' })
  @IsString()
  @MaxLength(100)
  @Matches(/\S/, { message: 'firstname must not be blank' })
  firstname: string;
  @ApiProperty({ maxLength: 100, example: 'Nguyen' })
  @IsString()
  @MaxLength(100)
  @Matches(/\S/, { message: 'lastname must not be blank' })
  lastname: string;
}

export class LoginDto {
  @ApiProperty({ format: 'email', example: 'user@example.com' })
  @IsEmail()
  email: string;
  @ApiProperty({ format: 'password' }) @IsString() password: string;
}

export class ChangePasswordDto {
  @ApiProperty({ format: 'password' }) @IsString() currentPassword: string;
  @ApiProperty({ minLength: 12, maxLength: 128, format: 'password' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword: string;
}

export class PasswordResetRequestDto {
  @ApiProperty({ format: 'email', example: 'user@example.com' })
  @IsEmail()
  email: string;
}
export class PasswordResetConfirmDto {
  @ApiProperty({ format: 'email' }) @IsEmail() email: string;
  @ApiProperty({ example: '123456' }) @IsString() code: string;
  @ApiProperty({ minLength: 12, maxLength: 128, format: 'password' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  newPassword: string;
}

export class VerifyEmailConfirmDto {
  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be a 6-digit numeric string' })
  code: string;
}

