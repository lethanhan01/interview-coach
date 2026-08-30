import { z } from 'zod';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { ZodValidatorService } from './zod-validator.service';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

describe('ZodValidatorService', () => {
  let service: ZodValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ZodValidatorService],
    }).compile();
    service = module.get<ZodValidatorService>(ZodValidatorService);
  });

  describe('validate', () => {
    const schema = z.object({ name: z.string(), age: z.number() });

    it('trả về dữ liệu đã parse khi schema hợp lệ', () => {
      const result = service.validate(schema, { name: 'An', age: 22 });
      expect(result).toEqual({ name: 'An', age: 22 });
    });

    it('ném InterviewAIException với SCHEMA_VALIDATION_ERROR khi dữ liệu không hợp lệ', () => {
      expect(() =>
        service.validate(schema, { name: 'An', age: 'không phải số' }),
      ).toThrow(InterviewAIException);

      try {
        service.validate(schema, { name: 'An', age: 'không phải số' });
      } catch (e) {
        expect((e as InterviewAIException).errorCode).toBe(
          ErrorCode.SCHEMA_VALIDATION_ERROR,
        );
        expect((e as InterviewAIException).getStatus()).toBe(
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
    });
  });
});
