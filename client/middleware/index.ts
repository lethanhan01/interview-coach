import { NextResponse, type NextRequest } from 'next/server'
import { maintenanceGuard } from './guards/maintenance.guard'
import { authGuard } from './guards/auth.guard'

/**
 * Middleware pipeline — composes guards in priority order.
 *
 * Guard execution order:
 * 1. maintenanceGuard — highest priority: if site is down, block everything first
 * 2. authGuard        — session & login-page redirect
 *
 * Each guard returns a NextResponse to short-circuit, or null to pass through.
 */
export function handleMiddleware(request: NextRequest): NextResponse {
  const maintenanceResult = maintenanceGuard(request)
  if (maintenanceResult) return maintenanceResult

  const authResult = authGuard(request)
  if (authResult) return authResult

  return NextResponse.next()
}
