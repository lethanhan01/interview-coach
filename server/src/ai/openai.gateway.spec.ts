import { APIError, APIUserAbortError } from 'openai';
import { OpenAIGateway } from './openai.gateway';
import { ErrorCode } from '../common/exceptions/error-code.enum';

describe('OpenAIGateway', () => {
  const params = {
    temperature: 0,
    maxTokens: 10,
    messages: [{ role: 'user' as const, content: 'hello' }],
  };
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        OPENAI_API_KEY: 'test-key',
        OPENAI_BASE_URL: 'http://127.0.0.1:1234/v1',
        OPENAI_CHAT_MODEL: 'google/gemma-4-e4b',
        OPENAI_JSON_MODE: 'false',
        OPENAI_TIMEOUT_MS: '30000',
      };
      return values[key];
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('không retry lỗi 429 insufficient_quota và tạm ngắt các call kế tiếp', async () => {
    const gateway = new OpenAIGateway(config as any);
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
    (gateway as any).chatClient.chat.completions.create = create;

    await expect(gateway.chatCompletion(params)).rejects.toMatchObject({
      errorCode: ErrorCode.AI_QUOTA_EXCEEDED,
    });
    await expect(gateway.chatCompletion(params)).rejects.toMatchObject({
      errorCode: ErrorCode.AI_QUOTA_EXCEEDED,
    });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('ném AI_TIMEOUT khi AbortSignal timeout (APIUserAbortError)', async () => {
    const gateway = new OpenAIGateway(config as any);
    const create = jest
      .fn()
      .mockRejectedValue(new APIUserAbortError('Request was aborted.'));
    (gateway as any).chatClient.chat.completions.create = create;

    await expect(gateway.chatCompletion(params)).rejects.toMatchObject({
      errorCode: ErrorCode.AI_TIMEOUT,
    });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('dùng model local mặc định từ cấu hình khi params không truyền model', async () => {
    const gateway = new OpenAIGateway(config as any);
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    });
    (gateway as any).chatClient.chat.completions.create = create;

    await expect(gateway.chatCompletion(params)).resolves.toBe('ok');

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'google/gemma-4-e4b',
      }),
      expect.any(Object),
    );
    expect(gateway.getChatModel()).toBe('google/gemma-4-e4b');
  });
});

describe('OpenAIGateway — JSON extraction', () => {
  const jsonParams = {
    temperature: 0,
    maxTokens: 100,
    messages: [{ role: 'user' as const, content: 'hello' }],
    responseFormat: 'json_object' as const,
  };
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        OPENAI_API_KEY: 'test-key',
        OPENAI_BASE_URL: 'http://127.0.0.1:1234/v1',
        OPENAI_CHAT_MODEL: 'google/gemma-4-e4b',
        OPENAI_JSON_MODE: 'false',
        OPENAI_TIMEOUT_MS: '30000',
      };
      return values[key];
    }),
  };

  beforeEach(() => jest.clearAllMocks());

  it('strip markdown ```json``` code fence và trả về JSON sạch', async () => {
    const gateway = new OpenAIGateway(config as any);
    const rawFromModel = '```json\n{"score":85,"comment":"good"}\n```';
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: rawFromModel } }],
    });
    (gateway as any).chatClient.chat.completions.create = create;

    const result = await gateway.chatCompletion(jsonParams);
    expect(result).toBe('{"score":85,"comment":"good"}');
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('giữ nguyên plain JSON không có wrapper', async () => {
    const gateway = new OpenAIGateway(config as any);
    const rawFromModel = '{"score":85,"comment":"good"}';
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: rawFromModel } }],
    });
    (gateway as any).chatClient.chat.completions.create = create;

    const result = await gateway.chatCompletion(jsonParams);
    expect(result).toBe('{"score":85,"comment":"good"}');
  });

  it('extract JSON object từ text có prose xung quanh', async () => {
    const gateway = new OpenAIGateway(config as any);
    const rawFromModel =
      'Sure! Here is the JSON:\n{"score":70}\nHope that helps.';
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: rawFromModel } }],
    });
    (gateway as any).chatClient.chat.completions.create = create;

    const result = await gateway.chatCompletion(jsonParams);
    expect(result).toBe('{"score":70}');
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('ném AI_SERVICE_ERROR rõ ràng khi responseFormat json_object nhưng output không phải JSON', async () => {
    const gateway = new OpenAIGateway(config as any);
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'not-json {{' } }],
    });
    (gateway as any).chatClient.chat.completions.create = create;

    await expect(gateway.chatCompletion(jsonParams)).rejects.toMatchObject({
      errorCode: ErrorCode.AI_SERVICE_ERROR,
      message: expect.stringContaining('invalid or truncated JSON'),
    });
  });

  it('gửi response_format json_object khi OPENAI_JSON_MODE=true', async () => {
    const jsonModeConfig = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          OPENAI_API_KEY: 'test-key',
          OPENAI_BASE_URL: 'http://127.0.0.1:1234/v1',
          OPENAI_CHAT_MODEL: 'google/gemma-4-e4b',
          OPENAI_JSON_MODE: 'true',
          OPENAI_TIMEOUT_MS: '30000',
        };
        return values[key];
      }),
    };
    const gateway = new OpenAIGateway(jsonModeConfig as any);
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: '{"score":85}' } }],
    });
    (gateway as any).chatClient.chat.completions.create = create;

    await gateway.chatCompletion(jsonParams);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: { type: 'json_object' },
      }),
      expect.any(Object),
    );
  });
});

