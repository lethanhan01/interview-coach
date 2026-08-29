import { Test, TestingModule } from '@nestjs/testing';
import { PipelineStrategyFactory } from './pipeline-strategy.factory';
import { HrPipelineService } from './hr.pipeline.service';
import { TechnicalPipelineService } from './technical.pipeline.service';

describe('PipelineStrategyFactory', () => {
  let factory: PipelineStrategyFactory;
  const mockHr = { sessionType: 'hr' } as HrPipelineService;
  const mockTechnical = {
    sessionType: 'technical',
  } as TechnicalPipelineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineStrategyFactory,
        { provide: HrPipelineService, useValue: mockHr },
        { provide: TechnicalPipelineService, useValue: mockTechnical },
      ],
    }).compile();

    factory = module.get<PipelineStrategyFactory>(PipelineStrategyFactory);
  });

  describe('getStrategy', () => {
    it('trả về HrPipelineService cho sessionType hr', () => {
      expect(factory.getStrategy('hr')).toBe(mockHr);
    });

    it('trả về TechnicalPipelineService cho sessionType technical', () => {
      expect(factory.getStrategy('technical')).toBe(mockTechnical);
    });

    it('ném lỗi rõ ràng nếu nhận sessionType không được hỗ trợ', () => {
      expect(() => factory.getStrategy('HR' as never)).toThrow(
        'Unsupported session type: HR',
      );
    });
  });
});
