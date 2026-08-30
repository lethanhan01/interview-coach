import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: false;

  @ApiProperty({ example: 'VALIDATION_ERROR' })
  errorCode: string;

  @ApiProperty({ example: 'email must be an email' })
  message: string;

  @ApiProperty({ example: '/api/v1/auth/login' })
  path: string;

  @ApiProperty({ example: '2026-08-03T00:00:00.000Z', format: 'date-time' })
  timestamp: string;
}
