'use client'

import React, { useState } from 'react'
import * as LucideIcons from 'lucide-react'

interface IconItem {
  name: string
  component: React.ComponentType<{ className?: string }>
  category: string
}

const COMMON_ICONS: IconItem[] = [
  // Navigation & Layout
  {
    name: 'LayoutDashboard',
    component: LucideIcons.LayoutDashboard,
    category: 'Navigation',
  },
  { name: 'Calendar', component: LucideIcons.Calendar, category: 'Navigation' },
  { name: 'FileText', component: LucideIcons.FileText, category: 'Navigation' },
  { name: 'Settings', component: LucideIcons.Settings, category: 'Navigation' },
  {
    name: 'ChevronRight',
    component: LucideIcons.ChevronRight,
    category: 'Navigation',
  },
  {
    name: 'ChevronDown',
    component: LucideIcons.ChevronDown,
    category: 'Navigation',
  },
  {
    name: 'ArrowRight',
    component: LucideIcons.ArrowRight,
    category: 'Navigation',
  },

  // Interview & Audio/Video
  { name: 'Video', component: LucideIcons.Video, category: 'Interview' },
  { name: 'Mic', component: LucideIcons.Mic, category: 'Interview' },
  { name: 'MicOff', component: LucideIcons.MicOff, category: 'Interview' },
  { name: 'Play', component: LucideIcons.Play, category: 'Interview' },
  { name: 'Pause', component: LucideIcons.Pause, category: 'Interview' },
  { name: 'Bot', component: LucideIcons.Bot, category: 'Interview' },
  { name: 'User', component: LucideIcons.User, category: 'Interview' },
  { name: 'Sparkles', component: LucideIcons.Sparkles, category: 'Interview' },

  // Actions & Feedback
  { name: 'Plus', component: LucideIcons.Plus, category: 'Action' },
  { name: 'Trash2', component: LucideIcons.Trash2, category: 'Action' },
  { name: 'Edit', component: LucideIcons.Edit, category: 'Action' },
  { name: 'Copy', component: LucideIcons.Copy, category: 'Action' },
  { name: 'Search', component: LucideIcons.Search, category: 'Action' },
  { name: 'Check', component: LucideIcons.Check, category: 'Feedback' },
  {
    name: 'CheckCircle',
    component: LucideIcons.CheckCircle,
    category: 'Feedback',
  },
  { name: 'XCircle', component: LucideIcons.XCircle, category: 'Feedback' },
  {
    name: 'AlertTriangle',
    component: LucideIcons.AlertTriangle,
    category: 'Feedback',
  },
  { name: 'Info', component: LucideIcons.Info, category: 'Feedback' },
  { name: 'Sun', component: LucideIcons.Sun, category: 'Theme' },
  { name: 'Moon', component: LucideIcons.Moon, category: 'Theme' },
]

export const IconGallery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedName, setCopiedName] = useState<string | null>(null)

  const filteredIcons = COMMON_ICONS.filter(
    (icon) =>
      icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCopy = (name: string) => {
    const importCode = `import { ${name} } from 'lucide-react'`
    void navigator.clipboard.writeText(importCode)
    setCopiedName(name)
    setTimeout(() => setCopiedName(null), 2000)
  }

  return (
    <div className="my-6 space-y-6 font-sans">
      {/* Search Input */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
        <LucideIcons.Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm icon (VD: Video, Search, User, Bot)..."
          className="w-full bg-transparent text-sm text-slate-900 focus:outline-none dark:text-slate-100"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filteredIcons.map((icon) => {
          const IconComp = icon.component
          const isCopied = copiedName === icon.name

          return (
            <button
              key={icon.name}
              onClick={() => handleCopy(icon.name)}
              className="group relative flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500"
            >
              <div className="mb-2 rounded-lg bg-slate-100 p-3 text-slate-700 transition group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-200 dark:group-hover:bg-blue-950 dark:group-hover:text-blue-400">
                <IconComp className="h-6 w-6" />
              </div>
              <span className="w-full truncate font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                {icon.name}
              </span>
              <span className="mt-0.5 text-[10px] text-slate-400">
                {icon.category}
              </span>

              {isCopied ? (
                <span className="absolute right-2 top-2 rounded bg-emerald-500 px-1.5 py-0.5 font-mono text-[10px] text-white">
                  Copied!
                </span>
              ) : (
                <span className="absolute right-2 top-2 text-[10px] text-slate-400 opacity-0 transition group-hover:opacity-100">
                  <LucideIcons.Copy className="h-3 w-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {filteredIcons.length === 0 && (
        <div className="py-8 text-center text-sm text-slate-400">
          Không tìm thấy icon phù hợp với &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  )
}

export default IconGallery
