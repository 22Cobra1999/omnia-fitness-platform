"use client"

import { useState, useRef, useEffect } from "react"
import { Settings, User, CreditCard, Palette, HelpCircle, LogIn, ChevronRight, BarChart3 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { usePopup } from "@/contexts/popup-context"
import { LogoutButton } from "../auth/logout-button"
import { useRouter } from "next/navigation"

export function SettingsIcon() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated } = useAuth()
  const { showAuthPopup } = usePopup()
  const router = useRouter()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLoginClick = () => {
    setIsOpen(false)
    showAuthPopup("login")
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[#FF7939] hover:text-[#E86A2D] transition-colors"
        aria-label="Settings"
      >
        <Settings size={24} />
      </button>

      {isOpen && (
        <div className="absolute top-12 left-0 w-56 bg-[#1E1E1E] text-white rounded-lg shadow-lg overflow-hidden border border-[#333333]">
          {/* Account Info Section - Only show when logged in */}
          {isAuthenticated && user && (
            <div className="p-3 bg-[#252525] border-b border-[#333333]">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-[#FF7939] flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-sm">{user.name || "Usuario"}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </div>
              </div>
              <span className="inline-block px-2 py-0.5 text-xs rounded-md bg-[#FF7939] text-white">
                {user.level || "Cliente"}
              </span>
            </div>
          )}

          {/* Minimalist Menu Sections */}
          <div>
            <div className="flex items-center p-3 hover:bg-[#2A2A2A] cursor-pointer border-b border-[#333333]">
              <User className="h-4 w-4 text-[#FF7939] mr-3" />
              <span className="text-sm">Cuenta</span>
            </div>

            <div className="flex items-center p-3 hover:bg-[#2A2A2A] cursor-pointer border-b border-[#333333]">
              <CreditCard className="h-4 w-4 text-[#FF7939] mr-3" />
              <span className="text-sm">Suscripciones</span>
            </div>

            <div className="flex items-center p-3 hover:bg-[#2A2A2A] cursor-pointer border-b border-[#333333]">
              <Palette className="h-4 w-4 text-[#FF7939] mr-3" />
              <span className="text-sm">Personalización</span>
            </div>

            <div className="flex items-center p-3 hover:bg-[#2A2A2A] cursor-pointer">
              <HelpCircle className="h-4 w-4 text-[#FF7939] mr-3" />
              <span className="text-sm">Ayuda</span>
            </div>
          </div>

          {/* Login/Logout Button */}
          <div className="p-3 border-t border-[#333333]">
            {isAuthenticated ? (
              <LogoutButton
                variant="destructive"
                onSuccess={() => setIsOpen(false)}
                className="w-full flex items-center justify-center text-sm py-2"
              />
            ) : (
              <button
                onClick={handleLoginClick}
                className="w-full py-2 bg-[#FF7939] text-white rounded hover:bg-[#E86A2D] transition-colors flex items-center justify-center text-sm"
              >
                <LogIn className="h-4 w-4 mr-2" />
                <span>Iniciar sesión</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
