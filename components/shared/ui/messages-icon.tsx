"use client"

import { MessageCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { usePopup } from "@/contexts/popup-context"

export function MessagesIcon() {
  const { user } = useAuth()
  const { showAuthPopup } = usePopup()

  const handleMessageClick = () => {
    if (user) {
      // Cambiar a la tab de mensajes usando evento personalizado (igual que las otras tabs)
      window.dispatchEvent(new CustomEvent('omnia-force-tab-change', { 
        detail: { tab: 'messages' } 
      }))
    } else {
      // Si no está autenticado, mostrar popup de login
      showAuthPopup('login')
    }
  }

  const hasNewMessages = false // To be reimplemented if needed

  return (
    <button
      onClick={handleMessageClick}
      className="p-2 text-[#FF6A1A] hover:text-[#FF8A3D] transition-colors relative"
      aria-label="Messages"
    >
      <MessageCircle size={24} />
      {/* Notificación de mensajes nuevos */}
      {hasNewMessages && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black">
          <div className="w-full h-full bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </button>
  )
}