import { Test, TestingModule } from '@nestjs/testing';
import { PipelineStrategyFactory } from './pipeline-strategy.factory';
import { HrPipelineService } from './hr.pipeline.service';
import { TechnicalPipelineService } from './technical.pipeline.service';
import { MixedPipelineService } from './mixed.pipeline.service';

describe('PipelineStrategyFactory', () => {
  let factory: PipelineStrategyFactory;
  const mockHr = {} as HrPipelineService;
  const mockTechnical = {} as TechnicalPipelineService;
  const mockMixed = {} as MixedPipelineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PipelineStrategyFactory,
        { provide: HrPipelineService, useValue: mockHr },
        { provide: TechnicalPipelineService, useValue: mockTechnical },
        { provide: MixedPipelineService, useValue: mockMixed },
      ],
    }).compile();

    factory = module.get<PipelineStrategyFactory>(PipelineStrategyFactory);
  });

  describe('getStrategy', () => {
    it('trả về HrPipelineService cho sessionType HR', () => {
      expect(factory.getStrategy('HR')).toBe(mockHr);
    });

    it('trả về TechnicalPipelineService cho sessionType Technical', () => {
      expect(factory.getStrategy('Technical')).toBe(mockTechnical);
    });

    it('trả về MixedPipelineService cho sessionType Mixed', () => {
      expect(factory.getStrategy('Mixed')).toBe(mockMixed);
    });
  });
});
