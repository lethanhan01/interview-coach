import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { SessionStrategyRegistry } from './session-strategy.registry';
import { HrInterviewStrategy } from './hr-interview.strategy';
import { TechnicalInterviewStrategy } from './technical-interview.strategy';
import { IInterviewModeStrategy } from './interview-mode-strategy.interface';

describe('SessionStrategyRegistry', () => {
  let registry: SessionStrategyRegistry;
  let hrStrategy: HrInterviewStrategy;
  let technicalStrategy: TechnicalInterviewStrategy;

  beforeEach(() => {
    hrStrategy = new HrInterviewStrategy();
    technicalStrategy = new TechnicalInterviewStrategy();
    registry = new SessionStrategyRegistry(hrStrategy, technicalStrategy);
  });

  it('khởi tạo với các chiến lược mặc định (hr, technical)', () => {
    expect(registry.hasStrategy('hr')).toBe(true);
    expect(registry.hasStrategy('technical')).toBe(true);
    expect(registry.getStrategy('hr')).toBe(hrStrategy);
    expect(registry.getStrategy('technical')).toBe(technicalStrategy);
  });

  it('cho phép đăng ký thêm chiến lược mới (Extension Seam)', () => {
    const mockLiveCodingStrategy: IInterviewModeStrategy = {
      mode: 'live_coding',
      buildQuestionGenerationPayload: jest.fn(),
      isSessionCompletable: jest.fn().mockReturnValue(true),
      buildReportGenerationPayload: jest.fn(),
    };

    registry.register('live_coding', mockLiveCodingStrategy);
    expect(registry.hasStrategy('live_coding')).toBe(true);
    expect(registry.getStrategy('live_coding')).toBe(mockLiveCodingStrategy);
  });

  it('ném InterviewAIException với INVALID_SESSION_TYPE khi truy vấn chiến lược không tồn tại', () => {
    expect(() => registry.getStrategy('unknown_mode')).toThrow(
      InterviewAIException,
    );

    try {
      registry.getStrategy('unknown_mode');
    } catch (error) {
      expect(error).toBeInstanceOf(InterviewAIException);
      expect((error as InterviewAIException).errorCode).toBe(
        ErrorCode.INVALID_SESSION_TYPE,
      );
      expect((error as InterviewAIException).getStatus()).toBe(
        HttpStatus.BAD_REQUEST,
      );
    }
  });
});
