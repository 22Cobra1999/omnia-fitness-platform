"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { ArrowDown, RefreshCw } from "lucide-react"

interface PullToRefreshProps {
  onRefresh: () => Promise<any>
  children: ReactNode
  className?: string
  pullDownThreshold?: number
  refreshText?: string
  pullingText?: string
  releaseText?: string
  lastUpdated?: Date | null
}

export function PullToRefresh({
  onRefresh,
  children,
  className = "",
  pullDownThreshold = 80,
  refreshText = "Actualizando...",
  pullingText = "Desliza para actualizar",
  releaseText = "Suelta para actualizar",
  lastUpdated = null,
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)

  const handleTouchStart = (e: TouchEvent) => {
    // Solo permitir pull to refresh si estamos en la parte superior
    if (window.scrollY <= 0) {
      startYRef.current = e.touches[0].clientY
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isPulling) return

    currentYRef.current = e.touches[0].clientY
    const distance = Math.max(0, currentYRef.current - startYRef.current)

    // Aplicar resistencia para que sea más difícil tirar demasiado
    const resistedDistance = Math.min(distance * 0.4, pullDownThreshold * 1.5)

    setPullDistance(resistedDistance)

    // Prevenir el scroll normal mientras se está tirando
    if (resistedDistance > 0) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling) return

    if (pullDistance >= pullDownThreshold) {
      // Iniciar la actualización
      setIsRefreshing(true)
      setPullDistance(pullDownThreshold) // Mantener el indicador visible durante la actualización

      try {
        await onRefresh()
      } catch (error) {
        console.error("Error during refresh:", error)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // No alcanzó el umbral, volver a la posición inicial
      setPullDistance(0)
    }

    setIsPulling(false)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("touchstart", handleTouchStart, { passive: false })
    container.addEventListener("touchmove", handleTouchMove, { passive: false })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isPulling, pullDistance])

  // Formatear la fecha de última actualización
  const formattedLastUpdated = lastUpdated
    ? `Última actualización: ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : null

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Indicador de pull-to-refresh */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center justify-center transition-transform duration-200 z-10 bg-gray-100 dark:bg-gray-800 rounded-b-lg shadow-md"
        style={{
          transform: `translateY(${pullDistance - pullDownThreshold}px)`,
          height: `${pullDownThreshold}px`,
          opacity: pullDistance / pullDownThreshold,
        }}
      >
        {isRefreshing ? (
          <RefreshCw className="animate-spin h-6 w-6 text-primary mb-1" />
        ) : (
          <ArrowDown
            className="h-6 w-6 text-primary mb-1 transition-transform"
            style={{
              transform: `rotate(${Math.min(180, (pullDistance / pullDownThreshold) * 180)}deg)`,
            }}
          />
        )}
        <span className="text-sm font-medium">
          {isRefreshing ? refreshText : pullDistance >= pullDownThreshold ? releaseText : pullingText}
        </span>
        {formattedLastUpdated && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formattedLastUpdated}</span>
        )}
      </div>

      {/* Contenido principal */}
      <div
        style={{
          transform: `translateY(${Math.max(0, pullDistance)}px)`,
          transition: isPulling ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  )
}
