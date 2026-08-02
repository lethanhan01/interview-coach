'use client'

import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface PrimitiveColor {
  name: string
  varName: string
  hex: string
}

interface SemanticColor {
  name: string
  varName: string
  lightValue: string
  darkValue: string
  description: string
}

const PRIMITIVE_NEUTRAL: PrimitiveColor[] = [
  { name: 'neutral-50', varName: '--color-neutral-50', hex: '#f8fafc' },
  { name: 'neutral-100', varName: '--color-neutral-100', hex: '#f1f5f9' },
  { name: 'neutral-200', varName: '--color-neutral-200', hex: '#e2e8f0' },
  { name: 'neutral-300', varName: '--color-neutral-300', hex: '#cbd5e1' },
  { name: 'neutral-400', varName: '--color-neutral-400', hex: '#94a3b8' },
  { name: 'neutral-500', varName: '--color-neutral-500', hex: '#64748b' },
  { name: 'neutral-600', varName: '--color-neutral-600', hex: '#475569' },
  { name: 'neutral-700', varName: '--color-neutral-700', hex: '#334155' },
  { name: 'neutral-800', varName: '--color-neutral-800', hex: '#1e293b' },
  { name: 'neutral-900', varName: '--color-neutral-900', hex: '#0f172a' },
  { name: 'neutral-950', varName: '--color-neutral-950', hex: '#020617' },
]

const PRIMITIVE_BRAND: PrimitiveColor[] = [
  { name: 'brand-50', varName: '--color-brand-50', hex: '#eff6ff' },
  { name: 'brand-100', varName: '--color-brand-100', hex: '#dbeafe' },
  { name: 'brand-200', varName: '--color-brand-200', hex: '#bfdbfe' },
  { name: 'brand-300', varName: '--color-brand-300', hex: '#93c5fd' },
  { name: 'brand-400', varName: '--color-brand-400', hex: '#60a5fa' },
  { name: 'brand-500', varName: '--color-brand-500', hex: '#3b82f6' },
  { name: 'brand-600', varName: '--color-brand-600', hex: '#2563eb' },
  { name: 'brand-700', varName: '--color-brand-700', hex: '#1d4ed8' },
  { name: 'brand-800', varName: '--color-brand-800', hex: '#1e40af' },
  { name: 'brand-900', varName: '--color-brand-900', hex: '#1e3a8a' },
  { name: 'brand-950', varName: '--color-brand-950', hex: '#172554' },
]

const PRIMITIVE_RED: PrimitiveColor[] = [
  { name: 'red-500', varName: '--color-red-500', hex: '#ef4444' },
  { name: 'red-600', varName: '--color-red-600', hex: '#dc2626' },
  { name: 'red-700', varName: '--color-red-700', hex: '#b91c1c' },
]

const PRIMITIVE_GREEN: PrimitiveColor[] = [
  { name: 'green-500', varName: '--color-green-500', hex: '#22c55e' },
  { name: 'green-600', varName: '--color-green-600', hex: '#16a34a' },
  { name: 'green-700', varName: '--color-green-700', hex: '#15803d' },
]

const PRIMITIVE_AMBER: PrimitiveColor[] = [
  { name: 'amber-400', varName: '--color-amber-400', hex: '#fbbf24' },
  { name: 'amber-500', varName: '--color-amber-500', hex: '#f59e0b' },
  { name: 'amber-600', varName: '--color-amber-600', hex: '#d97706' },
]

const SEMANTIC_COLORS: SemanticColor[] = [
  {
    name: 'Background / Foreground',
    varName: '--color-background',
    lightValue: 'neutral-50 (#f8fafc)',
    darkValue: 'neutral-950 (#020617)',
    description: 'Nền chính của toàn bộ trang web và màu chữ chuẩn.',
  },
  {
    name: 'Surface / Card',
    varName: '--color-surface',
    lightValue: '#ffffff',
    darkValue: 'neutral-900 (#0f172a)',
    description: 'Nền của container, thẻ card, bảng điều khiển.',
  },
  {
    name: 'Primary',
    varName: '--color-primary',
    lightValue: 'brand-600 (#2563eb)',
    darkValue: 'brand-500 (#3b82f6)',
    description: 'Màu thương hiệu chủ đạo cho nút nhấn, link chính, active state.',
  },
  {
    name: 'Secondary',
    varName: '--color-secondary',
    lightValue: 'neutral-100 (#f1f5f9)',
    darkValue: 'neutral-800 (#1e293b)',
    description: 'Hành động phụ hoặc phần tử có độ ưu tiên thấp hơn.',
  },
  {
    name: 'Muted',
    varName: '--color-muted',
    lightValue: 'neutral-100 / neutral-500',
    darkValue: 'neutral-800 / neutral-400',
    description: 'Văn bản phụ, placeholder, trạng thái nhạt.',
  },
  {
    name: 'Destructive',
    varName: '--color-destructive',
    lightValue: 'red-600 (#dc2626)',
    darkValue: 'red-500 (#ef4444)',
    description: 'Hành động nguy hiểm, xóa dữ liệu, lỗi hệ thống.',
  },
  {
    name: 'Success',
    varName: '--color-success',
    lightValue: 'green-600 (#16a34a)',
    darkValue: 'green-500 (#22c55e)',
    description: 'Trạng thái thành công, hoàn thành, đáp án đúng.',
  },
  {
    name: 'Warning',
    varName: '--color-warning',
    lightValue: 'amber-500 (#f59e0b)',
    darkValue: 'amber-500 (#f59e0b)',
    description: 'Cảnh báo, nhắc nhở cần chú ý.',
  },
  {
    name: 'Border / Input',
    varName: '--color-border',
    lightValue: 'neutral-200 (#e2e8f0)',
    darkValue: 'neutral-800 (#1e293b)',
    description: 'Đường viền của card, input, divider.',
  },
]

