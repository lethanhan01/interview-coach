const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1'

async function request<T>(path: string, options: RequestInit, accessToken?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error((error as { message?: string }).message ?? `Request failed: ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string, accessToken?: string) =>
    request<T>(path, { method: 'GET' }, accessToken),

  post: <T>(path: string, body: unknown, accessToken?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, accessToken),

  patch: <T>(path: string, body: unknown, accessToken?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, accessToken),
}
