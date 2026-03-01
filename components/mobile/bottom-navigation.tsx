"use client"

import { useAuth } from "@/contexts/auth-context"
import { usePopup } from "@/contexts/popup-context"
import { cn } from '@/lib/utils/utils'
import { Activity, CalendarDays, Flame, Search, ShoppingBag, User, Users } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

interface BottomNavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function BottomNavigation({ activeTab, setActiveTab }: BottomNavigationProps) {
  const { isAuthenticated, user } = useAuth()
  const { showAuthPopup } = usePopup()
  const [isMounted, setIsMounted] = useState(false)

  // Get user role from auth context, default to "client" if not available
  const userRole = user?.level || "client"

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const applyTabChange = useCallback((tab: string) => {
    // Si el tab ya está activo, resetear al origen de esa tab
    if (activeTab === tab) {
      // Disparar evento para resetear el estado interno del componente
      window.dispatchEvent(new CustomEvent('reset-tab-to-origin', { detail: { tab } }))
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
      return
    }

    // Al cambiar de tab, limpiar el ID de la URL para evitar persistencia cruzada
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.has('id')) {
        console.log('🔗 [BottomNavigation] Changing tab. Clearing ID from URL.')
        url.searchParams.delete('id')
        window.history.replaceState({}, '', url.toString())
      }
    }

    setActiveTab(tab)

