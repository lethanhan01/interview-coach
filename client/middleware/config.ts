/** Primary HttpOnly access token cookie (khớp server/src/modules/auth/auth.service.ts). */
export function getAccessCookieName(): string {
  return (
    process.env.AUTH_ACCESS_COOKIE_NAME ??
    process.env.AUTH_COOKIE_NAME ??
    'intervia_access'
  )
}

/** Refresh token cookie (khớp server/src/modules/auth/auth.service.ts). */
export function getRefreshCookieName(): string {
  return (
    process.env.AUTH_REFRESH_COOKIE_NAME ??
    process.env.REFRESH_COOKIE_NAME ??
    'intervia_refresh'
  )
}

/** Legacy fallback cookie name from older auth implementation. */
export const LEGACY_COOKIE = 'intervia_auth'

/** Đọc runtime để hỗ trợ kiểm thử và cấu hình động. */
export function isMaintenanceModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'
}

/**
 * Các đường dẫn được đi qua khi bật Maintenance Mode (so khớp ranh giới path):
 * - /maintenance     → trang thông báo bảo trì
 * - /admin           → cổng quản trị kiểm tra trạng thái hệ thống
 * - /login           → cho phép quản trị viên đăng nhập khi đang bảo trì
 * - /unauthenticated → luồng chuyển tiếp từ authGuard khi chưa có phiên
 * - /_next           → tài nguyên nội bộ Next.js
 */
export const MAINTENANCE_BYPASS_PATHS = [
  '/maintenance',
  '/admin',
  '/login',
  '/unauthenticated',
  '/_next',
] as const

/** Các route chỉ dành cho khách chưa đăng nhập (giữ mở /reset-password). */
export const GUEST_ONLY_AUTH_PATHS = ['/login', '/register'] as const
