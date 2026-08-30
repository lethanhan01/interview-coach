import { TechnicalInterviewStrategy } from './technical-interview.strategy';
import { CreateSessionDto } from './dto/create-session.dto';
import { InterviewSession } from '@prisma/client';

describe('TechnicalInterviewStrategy', () => {
  let strategy: TechnicalInterviewStrategy;

  beforeEach(() => {
    strategy = new TechnicalInterviewStrategy();
  });

  it('có mode định danh là technical', () => {
    expect(strategy.mode).toBe('technical');
  });

  it('builds question generation payload với đầy đủ các trường yêu cầu', () => {
    const session = {
      id: 'session-tech-123',
      language: 'vi',
      numQuestions: 5,
      durationMin: 30,
    } as InterviewSession;

    const dto: CreateSessionDto = {
      jobDescription: 'Software Engineer Technical test',
      sessionType: 'technical',
      contextPack: 'VN',
      savedJobDescriptionId: 'sjd-123',
      targetRoles: ['Backend Developer', 'DevOps'],
    };

    const payload = strategy.buildQuestionGenerationPayload(
      session,
      dto,
      'rubric-version-vn-1',
    );

    expect(payload).toEqual({
      sessionId: 'session-tech-123',
      sessionType: 'technical',
      jobDescriptionText: 'Software Engineer Technical test',
      targetRoles: ['Backend Developer', 'DevOps'],
      contextPack: 'VN',
      rubricVersionId: 'rubric-version-vn-1',
      language: 'vi',
      totalQuestions: 5,
      durationMin: 30,
    });
  });

  it('xác thực điều kiện hoàn tất session chính xác', () => {
    const session = { id: 'session-tech-1' } as InterviewSession;
    expect(strategy.isSessionCompletable(session, 5, 5)).toBe(true);
    expect(strategy.isSessionCompletable(session, 6, 5)).toBe(true);
    expect(strategy.isSessionCompletable(session, 4, 5)).toBe(false);
    expect(strategy.isSessionCompletable(session, 0, 0)).toBe(false);
  });

  it('builds report generation payload đúng định dạng', () => {
    const session = {
      id: 'session-tech-123',
      sessionType: 'technical',
      contextPackId: 'VN',
      language: 'vi',
    } as InterviewSession;

    const payload = strategy.buildReportGenerationPayload(session);
    expect(payload).toEqual({
      sessionId: 'session-tech-123',
      sessionType: 'technical',
      contextPack: 'VN',
      language: 'vi',
    });
  });
});
