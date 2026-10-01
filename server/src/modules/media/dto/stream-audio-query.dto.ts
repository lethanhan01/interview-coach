import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StreamAudioQueryDto {
  @ApiProperty({
    description: 'Khóa tệp âm thanh trong hệ thống lưu trữ (mediaKey)',
    example: 'user-123/session-456/audio-789.webm',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Thời điểm hết hạn (Unix timestamp tính bằng giây)',
    example: 1780000000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expires: number;

  @ApiProperty({
    description: 'Chữ ký số xác thực HMAC-SHA256',
    example: 'a1b2c3d4e5f6...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
