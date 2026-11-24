'use client'

import React from 'react'

interface ShadowItem {
  name: string
  varName: string
  twClass: string
  description: string
  value: string
}

const SHADOWS: ShadowItem[] = [
  {
    name: 'Extra Small',
    varName: '--shadow-xs',
    twClass: 'shadow-xs',
    description: 'Bóng nhẹ nhất cho các thẻ card nhỏ, badge, hover state nhẹ.',
    value: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  },
  {
    name: 'Small',
    varName: '--shadow-sm',
    twClass: 'shadow-sm',
    description: 'Bóng chuẩn cho các ô input, button, card thông thường.',
    value: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  },
  {
    name: 'Medium',
    varName: '--shadow-md',
    twClass: 'shadow-md',
    description: 'Bóng cho dropdown menu, card nổi bật khi hover.',
    value: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  },
  {
    name: 'Large',
    varName: '--shadow-lg',
    twClass: 'shadow-lg',
    description: 'Bóng cao cho floating action, sticky header.',
    value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  {
    name: 'Popover',
    varName: '--shadow-popover',
    twClass: 'shadow-popover',
    description: 'Bóng riêng biệt cho Popover, Tooltip, Dropdown floating.',
    value: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  {
    name: 'Dialog / Modal',
    varName: '--shadow-dialog',
    twClass: 'shadow-dialog',
    description:
      'Bóng cao nhất cho Modal dialog, Confirm box nổi hẳn lên lớp Overlay.',
    value:
      '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  {
    name: 'Focus Ring',
    varName: '--shadow-focus',
    twClass: 'shadow-focus',
    description:
      'Vòng khoanh viền focus hỗ trợ Accessibility khi dùng bàn phím tab.',
    value:
      '0 0 0 2px var(--color-background), 0 0 0 4px var(--color-brand-500)',
  },
]

export const ShadowBox: React.FC = () => {
  return (
    <div className="my-6 space-y-8 font-sans">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {SHADOWS.map((s) => (
          <div
            key={s.varName}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {s.name}
                </span>
                <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
                  {s.twClass}
                </span>
              </div>
              <p className="text-xs text-slate-500">{s.description}</p>
              <div className="break-all rounded bg-slate-50 p-2 font-mono text-[10px] text-slate-400 dark:bg-slate-800">
                {s.value}
              </div>
            </div>

            {/* Visual Box demonstrating the shadow */}
            <div className="flex items-center justify-center rounded-lg bg-slate-100 p-4 dark:bg-slate-950">
              <div
                className="w-full rounded-md border border-slate-200/50 bg-white px-3 py-4 text-center text-xs font-medium text-slate-700 dark:border-slate-700/50 dark:bg-slate-800 dark:text-slate-200"
                style={{ boxShadow: `var(${s.varName})` }}
              >
                Visual Preview ({s.name})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ShadowBox
