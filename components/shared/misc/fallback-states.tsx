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
  compact?: boolean
}

export function FallbackState({
  type,
  title,
  message,
  onRetry,
  showRetry = true,
  compact = false
}: FallbackStateProps) {
  const getContent = () => {
    switch (type) {
      case 'error':
        return {
          icon: <AlertCircle className={compact ? "h-6 w-6 text-red-500" : "h-12 w-12 text-red-500"} />,
          title: title || "¡Ups! Algo salió mal",
          message: message || "Hubo un problema al cargar los datos.",
          bgColor: "bg-red-500/10",
          iconBg: "bg-red-500/20"
        }
      case 'empty':
        return {
          icon: <Users className={compact ? "h-6 w-6 text-gray-400" : "h-12 w-12 text-gray-400"} />,
          title: title || "No hay contenido disponible",
          message: message || "No se encontraron elementos.",
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
              <RefreshCw className={compact ? "h-6 w-6 text-[#FF7939]" : "h-12 w-12 text-[#FF7939]"} />
            </motion.div>
          ),
          title: title || "Cargando...",
          message: message || "Por favor espera...",
          bgColor: "bg-orange-500/10",
          iconBg: "bg-orange-500/20"
        }
      case 'offline':
        return {
          icon: <WifiOff className={compact ? "h-6 w-6 text-yellow-500" : "h-12 w-12 text-yellow-500"} />,
          title: title || "Sin conexión",
          message: message || "Verifica tu conexión.",
          bgColor: "bg-yellow-500/10",
          iconBg: "bg-yellow-500/20"
        }
      default:
        return {
          icon: <AlertCircle className={compact ? "h-6 w-6 text-gray-400" : "h-12 w-12 text-gray-400"} />,
          title: title || "Estado desconocido",
          message: message || "Algo inesperado ocurrió.",
          bgColor: "bg-gray-500/10",
          iconBg: "bg-gray-500/20"
        }
    }
  }

  const content = getContent()

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-4 py-4 px-4 bg-white/5 rounded-2xl border border-white/5 w-full"
      >
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
          {React.cloneElement(content.icon as React.ReactElement<any>, { className: "h-5 w-5 opacity-50" })}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white/90">{content.title}</h4>
          <p className="text-[10px] text-gray-500 leading-tight">{content.message}</p>
        </div>
        {showRetry && onRetry && type !== 'loading' && (
          <button
            onClick={onRetry}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            <RefreshCw className="h-4 w-4 text-[#FF7939]" />
          </button>
        )}
      </motion.div>
    )
  }

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

export function CompactNoCoachesFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <FallbackState
      type="empty"
      title="Sin coaches"
      message="No hay coaches disponibles para esta búsqueda."
      onRetry={onRetry}
      compact={true}
    />
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
