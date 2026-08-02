import { hashPassword, verifyPassword } from './password';

describe('local password hashing', () => {
  it('verifies only the password that produced the hash', async () => {
    const hash = await hashPassword('CorrectPassword123!');
    await expect(verifyPassword('CorrectPassword123!', hash)).resolves.toBe(
      true,
    );
    await expect(verifyPassword('WrongPassword123!', hash)).resolves.toBe(
      false,
    );
  });
});
