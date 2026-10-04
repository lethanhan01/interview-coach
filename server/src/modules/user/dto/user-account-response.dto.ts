import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserAccountResponseDto {
  @ApiProperty({ description: 'User identifier' })
  id: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiPropertyOptional({ description: 'First name', nullable: true })
  firstname: string | null;

  @ApiPropertyOptional({ description: 'Last name', nullable: true })
  lastname: string | null;

  @ApiProperty({ description: 'User role', enum: ['candidate', 'admin'] })
  role: string;

  @ApiProperty({
    description: 'Account status',
    enum: ['active', 'locked', 'deleted', 'password_reset_required'],
  })
  status: string;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;
}