    if (tab === "clients") {
      window.dispatchEvent(new CustomEvent('clients-tab-click'))
    }

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }, [setActiveTab, activeTab])

  const handleTabClick = (tab: string) => {
    const detail = { tab, shouldAbort: false }
    window.dispatchEvent(new CustomEvent('omnia-before-tab-change', { detail }))
    if (detail.shouldAbort) {
      return
    }

    // If user is authenticated, allow navigation to any tab
    if (isAuthenticated) {
      applyTabChange(tab)
      return
    }

    // If tab is community, allow navigation even for non-authenticated users
    if (tab === "community") {
      applyTabChange(tab)
      return
    }

    // If user is not authenticated and tab is not community, show login popup
    showAuthPopup("login")
  }

  useEffect(() => {
    const handleForceTabChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab: string }>
      applyTabChange(customEvent.detail.tab)
    }

    window.addEventListener('omnia-force-tab-change', handleForceTabChange as EventListener)
    return () => {
      window.removeEventListener('omnia-force-tab-change', handleForceTabChange as EventListener)
    }
  }, [applyTabChange])

  // Define tabs based on user role
  const renderTabs = () => {
    // Get user role from auth context, default to "client" if not available
    const userRole = user?.level || "client"

    if (userRole === "coach") {
      // Coach tabs: Clients / Products / Community / Calendar / Profile
      return (
        <>
          {/* Clients tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full transition-all duration-300 active:scale-90",
              activeTab === "clients" ? "text-[#FF7939]" : "text-white/40",
            )}
            onClick={() => handleTabClick("clients")}
          >
            <Users className={cn("h-5 w-5 mb-1 transition-transform", activeTab === "clients" && "scale-110")} />
            <span className={cn("text-[9px] font-black uppercase tracking-tighter", activeTab === "clients" ? "opacity-100" : "opacity-60")}>Clientes</span>
          </button>

          {/* Products tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full transition-all duration-300 active:scale-90",
              activeTab === "products-management" ? "text-[#FF7939]" : "text-white/40",
            )}
            onClick={() => handleTabClick("products-management")}
          >
            <ShoppingBag className={cn("h-5 w-5 mb-1 transition-transform", activeTab === "products-management" && "scale-110")} />
            <span className={cn("text-[9px] font-black uppercase tracking-tighter", activeTab === "products-management" ? "opacity-100" : "opacity-60")}>Productos</span>
          </button>

          {/* Community tab (middle) */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full transition-all duration-500",
              activeTab === "community" ? "text-[#FF7939]" : "text-white/40",
            )}
            onClick={() => handleTabClick("community")}
            aria-label="Community"
          >
            <div className="relative -top-3">
              <div className={cn(
                "bg-[#FF7939]/30 backdrop-blur-xl rounded-full p-2.5 shadow-2xl transition-all duration-500 border-4 border-white/5",
                activeTab === "community" ? "shadow-orange-500/30 scale-110 active:scale-95" : "shadow-black/20"
              )}>
                <Flame className="h-6 w-6" fill="#FF7939" stroke="#FF7939" strokeWidth={2.5} />
              </div>
            </div>
          </button>

          {/* Calendar tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full transition-all duration-300 active:scale-90",
              activeTab === "calendar" ? "text-[#FF7939]" : "text-white/40",
            )}
            onClick={() => handleTabClick("calendar")}
          >
            <CalendarDays className={cn("h-5 w-5 mb-1 transition-transform", activeTab === "calendar" && "scale-110")} />
            <span className={cn("text-[9px] font-black uppercase tracking-tighter", activeTab === "calendar" ? "opacity-100" : "opacity-60")}>Agenda</span>
          </button>

          {/* Profile tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full transition-all duration-300 active:scale-90",
              activeTab === "profile" ? "text-[#FF7939]" : "text-white/40",
            )}
            onClick={() => handleTabClick("profile")}
          >
            <User className={cn("h-5 w-5 mb-1 transition-transform", activeTab === "profile" && "scale-110")} />
            <span className={cn("text-[9px] font-black uppercase tracking-tighter", activeTab === "profile" ? "opacity-100" : "opacity-60")}>Perfil</span>
          </button>
        </>
      )
    } else {
      // Client tabs: Search / Activity / Community / Calendar / Profile
      return (
        <>
          {/* Search tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full transition-all duration-300 active:scale-90",
              activeTab === "search" ? "text-blue-400" : "text-white/40",
            )}
            onClick={() => handleTabClick("search")}
          >
            <Search className={cn("h-5 w-5 mb-1 transition-transform", activeTab === "search" && "scale-110")} />
            <span className={cn("text-[8px] font-black uppercase tracking-tighter", activeTab === "search" ? "opacity-100" : "opacity-60")}>Explorar</span>
          </button>

          {/* Activity tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full transition-all duration-300 active:scale-90",
              activeTab === "activity" ? "text-[#FF7939]" : "text-white/40",
            )}
            onClick={() => handleTabClick("activity")}
          >
            <Activity className={cn("h-5 w-5 mb-1 transition-transform", activeTab === "activity" && "scale-110")} />
            <span className={cn("text-[8px] font-black uppercase tracking-tighter", activeTab === "activity" ? "opacity-100" : "opacity-60")}>Actividades</span>
          </button>

          {/* Community tab (middle) */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full transition-all duration-500",
              activeTab === "community" ? "text-[#FF7939]" : "text-white/40",
            )}
            onClick={() => handleTabClick("community")}
            aria-label="Community"
          >
            <div className="relative -top-3">
              <div className={cn(
                "bg-[#FF7939]/30 backdrop-blur-xl rounded-full p-2.5 shadow-2xl transition-all duration-500 border-4 border-white/5",
                activeTab === "community" ? "shadow-orange-500/30 scale-110 active:scale-95" : "shadow-black/20"
              )}>
                <Flame className="h-6 w-6" fill="#FF7939" stroke="#FF7939" strokeWidth={2.5} />
              </div>
            </div>
          </button>

          {/* Calendar tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full transition-all duration-300 active:scale-90",
              activeTab === "calendar" ? "text-[#FF7939]" : "text-white/40",
            )}
            onClick={() => handleTabClick("calendar")}
          >
            <CalendarDays className={cn("h-5 w-5 mb-1 transition-transform", activeTab === "calendar" && "scale-110")} />
            <span className={cn("text-[8px] font-black uppercase tracking-tighter", activeTab === "calendar" ? "opacity-100" : "opacity-60")}>Agenda</span>
          </button>

          {/* Profile tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full transition-all duration-300 active:scale-90",
              activeTab === "profile" ? "text-[#FF7939]" : "text-white/40",
            )}
            onClick={() => handleTabClick("profile")}
          >
            <User className={cn("h-5 w-5 mb-1 transition-transform", activeTab === "profile" && "scale-110")} />
            <span className={cn("text-[8px] font-black uppercase tracking-tighter", activeTab === "profile" ? "opacity-100" : "opacity-60")}>Perfil</span>
          </button>
        </>
      )
    }
  }

  // Don't render until component is mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-[#1E1E1E] border-t border-gray-800 h-16 flex items-center justify-around">
        {/* Placeholder for hydration */}
        <div className="flex flex-col items-center justify-center w-1/5 h-full text-gray-400">
          <div className="h-5 w-5 mb-1"></div>
          <span className="text-xs">Loading...</span>
        </div>
        <div className="flex flex-col items-center justify-center w-1/5 h-full text-gray-400">
          <div className="h-5 w-5 mb-1"></div>
          <span className="text-xs">Loading...</span>
        </div>
        <div className="flex flex-col items-center justify-center w-1/5 h-full text-gray-400">
          <div className="h-5 w-5 mb-1"></div>
          <span className="text-xs">Loading...</span>
        </div>
        <div className="flex flex-col items-center justify-center w-1/5 h-full text-gray-400">
          <div className="h-5 w-5 mb-1"></div>
          <span className="text-xs">Loading...</span>
        </div>
        <div className="flex flex-col items-center justify-center w-1/5 h-full text-gray-400">
          <div className="h-5 w-5 mb-1"></div>
          <span className="text-xs">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-black/60 backdrop-blur-2xl border-t border-white/10 h-16 flex items-center justify-around shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
      {renderTabs()}
    </div>
  )
}
