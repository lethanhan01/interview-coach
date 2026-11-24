'use client'

import React, { Suspense, useState } from 'react'
import { Compass, BarChart3, BookOpen, AlertTriangle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/AlertDialog'
import { LoadingState } from '@/components/common/FeedbackPatterns'
import {
  useOnetParams,
  OnetSidebar,
  OnetMobileDrawer,
  OnetDetailShell,
  OnetAnalyticsView,
} from '@/components/onet'
import type { OnetDetailSubTab, OnetMainTab } from '@/types'

function OnetBrowserWorkspace() {
  const {
    activeTab,
    selectedSoc,
    activeDetailTab,
    setTab,
    setSoc,
    setDetailTab,
  } = useOnetParams()

  const [currentTitle, setCurrentTitle] = useState<string>(
    'Software Developers'
  )
  const [isSfiaDirty, setIsSfiaDirty] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<
    (() => void) | null
  >(null)
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0)

  // Browser beforeunload safety guard
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSfiaDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isSfiaDirty])

  const guardedSetSoc = (newSoc: string) => {
    if (isSfiaDirty && newSoc !== selectedSoc) {
      setPendingNavigation(() => () => setSoc(newSoc))
      return
    }
    setSoc(newSoc)
  }

  const guardedSetTab = (newTab: OnetMainTab) => {
    if (isSfiaDirty && newTab !== activeTab) {
      setPendingNavigation(() => () => setTab(newTab))
      return
    }
    setTab(newTab)
  }

  const guardedSetDetailTab = (newDetailTab: OnetDetailSubTab) => {
    if (isSfiaDirty && newDetailTab !== activeDetailTab) {
      setPendingNavigation(() => () => setDetailTab(newDetailTab))
      return
    }
    setDetailTab(newDetailTab)
  }

  const handleMappingsUpdated = () => {
    setSidebarRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-2">
      {/* Top Header Bar (Flat Header) */}
      <div className="border-border/60 flex shrink-0 flex-col gap-2 border-b pb-1.5 pt-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand/10 text-brand flex size-8 shrink-0 items-center justify-center rounded-lg">
            <BookOpen className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-ink text-base font-bold tracking-tight sm:text-lg">
                O*NET Knowledge Browser
              </h1>
              <span className="bg-brand/10 text-brand rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                Admin
              </span>
            </div>
            <p className="text-ink-muted mt-0.5 text-xs leading-none">
              Chuẩn phân loại nghề nghiệp Hoa Kỳ (O*NET 29.1) & Ánh xạ khung kỹ
              năng SFIA 9
            </p>
          </div>
        </div>

        {/* Top-Level Mode Switcher: Explorer vs Analytics */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => guardedSetTab(val as OnetMainTab)}
          className="shrink-0"
        >
          <TabsList className="bg-surface-inset h-9 p-1">
            <TabsTrigger
              value="explorer"
              className="gap-1.5 px-3 py-1 text-xs font-semibold"
            >
              <Compass className="size-3.5" />
              <span>Khám phá & Quản lý</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="gap-1.5 px-3 py-1 text-xs font-semibold"
            >
              <BarChart3 className="size-3.5" />
              <span>Thống kê & Phân tích</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mode 1: Explorer View */}
      {activeTab === 'explorer' && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
          {/* Mobile Drawer trigger bar (<1024px) */}
          <OnetMobileDrawer
            selectedSoc={selectedSoc}
            selectedTitle={currentTitle}
            onSelectSoc={guardedSetSoc}
          />

          {/* 2-Column Master-Detail Layout */}
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
            {/* Column 1: Desktop Master Sidebar (≥1024px) */}
            <aside className="border-border/70 bg-card hidden w-[340px] shrink-0 overflow-hidden rounded-xl border shadow-sm lg:block">
              <OnetSidebar
                selectedSoc={selectedSoc}
                onSelectSoc={guardedSetSoc}
                refreshTrigger={sidebarRefreshKey}
              />
            </aside>

            {/* Column 2: Detail Panel Shell */}
            <main className="border-border/70 bg-card min-w-0 flex-1 overflow-hidden rounded-xl border shadow-sm">
              <OnetDetailShell
                socCode={selectedSoc}
                activeDetailTab={activeDetailTab}
                onSelectDetailTab={guardedSetDetailTab}
                onLoadedDetail={(d) => setCurrentTitle(d.title)}
                onUpdateMappings={handleMappingsUpdated}
                onDirtyChange={setIsSfiaDirty}
              />
            </main>
          </div>
        </div>
      )}

      {/* Mode 2: Analytics View */}
      {activeTab === 'analytics' && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <OnetAnalyticsView
            onSwitchToExplorer={() => guardedSetTab('explorer')}
            onSelectOccupation={(socCode, subTab = 'overview') => {
              guardedSetSoc(socCode)
              guardedSetDetailTab(subTab)
              guardedSetTab('explorer')
            }}
          />
        </div>
      )}

      {/* Global Unsaved Navigation Guard Modal */}
      <AlertDialog
        open={pendingNavigation !== null}
        onOpenChange={(open) => {
          if (!open) setPendingNavigation(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <AlertTriangle className="size-5" />
            </div>
            <AlertDialogTitle className="text-ink text-base">
              Thay đổi chưa được lưu
            </AlertDialogTitle>
            <AlertDialogDescription className="text-ink-muted text-xs leading-relaxed">
              Bạn đang có các thay đổi chưa được lưu trên bảng ánh xạ SFIA. Nếu
              rời đi bây giờ, toàn bộ chỉnh sửa này sẽ bị mất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setPendingNavigation(null)}
              className="text-xs"
            >
              Ở lại trang
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsSfiaDirty(false)
                const action = pendingNavigation
                setPendingNavigation(null)
                action?.()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            >
              Rời đi không lưu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function OnetAdminPage() {
  return (
    <Suspense
      fallback={
        <LoadingState
          text="Đang khởi tạo O*NET Knowledge Browser..."
          minHeight="min-h-[60vh]"
        />
      }
    >
      <OnetBrowserWorkspace />
    </Suspense>
  )
}
