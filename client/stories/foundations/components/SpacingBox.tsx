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
      <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">
          Layout Spacing Tokens
        </h3>

        <div className="space-y-4">
          {LAYOUT_SPACING.map((ls) => (
            <div
              key={ls.varName}
              className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {ls.varName}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                    {ls.twName}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{ls.description}</p>
              </div>

              <div className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 shrink-0">
                {ls.val}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Component Spacing Scale */}
      <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">
          Tailwind Spacing Scale (8pt Grid System)
        </h3>

        <div className="space-y-3">
          {TAILWIND_SCALE.map((s) => (
            <div key={s.token} className="flex items-center gap-4 text-xs font-mono">
              <div className="w-20 text-slate-500 shrink-0">
                space-{s.token} ({s.px})
              </div>
              <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded h-6 flex items-center px-1">
                <div
                  className="bg-blue-500 dark:bg-blue-600 h-4 rounded shadow-sm transition-all"
                  style={{ width: s.px }}
                />
              </div>
              <div className="w-16 text-right text-slate-400 shrink-0">{s.rem}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default SpacingBox
