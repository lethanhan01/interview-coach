import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'node:stream';
import type { Response } from 'express';
import { MediaStreamController } from './media-stream.controller';
import { StreamAudioService } from './stream-audio.service';

describe('MediaStreamController', () => {
  let controller: MediaStreamController;
  let mockStreamService: jest.Mocked<StreamAudioService>;

  beforeEach(async () => {
    mockStreamService = {
      getAudioStream: jest.fn(),
    } as unknown as jest.Mocked<StreamAudioService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaStreamController],
      providers: [
        {
          provide: StreamAudioService,
          useValue: mockStreamService,
        },
      ],
    }).compile();

    controller = module.get<MediaStreamController>(MediaStreamController);
  });

  it('gọi StreamAudioService và pipe stream vào Response', async () => {
    const mockStream = new Readable({
      read() {
        this.push('chunk');
        this.push(null);
      },
    });

    const mockResult = {
      stream: mockStream,
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/webm',
        'Content-Length': 5,
      },
    };

    mockStreamService.getAudioStream.mockResolvedValue(mockResult);

    const pipeMock = jest.fn();
    mockStream.pipe = pipeMock;

    const mockRes = {
      writeHead: jest.fn(),
    } as unknown as Response;

    const query = {
      key: 'test/audio.webm',
      expires: 1780000000,
      token: 'valid-token',
    };

    await controller.stream(query, undefined, mockRes);

    expect(mockStreamService.getAudioStream).toHaveBeenCalledWith(
      query,
      undefined,
    );
    expect(mockRes.writeHead).toHaveBeenCalledWith(200, mockResult.headers);
    expect(pipeMock).toHaveBeenCalledWith(mockRes);
  });
});
