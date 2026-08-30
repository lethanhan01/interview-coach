import { AnswerIntakeRegistry } from './answer-intake.registry';
import { IAnswerIntakeHandler } from './answer-intake-handler.interface';
import { InterviewAIException } from '../common/exceptions/interview-ai.exception';

describe('AnswerIntakeRegistry', () => {
  let registry: AnswerIntakeRegistry;
  let mockTextHandler: IAnswerIntakeHandler;
  let mockVoiceHandler: IAnswerIntakeHandler;

  beforeEach(() => {
    mockTextHandler = {
      supportedMode: 'text',
      handle: jest.fn(),
    };
    mockVoiceHandler = {
      supportedMode: 'voice',
      handle: jest.fn(),
    };
    registry = new AnswerIntakeRegistry(
      mockTextHandler as any,
      mockVoiceHandler as any,
    );
  });

  it('should return text handler for "text" mode', () => {
    expect(registry.getHandler('text')).toBe(mockTextHandler);
  });

  it('should return voice handler for "voice" mode', () => {
    expect(registry.getHandler('voice')).toBe(mockVoiceHandler);
  });

  it('should allow registering a new custom mode (e.g. live coding in future)', () => {
    const mockCodeHandler: IAnswerIntakeHandler = {
      supportedMode: 'code',
      handle: jest.fn(),
    };
    registry.register('code', mockCodeHandler);
    expect(registry.getHandler('code')).toBe(mockCodeHandler);
  });

  it('should throw InterviewAIException when mode is not supported', () => {
    expect(() => registry.getHandler('unsupported_mode')).toThrow(
      InterviewAIException,
    );
  });
});
