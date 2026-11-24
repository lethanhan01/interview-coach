'use client'

import React from 'react'

interface LayoutSpacingItem {
  varName: string
  twName: string
  val: string
  description: string
}

interface ComponentSpacingItem {
  token: string
  rem: string
  px: string
}

const LAYOUT_SPACING: LayoutSpacingItem[] = [
  {
    varName: '--spacing-content-max-width',
    twName: 'max-w-[1280px]',
    val: '1280px',
    description: 'Chiều rộng tối đa của nội dung trang.',
  },
  {
    varName: '--spacing-header-height',
    twName: 'h-16 (4rem)',
    val: '64px',
    description: 'Chiều cao cố định của thanh Header.',
  },
  {
    varName: '--spacing-sidebar-width',
    twName: 'w-64 (16rem)',
    val: '256px',
    description: 'Chiều rộng của Sidebar điều hướng.',
  },
  {
    varName: '--spacing-page-padding-desktop',
    twName: 'px-8 (2rem)',
    val: '32px',
    description: 'Padding lề 2 bên của trang trên desktop.',
  },
  {
    varName: '--spacing-page-padding-mobile',
    twName: 'px-4 (1rem)',
    val: '16px',
    description: 'Padding lề 2 bên của trang trên mobile.',
  },
]

const TAILWIND_SCALE: ComponentSpacingItem[] = [
  { token: '1', rem: '0.25rem', px: '4px' },
  { token: '2', rem: '0.5rem', px: '8px' },
  { token: '3', rem: '0.75rem', px: '12px' },
  { token: '4', rem: '1rem', px: '16px' },
  { token: '6', rem: '1.5rem', px: '24px' },
  { token: '8', rem: '2rem', px: '32px' },
  { token: '12', rem: '3rem', px: '48px' },
  { token: '16', rem: '4rem', px: '64px' },
]

export const SpacingBox: React.FC = () => {
  return (
    <div className="my-6 space-y-8 font-sans">
      {/* Layout Spacing Tokens */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Layout Spacing Tokens
        </h3>

        <div className="space-y-4">
          {LAYOUT_SPACING.map((ls) => (
            <div
              key={ls.varName}
              className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {ls.varName}
                  </span>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {ls.twName}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{ls.description}</p>
              </div>

              <div className="shrink-0 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                {ls.val}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Component Spacing Scale */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Tailwind Spacing Scale (8pt Grid System)
        </h3>

        <div className="space-y-3">
          {TAILWIND_SCALE.map((s) => (
            <div
              key={s.token}
              className="flex items-center gap-4 font-mono text-xs"
            >
              <div className="w-20 shrink-0 text-slate-500">
                space-{s.token} ({s.px})
              </div>
              <div className="flex h-6 flex-1 items-center rounded bg-slate-100 px-1 dark:bg-slate-800">
                <div
                  className="h-4 rounded bg-blue-500 shadow-sm transition-all dark:bg-blue-600"
                  style={{ width: s.px }}
                />
              </div>
              <div className="w-16 shrink-0 text-right text-slate-400">
                {s.rem}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default SpacingBox
