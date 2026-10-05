import { ApiClientError } from '../api-client'

describe('ApiClientError', () => {
  it('khởi tạo với các tham số cơ bản', () => {
    const error = new ApiClientError('Lỗi kiểm tra', 400, 'VALIDATION_ERROR')
    expect(error.message).toBe('Lỗi kiểm tra')
    expect(error.statusCode).toBe(400)
    expect(error.errorCode).toBe('VALIDATION_ERROR')
    expect(error.details).toBeUndefined()
    expect(error.data).toBeUndefined()
  })

  it('lưu trữ details và requestId từ response mới', () => {
    const details = { email: ['email must be valid'] }
    const error = new ApiClientError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      details,
      'req-abc-123',
    )
    expect(error.statusCode).toBe(400)
    expect(error.errorCode).toBe('VALIDATION_ERROR')
    expect(error.details).toEqual(details)
    expect(error.requestId).toBe('req-abc-123')
    expect(error.data).toEqual(details)
  })

  it('lưu rawData vào data nếu không có details (backward compatibility)', () => {
    const rawData = { legacyField: 'abc' }
    const error = new ApiClientError(
      'Legacy error',
      500,
      'INTERNAL_ERROR',
      null,
      undefined,
      undefined,
      rawData,
    )
    expect(error.data).toEqual(rawData)
  })

  it('lưu trữ correlationId và requestId đầy đủ từ response metadata', () => {
    const details = { password: ['password is too weak'] }
    const error = new ApiClientError(
      'Validation error',
      400,
      'VALIDATION_ERROR',
      details,
      'req-test-999',
      'corr-trace-888',
    )
    expect(error.statusCode).toBe(400)
    expect(error.errorCode).toBe('VALIDATION_ERROR')
    expect(error.details).toEqual(details)
    expect(error.requestId).toBe('req-test-999')
    expect(error.correlationId).toBe('corr-trace-888')
    expect(error.data).toEqual(details)
  })
})

