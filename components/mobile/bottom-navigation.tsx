"use client"

import { useAuth } from "@/contexts/auth-context"
import { usePopup } from "@/contexts/popup-context"
import { cn } from "@/lib/utils"
import { Activity, CalendarDays, Flame, Search, ShoppingBag, User, Users } from "lucide-react"
import { useEffect, useState } from "react"

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

  const handleTabClick = (tab: string) => {
    // If user is authenticated, allow navigation to any tab
    if (isAuthenticated) {
      setActiveTab(tab)
      
      // Emitir evento especial para clients tab
      if (tab === "clients") {
        window.dispatchEvent(new CustomEvent('clients-tab-click'))
      }
      
      // Scroll hacia arriba cuando se cambia de tab
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
      return
    }

    // If tab is community, allow navigation even for non-authenticated users
    if (tab === "community") {
      setActiveTab(tab)
      // Scroll hacia arriba cuando se cambia de tab
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
      return
    }

    // If user is not authenticated and tab is not community, show login popup
    showAuthPopup("login")
  }

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
              "flex flex-col items-center justify-center w-1/5 h-full",
              activeTab === "clients" ? "text-[#FF7939]" : "text-gray-400",
            )}
            onClick={() => handleTabClick("clients")}
          >
            <Users className="h-5 w-5 mb-1" />
            <span className="text-xs">Clients</span>
          </button>

          {/* Products tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full",
              activeTab === "products-management" ? "text-[#FF7939]" : "text-gray-400",
            )}
            onClick={() => handleTabClick("products-management")}
          >
            <ShoppingBag className="h-5 w-5 mb-1" />
            <span className="text-xs">Products</span>
          </button>

          {/* Community tab (middle) */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full",
              activeTab === "community" ? "text-[#FF7939]" : "text-gray-400",
            )}
            onClick={() => handleTabClick("community")}
          >
            <div className="relative -top-5">
              <div className="bg-[#FF7939] rounded-full p-3 shadow-lg">
                <Flame className="h-6 w-6 text-white" />
              </div>
            </div>
          </button>

          {/* Calendar tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full",
              activeTab === "calendar" ? "text-[#FF7939]" : "text-gray-400",
            )}
            onClick={() => handleTabClick("calendar")}
          >
            <CalendarDays className="h-5 w-5 mb-1" />
            <span className="text-xs">Calendar</span>
          </button>

          {/* Profile tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full",
              activeTab === "profile" ? "text-[#FF7939]" : "text-gray-400",
            )}
            onClick={() => handleTabClick("profile")}
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profile</span>
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
              "flex flex-col items-center justify-center w-1/5 h-full",
              activeTab === "search" ? "text-[#FF7939]" : "text-gray-400",
            )}
            onClick={() => handleTabClick("search")}
          >
            <Search className="h-5 w-5 mb-1" />
            <span className="text-xs">Search</span>
          </button>

          {/* Activity tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full",
              activeTab === "activity" ? "text-[#FF7939]" : "text-gray-400",
            )}
            onClick={() => handleTabClick("activity")}
          >
            <Activity className="h-5 w-5 mb-1" />
            <span className="text-xs">Activity</span>
          </button>

          {/* Community tab (middle) */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full",
              activeTab === "community" ? "text-[#FF7939]" : "text-gray-400",
            )}
            onClick={() => handleTabClick("community")}
          >
            <div className="relative -top-5">
              <div className="bg-[#FF7939] rounded-full p-3 shadow-lg">
                <Flame className="h-6 w-6 text-white" />
              </div>
            </div>
          </button>

          {/* Calendar tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full",
              activeTab === "calendar" ? "text-[#FF7939]" : "text-gray-400",
            )}
            onClick={() => handleTabClick("calendar")}
          >
            <CalendarDays className="h-5 w-5 mb-1" />
            <span className="text-xs">Calendar</span>
          </button>

          {/* Profile tab */}
          <button
            className={cn(
              "flex flex-col items-center justify-center w-1/5 h-full",
              activeTab === "profile" ? "text-[#FF7939]" : "text-gray-400",
            )}
            onClick={() => handleTabClick("profile")}
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs">Profile</span>
          </button>
        </>
      )
    }
  }

  // Don't render until component is mounted to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-gray-800 h-16 flex items-center justify-around">
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
    <div className="fixed bottom-0 left-0 right-0 bg-[#1E1E1E] border-t border-gray-800 h-16 flex items-center justify-around">
      {renderTabs()}
    </div>
  )
}
