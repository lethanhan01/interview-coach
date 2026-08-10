import type { Job } from 'bullmq';
import { ComprehensiveReportProcessor } from './comprehensive-report.processor';
import { GenerateComprehensiveReport } from './generate-comprehensive-report.service';

describe('ComprehensiveReportProcessor', () => {
  it('delegates the unchanged queue payload to the reporting use case', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const processor = new ComprehensiveReportProcessor({ execute } as unknown as GenerateComprehensiveReport);
    const data = {
      sessionId: 'session-123',
      sessionType: 'hr' as const,
      contextPack: 'VN' as const,
      turnIds: ['answer-1'],
    };

    await processor.process({ data } as Job<typeof data>);

    expect(execute).toHaveBeenCalledWith(data);
  });
});
