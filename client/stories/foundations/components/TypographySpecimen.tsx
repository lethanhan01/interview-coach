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
  { name: 'xs', twClass: 'text-xs', varName: '--text-xs', remSize: '0.75rem', pxSize: '12px', lineHeight: '1rem (16px)' },
  { name: 'sm', twClass: 'text-sm', varName: '--text-sm', remSize: '0.875rem', pxSize: '14px', lineHeight: '1.25rem (20px)' },
  { name: 'base', twClass: 'text-base', varName: '--text-base', remSize: '1rem', pxSize: '16px', lineHeight: '1.5rem (24px)' },
  { name: 'lg', twClass: 'text-lg', varName: '--text-lg', remSize: '1.125rem', pxSize: '18px', lineHeight: '1.75rem (28px)' },
  { name: 'xl', twClass: 'text-xl', varName: '--text-xl', remSize: '1.25rem', pxSize: '20px', lineHeight: '1.75rem (28px)' },
  { name: '2xl', twClass: 'text-2xl', varName: '--text-2xl', remSize: '1.5rem', pxSize: '24px', lineHeight: '2rem (32px)' },
]

export const TypographySpecimen: React.FC = () => {
  const [sampleText, setSampleText] = useState('Nâng cao kỹ năng phỏng vấn cùng AI Interview Coach')

  return (
    <div className="my-6 space-y-8 font-sans">
      {/* Interactive Text Input */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">
          Văn bản thử nghiệm (Editable Sample Text)
        </label>
        <input
          type="text"
          value={sampleText}
          onChange={(e) => setSampleText(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập văn bản thử nghiệm..."
        />
      </div>

      {/* Font Family Section */}
      <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Font Families</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
              --font-sans (Geist / System UI)
            </span>
            <p className="font-sans text-xl mt-2 text-slate-800 dark:text-slate-200 truncate">
              {sampleText}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
              --font-mono (Geist Mono / Monospace)
            </span>
            <p className="font-mono text-xl mt-2 text-slate-800 dark:text-slate-200 truncate">
              {sampleText}
            </p>
          </div>
        </div>
      </section>

      {/* Font Sizes Scale */}
      <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">
          Font Size Scale
        </h3>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {SIZES.map((s) => (
            <div key={s.name} className="py-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-48 shrink-0 space-y-0.5">
                <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                  {s.twClass}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {s.remSize} ({s.pxSize}) • LH: {s.lineHeight}
                </div>
              </div>

              <div className={`flex-1 text-slate-900 dark:text-slate-100 ${s.twClass} truncate`}>
                {sampleText}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Font Weights */}
      <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">Font Weights</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-mono text-slate-500">font-normal (400)</span>
            <p className="font-normal text-lg mt-1 text-slate-900 dark:text-slate-100">Regular Text</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-mono text-slate-500">font-medium (500)</span>
            <p className="font-medium text-lg mt-1 text-slate-900 dark:text-slate-100">Medium Accent</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-mono text-slate-500">font-semibold (600)</span>
            <p className="font-semibold text-lg mt-1 text-slate-900 dark:text-slate-100">Subheading</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-mono text-slate-500">font-bold (700)</span>
            <p className="font-bold text-lg mt-1 text-slate-900 dark:text-slate-100">Primary Header</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TypographySpecimen
