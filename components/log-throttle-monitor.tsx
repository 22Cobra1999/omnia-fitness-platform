"use client"

import { useState, useEffect } from 'react'
import { logThrottler } from '@/lib/log-throttler'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertTriangle, Info, X } from 'lucide-react'

interface LogThrottleMonitorProps {
  className?: string
}

export function LogThrottleMonitor({ className }: LogThrottleMonitorProps) {
  const [stats, setStats] = useState(logThrottler.getStats())
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Solo mostrar en desarrollo
    if (process.env.NODE_ENV !== 'development') return

    const interval = setInterval(() => {
      setStats(logThrottler.getStats())
    }, 5000) // Actualizar cada 5 segundos

    return () => clearInterval(interval)
  }, [])

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  // Solo mostrar si hay throttles activos
  if (!isVisible && stats.activeThrottles === 0) {
    return null
  }

  const throttledCount = stats.entries.filter(e => e.isThrottled).length

  return (
    <Card className={`fixed bottom-4 right-4 w-80 z-50 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Log Throttling
            <Badge variant="secondary" className="text-xs">
              {stats.activeThrottles}
            </Badge>
          </CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setStats(logThrottler.getStats())}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Throttles Activos:</span>
            <Badge variant={stats.activeThrottles > 0 ? "destructive" : "secondary"}>
              {stats.activeThrottles}
            </Badge>
          </div>
          
          <div className="flex justify-between text-xs">
            <span>Logs Suprimidos:</span>
            <Badge variant={throttledCount > 0 ? "destructive" : "secondary"}>
              {throttledCount}
            </Badge>
          </div>

          {stats.activeThrottles > 0 && (
            <div className="mt-3">
              <div className="text-xs font-medium mb-2">Throttles Activos:</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {stats.entries.map((entry, index) => (
                  <div
                    key={index}
                    className={`text-xs p-2 rounded border ${
                      entry.isThrottled 
                        ? 'bg-red-50 border-red-200 text-red-700' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="font-medium truncate">{entry.key}</div>
                    <div className="text-xs opacity-75">
                      Logs: {entry.count} | Último: {new Date(entry.lastLog).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.activeThrottles > 0 && (
            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
              <Info className="h-3 w-3 inline mr-1" />
              Los logs están siendo throttled para evitar spam. Los logs repetitivos se suprimen por 30 segundos.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para mostrar el monitor de throttling en desarrollo
export function LogThrottleIndicator() {
  const [stats, setStats] = useState(logThrottler.getStats())
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const interval = setInterval(() => {
      setStats(logThrottler.getStats())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const throttledCount = stats.entries.filter(e => e.isThrottled).length

  // Solo mostrar si hay throttles activos
  if (stats.activeThrottles === 0) {
    return null
  }

  return (
    <>
      {/* Indicador flotante */}
      <div 
        className="fixed top-4 right-4 z-40 cursor-pointer"
        onClick={() => setIsVisible(true)}
      >
        <Badge 
          variant="destructive" 
          className="animate-pulse shadow-lg"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          {stats.activeThrottles} Throttles
          {throttledCount > 0 && ` (${throttledCount} suprimidos)`}
        </Badge>
      </div>

      {/* Monitor completo */}
      {isVisible && <LogThrottleMonitor />}
    </>
  )
}


