describe('OpenAIGateway — empty response và task-specific timeout', () => {
  const params = {
    temperature: 0,
    maxTokens: 10,
    messages: [{ role: 'user' as const, content: 'hello' }],
  };
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string | undefined> = {
        OPENAI_API_KEY: 'test-key',
        OPENAI_BASE_URL: 'http://127.0.0.1:1234/v1',
        OPENAI_CHAT_MODEL: 'google/gemma-4-e4b',
        OPENAI_JSON_MODE: 'false',
        OPENAI_TIMEOUT_MS: '30000',
        OPENAI_FEEDBACK_TIMEOUT_MS: '300000',
        OPENAI_QUESTION_TIMEOUT_MS: '120000',
      };
      return values[key];
    }),
  };

  beforeEach(() => jest.clearAllMocks());

  it('ném AI_EMPTY_RESPONSE khi model trả về content rỗng', async () => {
    const gateway = new OpenAIGateway(config as any);
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: '' } }],
    });
    (gateway as any).chatClient.chat.completions.create = create;

    await expect(gateway.chatCompletion(params)).rejects.toMatchObject({
      errorCode: ErrorCode.AI_EMPTY_RESPONSE,
    });
  });

  it('ném AI_EMPTY_RESPONSE khi choices là mảng rỗng', async () => {
    const gateway = new OpenAIGateway(config as any);
    const create = jest.fn().mockResolvedValue({ choices: [] });
    (gateway as any).chatClient.chat.completions.create = create;

    await expect(gateway.chatCompletion(params)).rejects.toMatchObject({
      errorCode: ErrorCode.AI_EMPTY_RESPONSE,
    });
  });

  it('retry đúng 1 lần với max_tokens=3600 khi question-generation bị content rỗng do finish_reason=length', async () => {
    const gateway = new OpenAIGateway(config as any);
    const create = jest
      .fn()
      .mockResolvedValueOnce({
        choices: [
          {
            finish_reason: 'length',
            message: {
              content: '',
              reasoning_content: 'thinking without final JSON',
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        choices: [
          {
            finish_reason: 'stop',
            message: { content: '{"questions":[]}' },
          },
        ],
      });
    (gateway as any).chatClient.chat.completions.create = create;

    await expect(
      gateway.chatCompletion({
        ...params,
        maxTokens: 2400,
        responseFormat: 'json_object',
        task: 'question-generation',
      }),
    ).resolves.toBe('{"questions":[]}');

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][0]).toEqual(
      expect.objectContaining({ max_tokens: 2400 }),
    );
    expect(create.mock.calls[1][0]).toEqual(
      expect.objectContaining({ max_tokens: 3600 }),
    );
  });

  it('sau retry truncated vẫn ném AI_EMPTY_RESPONSE nếu content cuối cùng rỗng', async () => {
    const gateway = new OpenAIGateway(config as any);
    const create = jest.fn().mockResolvedValue({
      choices: [
        {
          finish_reason: 'length',
          message: { content: '', reasoning_content: 'still thinking' },
        },
      ],
    });
    (gateway as any).chatClient.chat.completions.create = create;

    await expect(
      gateway.chatCompletion({
        ...params,
        maxTokens: 2400,
        responseFormat: 'json_object',
        task: 'question-generation',
      }),
    ).rejects.toMatchObject({
      errorCode: ErrorCode.AI_EMPTY_RESPONSE,
      message: expect.stringContaining('empty final content'),
    });
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('task feedback dùng OPENAI_FEEDBACK_TIMEOUT_MS (300s) cho AbortSignal', async () => {
    const gateway = new OpenAIGateway(config as any);
    const mockSignal = { aborted: false } as unknown as AbortSignal;
    const timeoutSpy = jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(mockSignal);
    const create = jest.fn().mockResolvedValue({
      choices: [{ message: { content: '{"ok":true}' } }],
    });
    (gateway as any).chatClient.chat.completions.create = create;

    await gateway.chatCompletion({ ...params, task: 'feedback' });

    expect(timeoutSpy).toHaveBeenCalledWith(300000);
    timeoutSpy.mockRestore();
  });
});
