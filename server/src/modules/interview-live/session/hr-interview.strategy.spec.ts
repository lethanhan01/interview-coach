import { HrInterviewStrategy } from './hr-interview.strategy';
import { CreateSessionDto } from './dto/create-session.dto';
import { InterviewSession } from '@prisma/client';

describe('HrInterviewStrategy', () => {
  let strategy: HrInterviewStrategy;

  beforeEach(() => {
    strategy = new HrInterviewStrategy();
  });

  it('có mode định danh là hr', () => {
    expect(strategy.mode).toBe('hr');
  });

  it('builds question generation payload với đầy đủ các trường yêu cầu', () => {
    const session = {
      id: 'session-hr-123',
      language: 'vi',
      numQuestions: 5,
      durationMin: 30,
    } as InterviewSession;

    const dto: CreateSessionDto = {
      jobDescription: 'Software Engineer HR test',
      sessionType: 'hr',
      contextPack: 'VN',
      savedJobDescriptionId: 'sjd-123',
      targetRoles: ['Backend Developer'],
    };

    const payload = strategy.buildQuestionGenerationPayload(
      session,
      dto,
      'rubric-version-vn-1',
    );

    expect(payload).toEqual({
      sessionId: 'session-hr-123',
      sessionType: 'hr',
      jobDescriptionText: 'Software Engineer HR test',
      targetRoles: ['Backend Developer'],
      contextPack: 'VN',
      rubricVersionId: 'rubric-version-vn-1',
      language: 'vi',
      totalQuestions: 5,
      durationMin: 30,
    });
  });

  it('xác thực điều kiện hoàn tất session chính xác', () => {
    const session = { id: 'session-1' } as InterviewSession;
    expect(strategy.isSessionCompletable(session, 5, 5)).toBe(true);
    expect(strategy.isSessionCompletable(session, 6, 5)).toBe(true);
    expect(strategy.isSessionCompletable(session, 4, 5)).toBe(false);
    expect(strategy.isSessionCompletable(session, 0, 0)).toBe(false);
  });

  it('builds report generation payload đúng định dạng', () => {
    const session = {
      id: 'session-hr-123',
      sessionType: 'hr',
      contextPackId: 'VN',
      language: 'vi',
    } as InterviewSession;

    const payload = strategy.buildReportGenerationPayload(session);
    expect(payload).toEqual({
      sessionId: 'session-hr-123',
      sessionType: 'hr',
      contextPack: 'VN',
      language: 'vi',
    });
  });
});
