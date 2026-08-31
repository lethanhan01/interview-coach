export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'

export function getApiBaseUrl(): string {
  return API_BASE_URL
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode?: string,
    public readonly data?: unknown
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

const API_ERROR_MESSAGES: Record<string, string> = {
  SESSION_LIMIT_EXCEEDED:
    'Bạn đã tạo 10 phiên phỏng vấn trong 24 giờ qua. Hãy tiếp tục phiên cũ hoặc thử lại sau.',
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
  FORBIDDEN: 'Bạn không có quyền thực hiện thao tác này.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
  USER_NOT_FOUND: 'Không tìm thấy thông tin người dùng.',
  AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác.',
  AUTH_EMAIL_EXISTS: 'Email này đã được sử dụng.',
  INVALID_VERIFICATION_CODE: 'Mã xác thực không chính xác hoặc đã hết hạn.',
}

interface ServerErrorPayload {
  success?: boolean
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

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  }
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T
  }

  const body = (await response
    .json()
    .catch(() => ({ message: response.statusText }))) as ServerErrorPayload

  if (!response.ok || isErrorBody(body)) {
    const err = body
    const message =
      (err.errorCode ? API_ERROR_MESSAGES[err.errorCode] : undefined) ??
      err.message ??
      err.errorCode ??
      `Yêu cầu thất bại (${response.status})`
    throw new ApiClientError(message, response.status, err.errorCode, body)
  }

  return body as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  postForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: 'POST', body }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
