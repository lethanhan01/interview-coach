'use client'

import React from 'react'

interface RadiusItem {
  name: string
  varName: string
  twClass: string
  remVal: string
  pxVal: string
  description: string
}

const RADIUS_TOKENS: RadiusItem[] = [
  {
    name: 'None',
    varName: '--radius-none',
    twClass: 'rounded-none',
    remVal: '0px',
    pxVal: '0px',
    description: 'Góc vuông hoàn toàn cho phần tử viền sát mép.',
  },
  {
    name: 'Small',
    varName: '--radius-sm',
    twClass: 'rounded-sm',
    remVal: '0.125rem',
    pxVal: '2px',
    description: 'Bo nhẹ cho checkbox, kề phần tử nhỏ.',
  },
  {
    name: 'Medium',
    varName: '--radius-md',
    twClass: 'rounded-md',
    remVal: '0.375rem',
    pxVal: '6px',
    description: 'Bo chuẩn cho Button, Input, Tag, Badge.',
  },
  {
    name: 'Large',
    varName: '--radius-lg',
    twClass: 'rounded-lg',
    remVal: '0.5rem',
    pxVal: '8px',
    description: 'Bo cho Card, Container, Dropdown popover.',
  },
  {
    name: 'Extra Large',
    varName: '--radius-xl',
    twClass: 'rounded-xl',
    remVal: '0.75rem',
    pxVal: '12px',
    description: 'Bo cho Dialog modal, Floating card lớn.',
  },
  {
    name: 'Full (Pill)',
    varName: '--radius-full',
    twClass: 'rounded-full',
    remVal: '9999px',
    pxVal: 'Pill/Circle',
    description: 'Bo tròn hoàn toàn cho Avatar, Pill button, Status dot.',
  },
]

export const RadiusBox: React.FC = () => {
  return (
    <div className="my-6 space-y-8 font-sans">
      {/* Radius Tokens Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {RADIUS_TOKENS.map((r) => (
          <div
            key={r.varName}
            className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900"
          >
            <div
              className="mb-3 flex h-16 w-16 items-center justify-center border-2 border-blue-500 bg-blue-500/10 font-mono text-xs font-bold text-blue-600 dark:text-blue-400"
              style={{ borderRadius: `var(${r.varName})` }}
            >
              {r.pxVal}
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {r.name}
            </span>
            <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">
              {r.twClass}
            </span>
            <span className="mt-1 text-[10px] text-slate-400">{r.remVal}</span>
          </div>
        ))}
      </div>

      {/* Nested Radius Principle */}
      <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Nguyên tắc Bo góc Lồng nhau (Nested Border Radius)
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Khi một phần tử có bo góc nằm bên trong một container bo góc, bán kính
          bo góc của container bên ngoài phải bằng bán kính phần tử bên trong
          cộng với khoảng cách (padding):
          <code className="mx-1 rounded bg-slate-200 px-1.5 py-0.5 font-mono text-blue-600 dark:bg-slate-800 dark:text-blue-400">
            R_outer = R_inner + padding
          </code>
        </p>

        <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl border border-blue-300 bg-blue-100 p-4 dark:border-blue-800 dark:bg-blue-950">
            <div className="rounded-md bg-blue-600 px-4 py-2 text-xs font-medium text-white">
              Inner Element (rounded-md = 6px) + Padding 16px = Outer Container
              (rounded-xl = 12px)
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default RadiusBox
