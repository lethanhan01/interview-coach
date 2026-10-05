export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

export class ApiClientError extends Error {
  public readonly data?: unknown

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode?: string,
    public readonly details?: Record<string, string[]> | null,
    public readonly requestId?: string,
    public readonly correlationId?: string,
    rawData?: unknown,
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.data = details ?? rawData
  }
}

export const API_ERROR_MESSAGES: Record<string, string> = {
  SESSION_LIMIT_EXCEEDED:
    'Bạn đã tạo 10 phiên phỏng vấn trong 24 giờ qua. Hãy tiếp tục phiên cũ hoặc thử lại sau.',
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
  USER_NOT_FOUND: 'Không tìm thấy thông tin người dùng.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác.',
  AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác.',
  EMAIL_ALREADY_EXISTS: 'Email này đã được sử dụng.',
  AUTH_EMAIL_EXISTS: 'Email này đã được sử dụng.',
  EMAIL_NOT_VERIFIED:
    'Email của bạn chưa được xác thực. Vui lòng xác thực email trước khi tiếp tục.',
  SERVICE_UNAVAILABLE:
    'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau ít phút.',
  AI_TIMEOUT:
    'Hệ thống AI phản hồi quá thời gian cho phép. Đang áp dụng kết quả dự phòng.',
  AI_QUOTA_EXCEEDED:
    'Hệ thống AI đang tạm thời vượt hạn mức, vui lòng thử lại sau.',
  INVALID_VERIFICATION_CODE: 'Mã xác thực không chính xác hoặc đã hết hạn.',
  RATE_LIMIT_EXCEEDED:
    'Hệ thống đang tiếp nhận quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
  REQUEST_IN_PROGRESS:
    'Thao tác đang được xử lý, vui lòng không gửi yêu cầu liên tục.',
}

interface ServerErrorPayload {
  success?: boolean
  error?: {
    code?: string
    message?: string
    details?: Record<string, string[]> | null
  }
  meta?: {
    requestId?: string
    correlationId?: string
    timestamp?: string
    path?: string
  }
  errorCode?: string
  message?: string
  [key: string]: unknown
}

function isErrorBody(value: unknown): value is ServerErrorPayload {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    (value as ServerErrorPayload).success === false
  )
}

let isRefreshing = false
let refreshSubscribers: Array<(error?: Error | null) => void> = []

function subscribeTokenRefresh(cb: (error?: Error | null) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(error?: Error | null) {
  refreshSubscribers.forEach((cb) => cb(error))
  refreshSubscribers = []
}

const AUTH_EXCLUDED_FROM_REFRESH = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/password-reset',
  '/auth/email-verification',
]

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export interface RequestOptions extends RequestInit {
  idempotencyKey?: string
}

async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const method = (options.method || 'GET').toUpperCase()
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  if (isMutation) {
    headers['Idempotency-Key'] = options.idempotencyKey || generateUuid()
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  // Handle 401 Silent Refresh for non-auth endpoints
  if (
    response.status === 401 &&
    !AUTH_EXCLUDED_FROM_REFRESH.some((excluded) => path.startsWith(excluded))
  ) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })

        if (refreshResponse.ok) {
          isRefreshing = false
          onRefreshed(null)
          return request<T>(path, options)
        } else {
          isRefreshing = false
          const sessionErr = new Error('Session expired')
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:session-expired'))
          }
          onRefreshed(sessionErr)
        }
      } catch (err) {
        isRefreshing = false
        onRefreshed(err instanceof Error ? err : new Error(String(err)))
      }
    } else {
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh((err) => {
          if (err) {
            reject(
              new ApiClientError(
                API_ERROR_MESSAGES.UNAUTHORIZED,
                401,
                'UNAUTHORIZED'
              )
            )
          } else {
            resolve(request<T>(path, options))
          }
        })
      })
    }
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T
  }

  const body = (await response
    .json()
    .catch(() => ({ message: response.statusText }))) as ServerErrorPayload

  if (!response.ok || isErrorBody(body)) {
    const err = body
    const code = err.error?.code ?? err.errorCode
    const details = err.error?.details ?? null
    const requestId = err.meta?.requestId
    const correlationId = err.meta?.correlationId

    const message =
      (code ? API_ERROR_MESSAGES[code] : undefined) ??
      err.error?.message ??
      err.message ??
      code ??
      `Yêu cầu thất bại (${response.status})`
    throw new ApiClientError(
      message,
      response.status,
      code,
      details,
      requestId,
      correlationId,
      body,
    )
  }

  return body as T
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  postForm: <T>(path: string, body: FormData, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
