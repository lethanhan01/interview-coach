import { ValidationError } from 'class-validator';
import { validationErrorFactory } from './validation-error.factory';
import { ErrorCode } from '../exceptions/error-code.enum';

describe('validationErrorFactory', () => {
  it('gom nhóm constraints thành dictionary theo property', () => {
    const error1 = new ValidationError();
    error1.property = 'email';
    error1.constraints = {
      isEmail: 'email must be an email',
      isNotEmpty: 'email should not be empty',
    };

    const error2 = new ValidationError();
    error2.property = 'password';
    error2.constraints = {
      minLength: 'password must be longer than 8 characters',
    };

    const exception = validationErrorFactory([error1, error2]);
    expect(exception.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    expect(exception.getStatus()).toBe(400);

    const details = exception.details as Record<string, string[]>;
    expect(details.email).toEqual([
      'email must be an email',
      'email should not be empty',
    ]);
    expect(details.password).toEqual([
      'password must be longer than 8 characters',
    ]);
  });

  it('xử lý lồng nhau (nested properties)', () => {
    const childError = new ValidationError();
    childError.property = 'street';
    childError.constraints = { isNotEmpty: 'street should not be empty' };

    const parentError = new ValidationError();
    parentError.property = 'address';
    parentError.children = [childError];

    const exception = validationErrorFactory([parentError]);
    const details = exception.details as Record<string, string[]>;
    expect(details['address.street']).toEqual([
      'street should not be empty',
    ]);
  });
});
