import { Test, TestingModule } from '@nestjs/testing';
import { MediaFacade } from './media-facade.service';
import { VoiceMetricsService } from '../voice-metrics.service';

describe('MediaFacade', () => {
  let facade: MediaFacade;
  let voiceMetricsService: jest.Mocked<VoiceMetricsService>;

  beforeEach(async () => {
    voiceMetricsService = {
      calculate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaFacade,
        { provide: VoiceMetricsService, useValue: voiceMetricsService },
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
});
