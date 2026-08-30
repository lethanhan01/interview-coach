import { Injectable, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { IInterviewModeStrategy } from './interview-mode-strategy.interface';
import { HrInterviewStrategy } from './hr-interview.strategy';
import { TechnicalInterviewStrategy } from './technical-interview.strategy';

@Injectable()
export class SessionStrategyRegistry {
  private readonly strategies = new Map<string, IInterviewModeStrategy>();

  constructor(
    hrStrategy: HrInterviewStrategy,
    technicalStrategy: TechnicalInterviewStrategy,
  ) {
    this.register(hrStrategy.mode, hrStrategy);
    this.register(technicalStrategy.mode, technicalStrategy);
  }

  public register(mode: string, strategy: IInterviewModeStrategy): void {
    this.strategies.set(mode, strategy);
  }

  public getStrategy(mode: string): IInterviewModeStrategy {
    const strategy = this.strategies.get(mode);
    if (!strategy) {
      throw new InterviewAIException(
        ErrorCode.INVALID_SESSION_TYPE,
        HttpStatus.BAD_REQUEST,
        `Hình thức phỏng vấn không được hỗ trợ: ${mode}`,
      );
    }
    return strategy;
  }

  public hasStrategy(mode: string): boolean {
    return this.strategies.has(mode);
  }
}
