'use client'

import { useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'
import Button from '@/components/ui/Button'

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getOnlineSnapshot() {
  return !navigator.onLine
}

function getServerSnapshot() {
  return false
}

/**
 * OfflineBanner — Global network offline overlay.
 * Mount once in app/layout.tsx (inside AuthProvider).
 *
 * Behaviour:
 * - Detects offline via navigator.onLine + window 'online'/'offline' events.
 * - Shows a full-screen overlay with a "Thử lại" button.
 * - Automatically hides when connectivity is restored.
 */
export function OfflineBanner() {
  const isOffline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerSnapshot
  )

  if (!isOffline) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-surface-3/95 p-6 backdrop-blur-sm"
    >
      {/* Icon */}
      <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-surface-inset">
        <WifiOff className="size-8 text-ink-muted" />
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-ink text-xl font-bold">Mất kết nối mạng</h2>
        <p className="text-ink-muted max-w-xs text-sm leading-relaxed">
          Vui lòng kiểm tra kết nối internet. Trang sẽ tự động khôi phục khi có mạng trở lại.
        </p>
      </div>

      {/* Retry */}
      <Button
        variant="outline"
        size="md"
        onClick={() => window.location.reload()}
      >
        Thử lại
      </Button>
    </div>
  )
}
