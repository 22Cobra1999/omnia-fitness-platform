"use client"

import type React from "react"

import { useCallback, useTransition } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useTabController } from '@/hooks/shared/use-tab-controller'
import { RefreshCw, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Button } from "@/components/ui/button"

interface OptimizedTabsProps<T> {
  tabs: Array<{
    id: string
    label: string
    fetchFunction: () => Promise<T>
    cacheTime?: number
    preload?: boolean
  }>
  renderContent: (data: T | null, isLoading: boolean, error: Error | null) => React.ReactNode
  storageKey?: string
  defaultTab?: string
  showLastUpdated?: boolean
  showRefreshButton?: boolean
  className?: string
}

export function OptimizedTabs<T>({
  tabs,
  renderContent,
  storageKey = "optimized_tabs",
  defaultTab,
  showLastUpdated = true,
  showRefreshButton = true,
  className = "",
}: OptimizedTabsProps<T>) {
  // Usar el hook de control de tabs
  const { activeTab, changeTab, refreshTab, activeTabData, tabsData } = useTabController<T>(tabs, {
    storageKey,
    persistToStorage: true,
    rememberActiveTab: true,
    defaultActiveTab: defaultTab || tabs[0]?.id,
  })

  // Estado para la transición de UI
  const [isPending, startTransition] = useTransition()

  // Manejar el cambio de tab
  const handleTabChange = useCallback(
    (value: string) => {
      startTransition(() => {
        changeTab(value)
      })
    },
    [changeTab],
  )

  // Manejar la actualización de datos
  const handleRefresh = useCallback(() => {
    refreshTab(activeTab)
  }, [refreshTab, activeTab])

  // Formatear la fecha de última actualización
  const formatLastUpdated = useCallback((timestamp: number) => {
    if (!timestamp) return "Nunca"
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: es,
    })
  }, [])

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            {tabsData.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} disabled={isPending} className="relative">
                {tab.label}
                {tab.isLoading && (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {showRefreshButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={activeTabData.isLoading}
              className="flex items-center gap-1 text-xs"
            >
              <RefreshCw className={`h-3 w-3 ${activeTabData.isLoading ? "animate-spin" : ""}`} />
              <span>Actualizar</span>
            </Button>
          )}
        </div>

        {showLastUpdated && activeTabData.lastUpdated > 0 && (
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <Clock className="h-3 w-3 mr-1" />
            <span>
              Actualizado: {formatLastUpdated(activeTabData.lastUpdated)}
              {activeTabData.isCached && " (en caché)"}
            </span>
          </div>
        )}

        {tabsData.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0">
            {renderContent(tab.data, tab.isLoading, tab.error)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

// Componente de esqueleto para usar durante la carga
export function TabContentSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}
