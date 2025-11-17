"use client"

import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"
// Hook removed - functionality to be reimplemented if needed
// import { useMessages } from '@/hooks/shared/use-messages'
import { useAuth } from "@/contexts/auth-context"

export function MessagesIcon() {
  const router = useRouter()
  const { user } = useAuth()
  // Hook removed - using default behavior
  // const { getTotalUnreadCount } = useMessages()

  const handleMessageClick = () => {
    if (user) {
      // Navegar a la página completa de mensajes
      router.push('/messages')
    } else {
      // Si no está autenticado, podría mostrar un popup de login
      console.log('Usuario no autenticado')
    }
  }

  const hasNewMessages = false // To be reimplemented if needed

  return (
    <button
      onClick={handleMessageClick}
      className="p-2 text-[#FF7939] hover:text-[#E86A2D] transition-colors relative"
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