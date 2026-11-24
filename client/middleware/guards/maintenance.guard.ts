import { NextResponse, type NextRequest } from 'next/server'
import { matchesPathPrefix } from '@/lib/auth-redirect'
import { isMaintenanceModeEnabled, MAINTENANCE_BYPASS_PATHS } from '../config'

/**
 * Maintenance Guard — Blocks public traffic during maintenance mode.
 *
 * Activated by: NEXT_PUBLIC_MAINTENANCE_MODE=true
 * Returns `null` if maintenance mode is off or route is bypassed.
 */
export function maintenanceGuard(request: NextRequest): NextResponse | null {
  if (!isMaintenanceModeEnabled()) return null

  const { pathname } = request.nextUrl

  const isFaviconAsset =
    pathname === '/favicon.ico' || pathname.startsWith('/favicon')
  const isBypassed =
    isFaviconAsset ||
    MAINTENANCE_BYPASS_PATHS.some((prefix) =>
      matchesPathPrefix(pathname, prefix)
    )

  if (isBypassed) return null

  return NextResponse.redirect(new URL('/maintenance', request.url))
}
