import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSessionDto } from './create-session.dto';

describe('CreateSessionDto', () => {
  const validPayload = {
    jobDescription: 'a'.repeat(100),
    sessionType: 'hr',
    contextPack: 'VN',
    language: 'vi',
    numQuestions: 5,
    targetRoles: ['Backend Developer'],
  };

  const validatePayload = (payload: Record<string, unknown>) =>
    validate(plainToInstance(CreateSessionDto, payload));

  it('QG-02: chấp nhận payload tạo session hợp lệ', async () => {
    await expect(validatePayload(validPayload)).resolves.toHaveLength(0);
  });

  it.each([
    ['JD dưới 100 ký tự', { jobDescription: 'short jd' }],
    ['numQuestions dưới 3', { numQuestions: 2 }],
    ['numQuestions trên 45', { numQuestions: 46 }],
    ['sessionType sai enum', { sessionType: 'culture' }],
    ['contextPack sai enum', { contextPack: 'APAC' }],
    ['language sai enum', { language: 'fr' }],
  ])('QG-02: reject %s', async (_label, override) => {
    const errors = await validatePayload({ ...validPayload, ...override });

    expect(errors).not.toHaveLength(0);
  });
});
