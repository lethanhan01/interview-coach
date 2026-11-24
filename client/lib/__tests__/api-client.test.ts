import { vi } from 'vitest'
import { ApiClientError, API_ERROR_MESSAGES, apiClient } from '../api-client'

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
      'req-abc-123'
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
      rawData
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
      'corr-trace-888'
    )
    expect(error.statusCode).toBe(400)
    expect(error.errorCode).toBe('VALIDATION_ERROR')
    expect(error.details).toEqual(details)
    expect(error.requestId).toBe('req-test-999')
    expect(error.correlationId).toBe('corr-trace-888')
    expect(error.data).toEqual(details)
  })
})

describe('apiClient Idempotency & Error Messages', () => {
  const originalFetch = global.fetch

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('định nghĩa thông điệp tiếng Việt thân thiện cho REQUEST_IN_PROGRESS', () => {
    expect(API_ERROR_MESSAGES.REQUEST_IN_PROGRESS).toBe(
      'Thao tác đang được xử lý, vui lòng không gửi yêu cầu liên tục.'
    )
  })

  it('gửi header Idempotency-Key khi options chứa idempotencyKey', async () => {
    let capturedHeaders: Record<string, string> | undefined

    global.fetch = vi.fn().mockImplementation((url, init) => {
      capturedHeaders = init?.headers as Record<string, string>
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'sess-123' }),
      })
    })

    const res = await apiClient.post(
      '/sessions',
      { role: 'Backend' },
      { idempotencyKey: 'custom-key-uuid-123' }
    )

    expect(res).toEqual({ id: 'sess-123' })
    expect(capturedHeaders?.['Idempotency-Key']).toBe('custom-key-uuid-123')
    expect(capturedHeaders?.['Content-Type']).toBe('application/json')
  })

  it('tự động sinh header Idempotency-Key khi options không chứa idempotencyKey trên POST', async () => {
    let capturedHeaders: Record<string, string> | undefined

    global.fetch = vi.fn().mockImplementation((url, init) => {
      capturedHeaders = init?.headers as Record<string, string>
      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 'sess-auto-key' }),
      })
    })

    const res = await apiClient.post('/sessions', { role: 'Backend' })

    expect(res).toEqual({ id: 'sess-auto-key' })
    expect(capturedHeaders?.['Idempotency-Key']).toBeDefined()
    expect(capturedHeaders?.['Idempotency-Key'].length).toBeGreaterThan(10)
  })

  it('không gắn header Idempotency-Key trên GET requests', async () => {
    let capturedHeaders: Record<string, string> | undefined

    global.fetch = vi.fn().mockImplementation((url, init) => {
      capturedHeaders = init?.headers as Record<string, string>
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      })
    })

    await apiClient.get('/sessions')

    expect(capturedHeaders?.['Idempotency-Key']).toBeUndefined()
  })
})
