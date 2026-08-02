const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1'

const API_ERROR_MESSAGES: Record<string, string> = {
  SESSION_LIMIT_EXCEEDED:
    'Bạn đã tạo 10 phiên phỏng vấn trong 24 giờ qua. Hãy tiếp tục phiên cũ hoặc thử lại sau.',
}

function isErrorBody(
  value: unknown
): value is { errorCode?: string; message?: string } {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    (value as { success?: unknown }).success === false
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
  const body = await response
    .json()
    .catch(() => ({ message: response.statusText }))

  if (!response.ok || isErrorBody(body)) {
    const err = body as { errorCode?: string; message?: string }
    const message =
      (err.errorCode ? API_ERROR_MESSAGES[err.errorCode] : undefined) ??
      err.message ??
      err.errorCode ??
      `Request failed: ${response.status}`
    throw new Error(message)
  }

  return body as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  postForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: 'POST', body }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
