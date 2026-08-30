import { Test, TestingModule } from '@nestjs/testing';
import { MediaFacade } from './media-facade.service';
import { AudioObjectStorage } from '../audio-object-storage.service';
import { UploadAndTranscribeAnswerAudio } from '../upload-and-transcribe-answer-audio.service';
import { VoiceMetricsService } from '../voice-metrics.service';

describe('MediaFacade', () => {
  let facade: MediaFacade;
  let audioStorage: jest.Mocked<AudioObjectStorage>;
  let uploadAndTranscribeAudioService: jest.Mocked<UploadAndTranscribeAnswerAudio>;
  let voiceMetricsService: jest.Mocked<VoiceMetricsService>;

  beforeEach(async () => {
    audioStorage = {
      uploadInterviewAudio: jest.fn(),
      getSignedUrl: jest.fn(),
    } as unknown as jest.Mocked<AudioObjectStorage>;

    uploadAndTranscribeAudioService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UploadAndTranscribeAnswerAudio>;

    voiceMetricsService = {
      calculate: jest.fn(),
    } as unknown as jest.Mocked<VoiceMetricsService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaFacade,
        { provide: AudioObjectStorage, useValue: audioStorage },
        {
          provide: UploadAndTranscribeAnswerAudio,
          useValue: uploadAndTranscribeAudioService,
        },
        { provide: VoiceMetricsService, useValue: voiceMetricsService },
      ],
    }).compile();

    facade = module.get<MediaFacade>(MediaFacade);
  });

  it('delegates uploadInterviewAudio to AudioObjectStorage', async () => {
    const mockResult = {
      mediaKey: 'path/audio.mp4',
      audioFileUrl: 'https://storage/audio.mp4',
      storageProvider: 'supabase' as const,
      sizeBytes: 1024,
      mimeType: 'audio/mp4',
    };
    audioStorage.uploadInterviewAudio.mockResolvedValue(mockResult);

    const params = {
      sessionId: 's-1',
      userId: 'u-1',
      file: { buffer: Buffer.from([]), mimetype: 'audio/mp4', size: 1024 },
    };
    const result = await facade.uploadInterviewAudio(params);

    expect(audioStorage.uploadInterviewAudio).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockResult);
  });

  it('delegates uploadAndTranscribeAudio to UploadAndTranscribeAnswerAudio', async () => {
    const mockResult = {
      mediaKey: 'path/audio.mp4',
      audioFileUrl: 'https://storage/audio.mp4',
      storageProvider: 'supabase' as const,
      sizeBytes: 1024,
      mimeType: 'audio/mp4',
      transcript: 'hello world',
      transcriptDurationSeconds: 10,
    };
    uploadAndTranscribeAudioService.execute.mockResolvedValue(mockResult);

    const params = {
      sessionId: 's-1',
      userId: 'u-1',
      file: { buffer: Buffer.from([]), mimetype: 'audio/mp4', size: 1024 },
    };
    const result = await facade.uploadAndTranscribeAudio(params);

    expect(uploadAndTranscribeAudioService.execute).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockResult);
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

  it('delegates getSignedUrl to AudioObjectStorage', async () => {
    const mockSigned = {
      signedUrl: 'https://signed.url',
      expiresAt: new Date(),
    };
    audioStorage.getSignedUrl.mockResolvedValue(mockSigned);

    const result = await facade.getSignedUrl('key-1', 3600);

    expect(audioStorage.getSignedUrl).toHaveBeenCalledWith('key-1', 3600);
    expect(result).toEqual(mockSigned);
  });
});