export const ColorPalette: React.FC = () => {
  const [copiedVar, setCopiedVar] = useState<string | null>(null)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedVar(text)
    setTimeout(() => setCopiedVar(null), 2000)
  }

  const renderPrimitiveRow = (title: string, colors: PrimitiveColor[]) => (
    <div className="mb-6">
      <h4 className="text-sm font-semibold mb-3 text-slate-800 dark:text-slate-200">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
        {colors.map((c) => (
          <button
            key={c.varName}
            onClick={() => handleCopy(`var(${c.varName})`)}
            className="group relative flex flex-col items-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-md transition bg-white dark:bg-slate-900 text-left"
            title={`Click to copy var(${c.varName})`}
          >
            <div
              className="w-full h-12 rounded-md mb-2 shadow-inner border border-black/10"
              style={{ backgroundColor: c.hex }}
            />
            <span className="text-xs font-mono font-medium truncate w-full text-slate-700 dark:text-slate-300">
              {c.name}
            </span>
            <span className="text-[10px] font-mono text-slate-400">{c.hex}</span>

            {copiedVar === `var(${c.varName})` ? (
              <span className="absolute top-1 right-1 bg-emerald-500 text-white p-1 rounded-full text-[10px]">
                <Check className="w-3 h-3" />
              </span>
            ) : (
              <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/60 text-white p-1 rounded-full text-[10px] transition">
                <Copy className="w-3 h-3" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="my-6 space-y-8 font-sans">
      {/* Semantic Tokens Table (2-column comparison) */}
      <section className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-slate-100">
          Semantic Colors (Theme-aware)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Các biến màu tự động thích ứng giữa Light Mode và Dark Mode. Click vào biến để copy.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold uppercase">
                <th className="py-3 px-3">Token & Variable</th>
                <th className="py-3 px-3">Light Mode</th>
                <th className="py-3 px-3">Dark Mode</th>
                <th className="py-3 px-3">Công dụng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {SEMANTIC_COLORS.map((sc) => (
                <tr key={sc.varName} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-3 font-medium">
                    <button
                      onClick={() => handleCopy(`var(${sc.varName})`)}
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>{sc.varName}</span>
                      {copiedVar === `var(${sc.varName})` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-60" />
                      )}
                    </button>
                    <div className="text-[11px] text-slate-400">{sc.name}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-slate-300 shadow-sm"
                        style={{ backgroundColor: `var(${sc.varName})` }}
                      />
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                        {sc.lightValue}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-md border border-slate-800">
                      <div
                        className="w-6 h-6 rounded border border-slate-700 dark shadow-sm"
                        style={{ backgroundColor: `var(${sc.varName})` }}
                      />
                      <span className="text-xs font-mono text-slate-300">{sc.darkValue}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-600 dark:text-slate-300">
                    {sc.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Primitive Palettes */}
      <section className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-slate-100">
          Primitive Palettes
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Bảng màu thô cố định. Hạn chế dùng trực tiếp trong UI component, ưu tiên dùng Semantic Token.
        </p>

        {renderPrimitiveRow('Neutral (Slate-like)', PRIMITIVE_NEUTRAL)}
        {renderPrimitiveRow('Brand (Blue)', PRIMITIVE_BRAND)}
        {renderPrimitiveRow('Red (Destructive)', PRIMITIVE_RED)}
        {renderPrimitiveRow('Green (Success)', PRIMITIVE_GREEN)}
        {renderPrimitiveRow('Amber (Warning)', PRIMITIVE_AMBER)}
      </section>
    </div>
  )
}

export default ColorPalette
