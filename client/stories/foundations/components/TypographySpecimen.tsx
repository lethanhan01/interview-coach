'use client'

import React, { useState } from 'react'

interface TypographySize {
  name: string
  twClass: string
  varName: string
  remSize: string
  pxSize: string
  lineHeight: string
}

const SIZES: TypographySize[] = [
  {
    name: 'xs',
    twClass: 'text-xs',
    varName: '--text-xs',
    remSize: '0.75rem',
    pxSize: '12px',
    lineHeight: '1rem (16px)',
  },
  {
    name: 'sm',
    twClass: 'text-sm',
    varName: '--text-sm',
    remSize: '0.875rem',
    pxSize: '14px',
    lineHeight: '1.25rem (20px)',
  },
  {
    name: 'base',
    twClass: 'text-base',
    varName: '--text-base',
    remSize: '1rem',
    pxSize: '16px',
    lineHeight: '1.5rem (24px)',
  },
  {
    name: 'lg',
    twClass: 'text-lg',
    varName: '--text-lg',
    remSize: '1.125rem',
    pxSize: '18px',
    lineHeight: '1.75rem (28px)',
  },
  {
    name: 'xl',
    twClass: 'text-xl',
    varName: '--text-xl',
    remSize: '1.25rem',
    pxSize: '20px',
    lineHeight: '1.75rem (28px)',
  },
  {
    name: '2xl',
    twClass: 'text-2xl',
    varName: '--text-2xl',
    remSize: '1.5rem',
    pxSize: '24px',
    lineHeight: '2rem (32px)',
  },
]

export const TypographySpecimen: React.FC = () => {
  const [sampleText, setSampleText] = useState(
    'Nâng cao kỹ năng phỏng vấn cùng AI Interview Coach'
  )

  return (
    <div className="my-6 space-y-8 font-sans">
      {/* Interactive Text Input */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
          Văn bản thử nghiệm (Editable Sample Text)
        </label>
        <input
          type="text"
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          placeholder="Nhập văn bản thử nghiệm..."
        />
      </div>

      {/* Font Family Section */}
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Font Families
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
              --font-sans (Geist / System UI)
            </span>
            <p className="mt-2 truncate font-sans text-xl text-slate-800 dark:text-slate-200">
              {sampleText}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
              --font-mono (Geist Mono / Monospace)
            </span>
            <p className="mt-2 truncate font-mono text-xl text-slate-800 dark:text-slate-200">
              {sampleText}
            </p>
          </div>
        </div>
      </section>

      {/* Font Sizes Scale */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Font Size Scale
        </h3>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {SIZES.map((s) => (
            <div
              key={s.name}
              className="flex flex-col gap-4 py-4 md:flex-row md:items-center"
            >
              <div className="w-48 shrink-0 space-y-0.5">
                <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  {s.twClass}
                </div>
                <div className="font-mono text-[11px] text-slate-500">
                  {s.remSize} ({s.pxSize}) • LH: {s.lineHeight}
                </div>
              </div>

              <div
                className={`flex-1 text-slate-900 dark:text-slate-100 ${s.twClass} truncate`}
              >
                {sampleText}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Font Weights */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
          Font Weights
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <span className="font-mono text-xs text-slate-500">
              font-normal (400)
            </span>
            <p className="mt-1 text-lg font-normal text-slate-900 dark:text-slate-100">
              Regular Text
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <span className="font-mono text-xs text-slate-500">
              font-medium (500)
            </span>
            <p className="mt-1 text-lg font-medium text-slate-900 dark:text-slate-100">
              Medium Accent
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <span className="font-mono text-xs text-slate-500">
              font-semibold (600)
            </span>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Subheading
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <span className="font-mono text-xs text-slate-500">
              font-bold (700)
            </span>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              Primary Header
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TypographySpecimen
