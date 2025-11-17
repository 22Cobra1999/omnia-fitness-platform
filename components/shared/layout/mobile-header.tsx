"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Settings, User, HelpCircle, Info, Home, BarChart3 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { LogoutButton } from "../auth/logout-button"
import { OmniaLogoText } from "../ui/omnia-logo"

export function MobileHeader() {
  const router = useRouter()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, user, showAuthPopup } = useAuth()

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle login
  const handleLogin = () => {
    showAuthPopup("login")
    setIsSettingsOpen(false)
  }

  // Navigate to home without affecting auth state
  const goToHome = () => {
    router.push("/")
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-black rounded-b-[32px] px-6 py-20 flex justify-between items-center">
        {/* Settings Button and Menu */}
        <div ref={settingsRef} className="relative">
          <button
            onClick={() => {
              setIsSettingsOpen(!isSettingsOpen)
              setIsNotificationsOpen(false)
            }}
            className="absolute -top-6 -right-4 p-1.5 transition-opacity hover:opacity-80"
            aria-label="Settings"
          >
            <Settings size={20} color="#ffffff" />
          </button>

          {isSettingsOpen && (
            <div className="absolute top-12 left-0 w-60 bg-black/90 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-gray-800 z-50 transition-all duration-200 ease-in-out">
              {isAuthenticated ? (
                <div className="divide-y divide-gray-800/50">
                  {/* User info section */}
                  <div className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF7939] to-[#FF5B5B] flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{user?.name || "User"}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email || ""}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-[#FF7939]/20 text-[#FF7939] capitalize">
                        {user?.level || "User"}
                      </span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        router.push("/")
                        setIsSettingsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      <Home size={16} className="mr-3 text-gray-400" />
                      Home
                    </button>
                    <button
                      onClick={() => {
                        router.push("/settings")
                        setIsSettingsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      <User size={16} className="mr-3 text-gray-400" />
                      Account
                    </button>
                    <button
                      onClick={() => {
                        router.push("/help")
                        setIsSettingsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      <HelpCircle size={16} className="mr-3 text-gray-400" />
                      Help
                    </button>
                    {/* Debug Usage - Solo en desarrollo */}
                    <button
                      onClick={() => {
                        router.push("/debug/usage")
                        setIsSettingsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      <BarChart3 size={16} className="mr-3 text-gray-400" />
                      Debug Usage
                    </button>
                  </div>

                  {/* Logout section */}
                  <div className="py-2 px-4">
                    <LogoutButton
                      variant="destructive"
                      size="sm"
                      onSuccess={() => setIsSettingsOpen(false)}
                      className="w-full flex items-center justify-center"
                    />
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-800/50">
                  {/* Menu items for logged out users */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        router.push("/")
                        setIsSettingsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      <Home size={16} className="mr-3 text-gray-400" />
                      Home
                    </button>
                    <button
                      onClick={() => {
                        router.push("/about")
                        setIsSettingsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      <Info size={16} className="mr-3 text-gray-400" />
                      About
                    </button>
                    <button
                      onClick={() => {
                        router.push("/help")
                        setIsSettingsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      <HelpCircle size={16} className="mr-3 text-gray-400" />
                      Help
                    </button>
                    {/* Debug Usage - Solo en desarrollo */}
                    <button
                      onClick={() => {
                        router.push("/debug/usage")
                        setIsSettingsOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                      <BarChart3 size={16} className="mr-3 text-gray-400" />
                      Debug Usage
                    </button>
                  </div>

                  {/* Login section */}
                  <div className="py-2 px-4">
                    <button
                      onClick={handleLogin}
                      className="flex items-center justify-center w-full py-2 text-sm text-white bg-[#FF7939] hover:bg-[#FF7939]/90 rounded-lg transition-colors"
                    >
                      Log in
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* OMNIA Logo */}
        <button
          onClick={goToHome}
          className="focus:outline-none hover:opacity-80 transition-opacity"
        >
          <OmniaLogoText size="text-6xl" />
        </button>

        {/* Notifications Button and Menu */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen)
              setIsSettingsOpen(false)
            }}
            className="p-1.5 relative transition-opacity hover:opacity-80 -mt-1"
            aria-label="Notifications"
          >
            <Bell size={20} color="#ffffff" />
            {/* Notification Dot */}
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF7939] rounded-full"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute top-12 right-0 w-64 bg-black/90 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-gray-800 z-50 transition-all duration-200 ease-in-out">
              <div className="p-3">
                <h3 className="text-sm font-semibold text-white mb-2">Notifications</h3>
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <div className="p-2 border-b border-gray-800/50 text-sm">
                      <p className="text-white">Welcome to OMNIA!</p>
                      <p className="text-gray-400 text-xs mt-1">Just now</p>
                    </div>
                    <div className="p-2 border-b border-gray-800/50 text-sm">
                      <p className="text-white">Complete your profile to get started.</p>
                      <p className="text-gray-400 text-xs mt-1">5 minutes ago</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Sign in to see your notifications</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
