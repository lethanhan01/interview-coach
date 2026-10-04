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

const PRIMITIVE_VIOLET: PrimitiveColor[] = [
  { name: 'violet-50', varName: '--color-violet-50', hex: '#f5f3ff' },
  { name: 'violet-100', varName: '--color-violet-100', hex: '#ede9fe' },
  { name: 'violet-200', varName: '--color-violet-200', hex: '#ddd6fe' },
  { name: 'violet-300', varName: '--color-violet-300', hex: '#c4b5fd' },
  { name: 'violet-400', varName: '--color-violet-400', hex: '#a78bfa' },
  { name: 'violet-500', varName: '--color-violet-500', hex: '#8b5cf6' },
  { name: 'violet-600', varName: '--color-violet-600', hex: '#7c3aed' },
  { name: 'violet-700', varName: '--color-violet-700', hex: '#6d28d9' },
  { name: 'violet-800', varName: '--color-violet-800', hex: '#5b21b6' },
  { name: 'violet-900', varName: '--color-violet-900', hex: '#4c1d95' },
  { name: 'violet-950', varName: '--color-violet-950', hex: '#2e1065' },
]

const PRIMITIVE_CYAN: PrimitiveColor[] = [
  { name: 'cyan-50', varName: '--color-cyan-50', hex: '#ecfeff' },
  { name: 'cyan-100', varName: '--color-cyan-100', hex: '#cffafe' },
  { name: 'cyan-200', varName: '--color-cyan-200', hex: '#a5f3fc' },
  { name: 'cyan-300', varName: '--color-cyan-300', hex: '#67e8f9' },
  { name: 'cyan-400', varName: '--color-cyan-400', hex: '#22d3ee' },
  { name: 'cyan-500', varName: '--color-cyan-500', hex: '#06b6d4' },
  { name: 'cyan-600', varName: '--color-cyan-600', hex: '#0891b2' },
  { name: 'cyan-700', varName: '--color-cyan-700', hex: '#0e7490' },
  { name: 'cyan-800', varName: '--color-cyan-800', hex: '#155e75' },
  { name: 'cyan-900', varName: '--color-cyan-900', hex: '#164e63' },
  { name: 'cyan-950', varName: '--color-cyan-950', hex: '#083344' },
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

const PRIMITIVE_CHARTS: PrimitiveColor[] = [
  { name: 'chart-1 (Brand)', varName: '--color-chart-1', hex: '#2563eb' },
  { name: 'chart-2 (AI Violet)', varName: '--color-chart-2', hex: '#7c3aed' },
  { name: 'chart-3 (Telemetry Cyan)', varName: '--color-chart-3', hex: '#0891b2' },
  { name: 'chart-4 (Success)', varName: '--color-chart-4', hex: '#16a34a' },
  { name: 'chart-5 (Warning)', varName: '--color-chart-5', hex: '#f59e0b' },
  { name: 'chart-6 (Danger)', varName: '--color-chart-6', hex: '#ef4444' },
]

const PRIMITIVE_TIERS: PrimitiveColor[] = [
  { name: 'tier-bronze', varName: '--color-tier-bronze', hex: '#cd7f32' },
  { name: 'tier-silver', varName: '--color-tier-silver', hex: '#94a3b8' },
  { name: 'tier-gold', varName: '--color-tier-gold', hex: '#f59e0b' },
  { name: 'tier-diamond', varName: '--color-tier-diamond', hex: '#06b6d4' },
]

const SEMANTIC_COLORS: SemanticColor[] = [
  {
    name: 'Canvas Surface (Surface-0)',
    varName: '--color-surface-0',
    lightValue: 'neutral-50 (#f8fafc)',
    darkValue: '#030712 (Deep black)',
    description: 'Nền canvas chính của toàn bộ trang web.',
  },
  {
    name: 'Container Surface (Surface-1)',
    varName: '--color-surface-1',
    lightValue: '#ffffff',
    darkValue: 'neutral-900 (#0f172a)',
    description: 'Nền của card, section, panel thông tin.',
  },
  {
    name: 'Floating Surface (Surface-2)',
    varName: '--color-surface-2',
    lightValue: '#ffffff',
    darkValue: 'neutral-800 (#1e293b)',
    description: 'Nền của dropdown menu, popover, tooltip nổi.',
  },
  {
    name: 'Overlay Surface (Surface-3)',
    varName: '--color-surface-3',
    lightValue: '#ffffff',
    darkValue: 'neutral-700 (#334155)',
    description: 'Nền của dialog, modal, drawer tầng cao nhất.',
  },
  {
    name: 'Primary Brand',
    varName: '--color-primary',
    lightValue: 'brand-600 (#2563eb)',
    darkValue: 'brand-500 (#3b82f6)',
    description: 'Màu thương hiệu chủ đạo cho nút nhấn, link chính, active state.',
  },
  {
    name: 'AI Insights & Coach',
    varName: '--color-ai',
    lightValue: 'violet-600 (#7c3aed)',
    darkValue: 'violet-500 (#8b5cf6)',
    description: 'Màu nhận diện tính năng AI chấm điểm, nhận xét phỏng vấn.',
  },
  {
    name: 'Waveform Telemetry',
    varName: '--color-waveform',
    lightValue: 'cyan-600 (#0891b2)',
    darkValue: 'cyan-400 (#22d3ee)',
    description: 'Màu thanh âm thanh và đo lường giọng nói thời gian thực.',
  },
  {
    name: 'Secondary',
    varName: '--color-secondary',
    lightValue: 'neutral-100 (#f1f5f9)',
    darkValue: 'neutral-800 (#1e293b)',
    description: 'Hành động phụ hoặc phần tử có độ ưu tiên thấp hơn.',
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
    description: 'Trạng thái thành công, hoàn thành, đỗ phỏng vấn.',
  },
  {
    name: 'Warning',
    varName: '--color-warning',
    lightValue: 'amber-500 (#f59e0b)',
    darkValue: 'amber-500 (#f59e0b)',
    description: 'Cảnh báo, nhắc nhở cần chú ý.',
  },
  {
    name: 'Border / Specular',
    varName: '--color-border',
    lightValue: 'neutral-200 (#e2e8f0)',
    darkValue: 'neutral-800 (#1e293b)',
    description: 'Đường viền của card, input, divider kết hợp viền specular phản quang.',
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
            className="group relative flex flex-col items-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-md transition bg-white dark:bg-slate-900 text-left cursor-pointer"
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
      {/* Semantic Tokens Table */}
      <section className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-slate-100">
          Semantic Colors (Theme-aware Multi-layer)
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Hệ thống màu ngữ nghĩa đa tầng (Surface 0-3, Brand, AI, Waveform) tự động thích ứng Light/Dark Mode. Click để copy biến CSS.
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
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
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
          Bảng màu thô cố định cho hệ thống (Neutral, Brand, Violet AI, Cyan Audio, Charts, Mastery Tiers).
        </p>

        {renderPrimitiveRow('Neutral (Slate-like)', PRIMITIVE_NEUTRAL)}
        {renderPrimitiveRow('Brand (Blue)', PRIMITIVE_BRAND)}
        {renderPrimitiveRow('Violet (AI & Insights)', PRIMITIVE_VIOLET)}
        {renderPrimitiveRow('Cyan (Audio & Waveform)', PRIMITIVE_CYAN)}
        {renderPrimitiveRow('Categorical Charts (Data Viz)', PRIMITIVE_CHARTS)}
        {renderPrimitiveRow('Score & Mastery Tiers', PRIMITIVE_TIERS)}
        {renderPrimitiveRow('Red (Destructive)', PRIMITIVE_RED)}
        {renderPrimitiveRow('Green (Success)', PRIMITIVE_GREEN)}
        {renderPrimitiveRow('Amber (Warning)', PRIMITIVE_AMBER)}
      </section>
    </div>
  )
}

export default ColorPalette
