import { AccountStatus, UserRole } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ enum: AccountStatus })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;
}
