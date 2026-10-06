import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SubmitAnswerDto } from './submit-answer.dto';

describe('SubmitAnswerDto', () => {
  describe('text mode', () => {
    it('rejects answerText dưới 10 ký tự', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: 'short',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'answerText')).toBe(true);
    });

    it('rejects answerText rỗng', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: '',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'answerText')).toBe(true);
    });

    it('chấp nhận answerText rỗng khi skipQuestion=true', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: '',
        skipQuestion: true,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('chấp nhận answerText đủ 10 ký tự', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'text',
        answerText: 'Đây là câu trả lời đủ độ dài.',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('voice mode', () => {
    it('chấp nhận voice mode khi có answerText đủ 10 ký tự và audioDurationSeconds', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'voice',
        answerText: 'Tôi có hơn ba năm kinh nghiệm phỏng vấn.',
        audioDurationSeconds: 45,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects voice mode khi answerText dưới 10 ký tự', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'voice',
        answerText: 'ngắn',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'answerText')).toBe(true);
    });

    it('rejects voice mode khi không có answerText', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'voice',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'answerText')).toBe(true);
    });

    it('chấp nhận voice mode với answerText rỗng khi skipQuestion=true', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'voice',
        answerText: '',
        skipQuestion: true,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
