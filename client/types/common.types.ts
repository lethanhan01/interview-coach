export type SessionType = 'hr' | 'technical'
export type ContextPack = 'VN' | 'Western'
export type OutputLanguage = 'vi' | 'en'

export interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ServerErrorPayload {
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
