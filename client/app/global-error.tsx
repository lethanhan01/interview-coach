'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Fatal Root Layout Error:', error)
  }, [error])

  return (
    <html lang="vi" className="h-full">
      <body className="flex min-h-full items-center justify-center bg-neutral-950 p-6 font-sans text-neutral-100 antialiased">
        <div className="flex max-w-md flex-col items-center rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center shadow-2xl">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500">
            <svg
              className="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="mt-4 text-xl font-bold">Lỗi khởi tạo hệ thống</h1>

          <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
            Đã có sự cố nghiêm trọng xảy ra ở giao diện cốt lõi. Hãy bấm thử lại để tải lại phiên làm việc.
          </p>

          {error.digest && (
            <p className="mt-2 font-mono text-xs text-neutral-500">
              Digest: {error.digest}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              className="rounded-xl border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
            >
              Trang chủ
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
