import { type NextRequest } from 'next/server'
import { handleMiddleware } from './middleware/index'
import { middlewareMatcher } from './middleware/config'

/**
 * Next.js Middleware entry point.
 * Thin wrapper — all logic lives in middleware/index.ts.
 */
export function middleware(request: NextRequest) {
  return handleMiddleware(request)
}

export const config = {
  matcher: middlewareMatcher,
}
