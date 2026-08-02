import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export const SESSION_STATUS_UPDATES = [
  'active',
  'paused',
  'canceled',
  'completed',
] as const;
export type SessionStatusUpdate = (typeof SESSION_STATUS_UPDATES)[number];
export class UpdateSessionStatusDto {
  @ApiProperty({ enum: SESSION_STATUS_UPDATES })
  @IsIn(SESSION_STATUS_UPDATES)
  status: SessionStatusUpdate;
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  remainingSeconds?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoSkipUnanswered?: boolean;
}
