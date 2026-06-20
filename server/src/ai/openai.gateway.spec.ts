import { APIError } from 'openai';
import { OpenAIGateway } from './openai.gateway';
import { ErrorCode } from '../common/exceptions/error-code.enum';

describe('OpenAIGateway', () => {
  const params = {
    model: 'gpt-4o' as const,
    temperature: 0,
    maxTokens: 10,
    messages: [{ role: 'user' as const, content: 'hello' }],
  };

  it('không retry lỗi 429 insufficient_quota và tạm ngắt các call kế tiếp', async () => {
    const gateway = new OpenAIGateway({
      getOrThrow: jest.fn().mockReturnValue('test-key'),
    } as any);
    const create = jest.fn().mockRejectedValue(
      new APIError(
        429,
        {
          code: 'insufficient_quota',
          message: 'You exceeded your current quota.',
          type: 'insufficient_quota',
        },
        undefined,
        new Headers(),
      ),
    );
    (gateway as any).client.chat.completions.create = create;

    await expect(gateway.chatCompletion(params)).rejects.toMatchObject({
      errorCode: ErrorCode.AI_QUOTA_EXCEEDED,
    });
    await expect(gateway.chatCompletion(params)).rejects.toMatchObject({
      errorCode: ErrorCode.AI_QUOTA_EXCEEDED,
    });
    expect(create).toHaveBeenCalledTimes(1);
  });
});
