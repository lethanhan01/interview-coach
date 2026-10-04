import { NextResponse, type NextRequest } from 'next/server'
import { MAINTENANCE_MODE, MAINTENANCE_BYPASS_PREFIXES } from '../config'

/**
 * Maintenance Guard — Blocks all traffic during maintenance mode.
 *
 * Activated by: NEXT_PUBLIC_MAINTENANCE_MODE=true
 *
 * Bypass list (from config.ts):
 * - /maintenance  → the page itself
 * - /admin        → admins can access system while it's down
 * - /_next        → Next.js static/image internals
 * - /favicon      → browser favicon
 *
 * Returns `null` if maintenance mode is off or route is bypassed.
 */
export function maintenanceGuard(request: NextRequest): NextResponse | null {
  if (!MAINTENANCE_MODE) return null

  const { pathname } = request.nextUrl

  const isBypassed = MAINTENANCE_BYPASS_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  )

  if (isBypassed) return null

  return NextResponse.redirect(new URL('/maintenance', request.url))
}
