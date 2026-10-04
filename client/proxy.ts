import { type NextRequest } from 'next/server'
import { handleMiddleware } from './middleware/index'

/**
 * Next.js proxy entry point (Next.js 16 convention — replaces middleware.ts).
 * Thin wrapper — all logic lives in middleware/index.ts.
 *
 * IMPORTANT: `config.matcher` must be a static literal — Turbopack parses it
 * at compile-time and cannot resolve imported variables.
 */
export function proxy(request: NextRequest) {
  return handleMiddleware(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
