import { ApiClientError } from '@/lib/api-client'

export interface ExtractFieldErrorsOptions<TField extends string> {
  allowedFields: readonly TField[]
  codeToField?: Partial<Record<string, TField>>
}

/**
 * Ánh xạ lỗi từ ApiClientError (details theo field hoặc errorCode nghiệp vụ)
 * sang định dạng Record<field, message> để truyền thẳng vào form.setErrors().
 */
export function extractApiFieldErrors<TField extends string>(
  error: unknown,
  options: ExtractFieldErrorsOptions<TField>
): Partial<Record<TField, string>> | null {
  if (!(error instanceof ApiClientError)) {
    return null
  }

  const allowedSet = new Set<string>(options.allowedFields)
  const mapped: Partial<Record<TField, string>> = {}

  if (error.details && typeof error.details === 'object') {
    for (const [key, messages] of Object.entries(error.details)) {
      if (allowedSet.has(key) && Array.isArray(messages) && messages[0]) {
        mapped[key as TField] = messages[0]
      }
    }
  }

  if (
    Object.keys(mapped).length === 0 &&
    error.errorCode &&
    options.codeToField?.[error.errorCode]
  ) {
    const targetField = options.codeToField[error.errorCode]
    if (targetField && allowedSet.has(targetField)) {
      mapped[targetField] = error.message
    }
  }

  return Object.keys(mapped).length > 0 ? mapped : null
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return fallback
}
