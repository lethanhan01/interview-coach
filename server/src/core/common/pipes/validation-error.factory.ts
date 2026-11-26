import { ValidationError } from 'class-validator';
import { HttpStatus } from '@nestjs/common';
import { InterviewAIException } from '../exceptions/interview-ai.exception';
import { ErrorCode } from '../exceptions/error-code.enum';

export function validationErrorFactory(
  errors: ValidationError[],
): InterviewAIException {
  const details: Record<string, string[]> = {};

  function extractErrors(errs: ValidationError[], parentProperty = '') {
    for (const err of errs) {
      const property = parentProperty
        ? `${parentProperty}.${err.property}`
        : err.property;
      if (err.constraints) {
        details[property] = Object.values(err.constraints);
      }
      if (err.children && err.children.length > 0) {
        extractErrors(err.children, property);
      }
    }
  }

  extractErrors(errors);

  return new InterviewAIException(
    ErrorCode.VALIDATION_ERROR,
    HttpStatus.BAD_REQUEST,
    'Validation failed for incoming payload',
    { details },
  );
}
