import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'node:stream';
import { MediaFacade } from './media-facade.service';
import { VoiceMetricsService } from '../voice-metrics.service';
import { AI_GATEWAY_TOKEN, type IAIGateway } from '@infra/ai/ai-gateway.interface';

describe('MediaFacade', () => {
  let facade: MediaFacade;
  let voiceMetricsService: jest.Mocked<VoiceMetricsService>;
  let aiGateway: jest.Mocked<IAIGateway>;

  beforeEach(async () => {
    voiceMetricsService = {
      calculate: jest.fn(),
    } as unknown as jest.Mocked<VoiceMetricsService>;

    aiGateway = {
      transcribeWithMetrics: jest.fn(),
      synthesizeSpeech: jest.fn(),
    } as unknown as jest.Mocked<IAIGateway>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaFacade,
        { provide: VoiceMetricsService, useValue: voiceMetricsService },
        { provide: AI_GATEWAY_TOKEN, useValue: aiGateway },
      ],
    }).compile();

    facade = module.get<MediaFacade>(MediaFacade);
  });

  it('delegates calculateVoiceMetrics to VoiceMetricsService', () => {
    const mockMetrics = {
      wpm: 120,
      fillerWordCount: 2,
      fillerWords: ['um', 'so'],
    };
    voiceMetricsService.calculate.mockReturnValue(mockMetrics);

    const result = facade.calculateVoiceMetrics('um hello so world', 10);

    expect(voiceMetricsService.calculate).toHaveBeenCalledWith(
      'um hello so world',
      10,
    );
    expect(result).toEqual(mockMetrics);
  });

  it('delegates transcribeAudio to aiGateway.transcribeWithMetrics', async () => {
    const mockFile = {
      buffer: Buffer.from('fake-audio'),
      mimetype: 'audio/webm',
    } as Express.Multer.File;

    const mockResult = {
      text: 'Hello world',
      language: 'en',
      durationSeconds: 2.5,
      metrics: {
        wpm: 120,
        fillerWordCount: 0,
        fillerWords: [],
        pauseCount: 0,
        totalPauseDurationSeconds: 0,
        speechDurationSeconds: 2.5,
        confidenceScore: 0.95,
      },
    };

    aiGateway.transcribeWithMetrics.mockResolvedValue(mockResult);

    const result = await facade.transcribeAudio(mockFile, 'en');

    expect(aiGateway.transcribeWithMetrics).toHaveBeenCalledWith({
      audioBuffer: mockFile.buffer,
      mimeType: 'audio/webm',
      language: 'en',
    });
    expect(result.text).toBe('Hello world');
    expect(result.metrics.wpm).toBe(120);
  });

  it('delegates synthesizeSpeech to aiGateway.synthesizeSpeech', async () => {
    const mockStream = new Readable({ read() { this.push(null); } });
    aiGateway.synthesizeSpeech.mockResolvedValue({
      stream: mockStream,
      contentType: 'audio/wav',
    });

    const result = await facade.synthesizeSpeech('Test question', 'en');

    expect(aiGateway.synthesizeSpeech).toHaveBeenCalledWith({
      text: 'Test question',
      language: 'en',
    });
    expect(result.contentType).toBe('audio/wav');
    expect(result.stream).toBe(mockStream);
  });
});
