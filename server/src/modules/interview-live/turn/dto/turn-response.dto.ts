import { ApiProperty } from '@nestjs/swagger';
export class TurnResponseDto {
  @ApiProperty({ format: 'uuid' }) answerId: string;
  @ApiProperty() feedbackQueued: boolean;
  @ApiProperty() transcriptionPending: boolean;
}
