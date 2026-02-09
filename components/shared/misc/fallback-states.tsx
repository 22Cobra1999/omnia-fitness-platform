"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw, Users, ShoppingCart, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FallbackStateProps {
  type: 'error' | 'empty' | 'loading' | 'offline'
  title?: string
  message?: string
  onRetry?: () => void
  showRetry?: boolean
}

export function FallbackState({
  type,
  title,
  message,
  onRetry,
  showRetry = true
}: FallbackStateProps) {
  const getContent = () => {
    switch (type) {
      case 'error':
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          title: title || "¡Ups! Algo salió mal",
          message: message || "Hubo un problema al cargar los datos. Por favor, inténtalo de nuevo.",
          bgColor: "bg-red-500/10",
          iconBg: "bg-red-500/20"
        }
      case 'empty':
        return {
          icon: <Users className="h-12 w-12 text-gray-400" />,
          title: title || "No hay contenido disponible",
          message: message || "No se encontraron elementos para mostrar en este momento.",
          bgColor: "bg-gray-500/10",
          iconBg: "bg-gray-500/20"
        }
      case 'loading':
        return {
          icon: (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-12 w-12 text-[#FF7939]" />
            </motion.div>
          ),
          title: title || "Cargando...",
          message: message || "Por favor espera mientras cargamos el contenido.",
          bgColor: "bg-orange-500/10",
          iconBg: "bg-orange-500/20"
        }
      case 'offline':
        return {
          icon: <WifiOff className="h-12 w-12 text-yellow-500" />,
          title: title || "Sin conexión",
          message: message || "Parece que no tienes conexión a internet. Verifica tu conexión.",
          bgColor: "bg-yellow-500/10",
          iconBg: "bg-yellow-500/20"
        }
      default:
        return {
          icon: <AlertCircle className="h-12 w-12 text-gray-400" />,
          title: title || "Estado desconocido",
          message: message || "Algo inesperado ocurrió.",
          bgColor: "bg-gray-500/10",
          iconBg: "bg-gray-500/20"
        }
    }
  }

  const content = getContent()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className={`w-24 h-24 rounded-full ${content.iconBg} flex items-center justify-center mb-6`}>
        {content.icon}
      </div>

      <h3 className="text-xl font-semibold text-white mb-3 text-center">
        {content.title}
      </h3>

      <p className="text-gray-400 text-center mb-6 max-w-md leading-relaxed">
        {content.message}
      </p>

      {showRetry && onRetry && type !== 'loading' && (
        <Button
          onClick={onRetry}
          className="bg-[#FF7939] hover:bg-[#FF6B00] text-white font-semibold px-6 py-2 rounded-xl transition-all duration-200 hover:scale-105 flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Intentar de nuevo</span>
        </Button>
      )}
    </motion.div>
  )
}

// Componente específico para cuando no hay coaches
export function NoCoachesFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <FallbackState
      type="empty"
      title="No hay coaches disponibles"
      message="No se encontraron coaches en este momento. Vuelve más tarde o intenta refrescar la página."
      onRetry={onRetry}
    />
  )
}

// Componente específico para cuando no hay actividades
export function NoActivitiesFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <FallbackState
      type="empty"
      title="No hay actividades disponibles"
      message="No se encontraron actividades en este momento. Vuelve más tarde o intenta refrescar la página."
      onRetry={onRetry}
    />
  )
}

// Componente específico para errores de red
export function NetworkErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <FallbackState
      type="error"
      title="Error de conexión"
      message="No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo."
      onRetry={onRetry}
    />
  )
}

// Componente específico para estado de carga
export function LoadingFallback({ message }: { message?: string }) {
  return (
    <FallbackState
      type="loading"
      title="Cargando contenido"
      message={message || "Por favor espera mientras cargamos el contenido..."}
      showRetry={false}
    />
  )
}

// Hook para detectar estado de conexión
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
