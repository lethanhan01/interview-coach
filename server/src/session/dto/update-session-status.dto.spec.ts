import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSessionStatusDto } from './update-session-status.dto';

describe('UpdateSessionStatusDto', () => {
  const validatePayload = (payload: Record<string, unknown>) =>
    validate(plainToInstance(UpdateSessionStatusDto, payload));

  it('chấp nhận số giây còn lại khi tạm dừng', async () => {
    await expect(
      validatePayload({ status: 'paused', remainingSeconds: 725 }),
    ).resolves.toHaveLength(0);
  });

  it.each([-1, 1.5, '725'])(
    'từ chối remainingSeconds không hợp lệ: %p',
    async (value) => {
      const errors = await validatePayload({
        status: 'paused',
        remainingSeconds: value,
      });

      expect(errors).not.toHaveLength(0);
    },
  );
});
