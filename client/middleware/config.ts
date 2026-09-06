// ─── Auth cookies ─────────────────────────────────────────────────────────────
/** Primary HttpOnly access token cookie. Configurable via env. */
export const ACCESS_COOKIE  = process.env.AUTH_COOKIE_NAME    ?? 'interviewcoach_access'
/** Refresh token cookie. Configurable via env. */
export const REFRESH_COOKIE = process.env.REFRESH_COOKIE_NAME ?? 'interviewcoach_refresh'
/** Legacy fallback cookie name from older auth implementation. */
export const LEGACY_COOKIE  = 'interviewcoach_auth'

// ─── Maintenance mode ─────────────────────────────────────────────────────────
/**
 * Set NEXT_PUBLIC_MAINTENANCE_MODE=true to activate maintenance mode.
 * All routes except those in MAINTENANCE_BYPASS_PREFIXES will be redirected to /maintenance.
 */
export const MAINTENANCE_MODE =
  process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

/**
 * Routes that are NOT redirected during maintenance mode.
 * - /maintenance → the maintenance page itself
 * - /admin       → admins can bypass to check system status
 * - /_next       → Next.js internals
 * - /favicon     → favicon asset
 */
export const MAINTENANCE_BYPASS_PREFIXES = [
  '/maintenance',
  '/admin',
  '/_next',
  '/favicon',
] as const

// ─── Next.js middleware matcher ───────────────────────────────────────────────
/**
 * Excludes static assets and images from middleware processing.
 * Re-exported here so middleware.ts (root) stays as a thin wrapper.
 */
export const middlewareMatcher = [
  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
]
