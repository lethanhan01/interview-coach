import { Controller, Get, Query, Headers, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiOperation, ApiTags, ApiProduces } from '@nestjs/swagger';
import { StreamAudioQueryDto } from './dto/stream-audio-query.dto';
import { StreamAudioService } from './stream-audio.service';

@Controller('media/audio')
@ApiTags('Media')
export class MediaStreamController {
  constructor(private readonly streamAudioService: StreamAudioService) {}

  @Get('stream')
  @ApiOperation({
    summary:
      'Phát trực tuyến (stream) tệp âm thanh phỏng vấn hỗ trợ HTTP Range',
  })
  @ApiProduces('audio/webm', 'audio/mp4', 'audio/wav')
  async stream(
    @Query() query: StreamAudioQueryDto,
    @Headers('range') range: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.streamAudioService.getAudioStream(query, range);
    res.writeHead(result.statusCode, result.headers);
    result.stream.pipe(res);
  }
}
