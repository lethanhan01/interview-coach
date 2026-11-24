'use client'

import React, { useState } from 'react'
import { Play } from 'lucide-react'

interface MotionItem {
  name: string
  varName: string
  twClass: string
  val: string
  description: string
}

const DURATIONS: MotionItem[] = [
  {
    name: 'Fast',
    varName: '--animate-duration-fast',
    twClass: 'duration-150',
    val: '150ms',
    description:
      'Phản hồi tức thì cho micro-interactions: Hover, Active, Focus, Toggle switch.',
  },
  {
    name: 'Normal',
    varName: '--animate-duration-normal',
    twClass: 'duration-300',
    val: '300ms',
    description:
      'Chuyển động tiêu chuẩn cho Dropdown, Tooltip, Collapse, Card expansion.',
  },
  {
    name: 'Slow',
    varName: '--animate-duration-slow',
    twClass: 'duration-500',
    val: '500ms',
    description:
      'Chuyển động lớn cho Modal dialog, Sheet drawer, Page transition.',
  },
]

const EASINGS: MotionItem[] = [
  {
    name: 'Standard (Ease In-Out)',
    varName: '--ease-standard',
    twClass: 'ease-in-out',
    val: 'cubic-bezier(0.4, 0, 0.2, 1)',
    description:
      'Chuyển động tự nhiên bắt đầu chậm, tăng tốc và giảm tốc nhẹ nhàng khi dừng.',
  },
  {
    name: 'Enter (Deceleration)',
    varName: '--ease-enter',
    twClass: 'ease-out',
    val: 'cubic-bezier(0, 0, 0.2, 1)',
    description:
      'Phần tử xuất hiện vào màn hình với tốc độ nhanh rồi chạy chậm lại.',
  },
  {
    name: 'Exit (Acceleration)',
    varName: '--ease-exit',
    twClass: 'ease-in',
    val: 'cubic-bezier(0.4, 0, 1, 1)',
    description: 'Phần tử biến mất khỏi màn hình với gia tốc tăng dần.',
  },
]

export const MotionDemo: React.FC = () => {
  const [animateKey, setAnimateKey] = useState(0)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  const triggerAnimation = () => {
    setAnimateKey((prev) => prev + 1)
  }

  return (
    <div className="my-6 space-y-8 font-sans">
      {/* Controls Bar */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <button
          onClick={triggerAnimation}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-700"
        >
          <Play className="h-3.5 w-3.5" />
          <span>Phát lại Animation (Trigger Replay)</span>
        </button>

        <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            checked={isReducedMotion}
            onChange={(e) => setIsReducedMotion(e.target.checked)}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <span>Mô phỏng Reduced Motion (Tắt hiệu ứng)</span>
        </label>
      </div>

      {/* Durations Section */}
      <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Duration Tokens
        </h3>

        <div className="space-y-4">
          {DURATIONS.map((d) => (
            <div
              key={d.varName}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {d.name} ({d.val})
                </span>
                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                  {d.varName}
                </span>
              </div>
              <p className="mb-3 text-xs text-slate-500">{d.description}</p>

              <div className="relative h-10 overflow-hidden rounded-lg bg-slate-200 p-1 dark:bg-slate-800">
                <div
                  key={`${d.varName}-${animateKey}`}
                  className="flex h-full items-center justify-end rounded-md bg-blue-600 px-3 font-mono text-[10px] text-white shadow-sm"
                  style={{
                    width: '100%',
                    transitionProperty: 'transform, width',
                    transitionDuration: isReducedMotion
                      ? '0ms'
                      : `var(${d.varName})`,
                    animation: isReducedMotion
                      ? 'none'
                      : `slide-demo-${d.name} var(${d.varName}) ease-in-out`,
                  }}
                >
                  {d.val}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Easings Section */}
      <section className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Easing Functions
        </h3>

        <div className="space-y-4">
          {EASINGS.map((e) => (
            <div
              key={e.varName}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {e.name}
                </span>
                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
                  {e.varName}
                </span>
              </div>
              <p className="mb-2 text-xs text-slate-500">{e.description}</p>
              <div className="mb-3 font-mono text-[10px] text-slate-400">
                {e.val}
              </div>

              <div className="relative h-10 overflow-hidden rounded-lg bg-slate-200 p-1 dark:bg-slate-800">
                <div
                  key={`${e.varName}-${animateKey}`}
                  className="flex h-full items-center justify-end rounded-md bg-emerald-600 px-3 font-mono text-[10px] text-white shadow-sm"
                  style={{
                    transitionProperty: 'all',
                    transitionDuration: isReducedMotion ? '0ms' : '500ms',
                    transitionTimingFunction: `var(${e.varName})`,
                  }}
                >
                  {e.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default MotionDemo
