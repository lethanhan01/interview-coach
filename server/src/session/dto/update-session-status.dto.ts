import { IsBoolean, IsIn, IsInt, IsOptional, Min } from 'class-validator';

export const SESSION_STATUS_UPDATES = [
  'active',
  'paused',
  'canceled',
  'completed',
] as const;

export type SessionStatusUpdate = (typeof SESSION_STATUS_UPDATES)[number];

export class UpdateSessionStatusDto {
  @IsIn(SESSION_STATUS_UPDATES)
  status: SessionStatusUpdate;

  @IsOptional()
  @IsInt()
  @Min(0)
  remainingSeconds?: number;

  @IsOptional()
  @IsBoolean()
  autoSkipUnanswered?: boolean;
}
