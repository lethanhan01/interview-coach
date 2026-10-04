import { Injectable, HttpStatus } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { InterviewAIException } from '@core/common/exceptions/interview-ai.exception';
import { ErrorCode } from '@core/common/exceptions/error-code.enum';

@Injectable()
export class ZodValidatorService {
  validate<T>(schema: ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new InterviewAIException(
        ErrorCode.SCHEMA_VALIDATION_ERROR,
        HttpStatus.UNPROCESSABLE_ENTITY,
        result.error.message,
      );
    }
    return result.data;
  }
}
