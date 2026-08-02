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
  { name: 'LayoutDashboard', component: LucideIcons.LayoutDashboard, category: 'Navigation' },
  { name: 'Calendar', component: LucideIcons.Calendar, category: 'Navigation' },
  { name: 'FileText', component: LucideIcons.FileText, category: 'Navigation' },
  { name: 'Settings', component: LucideIcons.Settings, category: 'Navigation' },
  { name: 'ChevronRight', component: LucideIcons.ChevronRight, category: 'Navigation' },
  { name: 'ChevronDown', component: LucideIcons.ChevronDown, category: 'Navigation' },
  { name: 'ArrowRight', component: LucideIcons.ArrowRight, category: 'Navigation' },

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
  { name: 'CheckCircle', component: LucideIcons.CheckCircle, category: 'Feedback' },
  { name: 'XCircle', component: LucideIcons.XCircle, category: 'Feedback' },
  { name: 'AlertTriangle', component: LucideIcons.AlertTriangle, category: 'Feedback' },
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
    navigator.clipboard.writeText(importCode)
    setCopiedName(name)
    setTimeout(() => setCopiedName(null), 2000)
  }

  return (
    <div className="my-6 space-y-6 font-sans">
      {/* Search Input */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <LucideIcons.Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm icon (VD: Video, Search, User, Bot)..."
          className="w-full text-sm bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredIcons.map((icon) => {
          const IconComp = icon.component
          const isCopied = copiedName === icon.name

          return (
            <button
              key={icon.name}
              onClick={() => handleCopy(icon.name)}
              className="group relative flex flex-col items-center p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-900 transition hover:shadow-md text-center"
            >
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition mb-2">
                <IconComp className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate w-full">
                {icon.name}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">{icon.category}</span>

              {isCopied ? (
                <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                  Copied!
                </span>
              ) : (
                <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 transition">
                  <LucideIcons.Copy className="w-3 h-3" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {filteredIcons.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">
          Không tìm thấy icon phù hợp với &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  )
}

export default IconGallery
