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

    it('không validate answerText khi mode là voice', async () => {
      const dto = plainToInstance(SubmitAnswerDto, {
        questionId: 'q-1',
        answerMode: 'voice',
        audioFileUrl: 'https://example.com/audio.mp3',
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'answerText')).toBe(false);
    });
  });
});
