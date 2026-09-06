'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import Button from '@/components/ui/Button'

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
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Initialise from browser's current online state
    setIsOffline(!navigator.onLine)

    const handleOffline = () => setIsOffline(true)
    const handleOnline  = () => setIsOffline(false)

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online',  handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online',  handleOnline)
    }
  }, [])

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
