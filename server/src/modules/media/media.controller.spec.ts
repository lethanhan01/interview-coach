import { Test, TestingModule } from '@nestjs/testing';
import { Readable, PassThrough } from 'node:stream';
import type { Response } from 'express';
import { MediaController } from './media.controller';
import { MediaFacade } from './contracts/media-facade.service';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

describe('MediaController', () => {
  let controller: MediaController;
  let mediaFacade: jest.Mocked<MediaFacade>;

  beforeEach(async () => {
    mediaFacade = {
      calculateVoiceMetrics: jest.fn(),
      transcribeAudio: jest.fn(),
      synthesizeSpeech: jest.fn(),
    } as unknown as jest.Mocked<MediaFacade>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaFacade, useValue: mediaFacade }],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  describe('transcribe', () => {
    it('throws VALIDATION_ERROR when no file is uploaded', async () => {
      await expect(controller.transcribe(undefined, {})).rejects.toThrow(
        InterviewAIException,
      );

      await expect(controller.transcribe(undefined, {})).rejects.toMatchObject({
        errorCode: ErrorCode.VALIDATION_ERROR,
      });
    });

    it('throws UNSUPPORTED_MEDIA_TYPE when invalid mimetype is uploaded', async () => {
      const invalidFile = {
        buffer: Buffer.from('abc'),
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      await expect(
        controller.transcribe(invalidFile, {}),
      ).rejects.toMatchObject({
        errorCode: ErrorCode.UNSUPPORTED_MEDIA_TYPE,
      });
    });

    it('successfully calls mediaFacade and returns transcribe response', async () => {
      const validFile = {
        buffer: Buffer.from('valid audio'),
        mimetype: 'audio/webm',
      } as Express.Multer.File;

      const mockResponse = {
        text: 'Test answer',
        language: 'en',
        durationSeconds: 3.5,
        metrics: {
          wpm: 130,
          fillerWordCount: 0,
          fillerWords: [],
          pauseCount: 0,
          totalPauseDurationSeconds: 0,
          speechDurationSeconds: 3.5,
          confidenceScore: 0.95,
        },
      };

      mediaFacade.transcribeAudio.mockResolvedValue(mockResponse);

      const result = await controller.transcribe(validFile, { language: 'en' });

      expect(mediaFacade.transcribeAudio).toHaveBeenCalledWith(validFile, 'en');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('synthesize', () => {
    it('sets proper headers and pipes stream to response', async () => {
      const mockStream = new Readable({
        read() {
          this.push(null);
        },
      });
      jest.spyOn(mockStream, 'pipe');

      mediaFacade.synthesizeSpeech.mockResolvedValue({
        stream: mockStream,
        contentType: 'audio/wav',
      });

      const res = Object.assign(new PassThrough(), {
        setHeader: jest.fn(),
      }) as unknown as Response;

      await controller.synthesize({ text: 'Hello', language: 'en' }, res);

      expect(mediaFacade.synthesizeSpeech).toHaveBeenCalledWith('Hello', 'en');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'audio/wav');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Cache-Control',
        'public, max-age=86400',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Transfer-Encoding',
        'chunked',
      );
      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });
  });
});
