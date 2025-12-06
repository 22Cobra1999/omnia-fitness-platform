"use client"

import { useEffect } from "react"

/**
 * Silencia logs en cliente para reducir ruido en desarrollo.
 * - Mantiene console.error
 * - Desactiva console.log y console.warn salvo que NEXT_PUBLIC_VERBOSE_LOGS sea 'true'
 */
export function ConsoleSilencer() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const verbose = process.env.NEXT_PUBLIC_VERBOSE_LOGS === "true"

    // En desarrollo no silenciamos nada para poder ver todos los logs en Chrome
    if (process.env.NODE_ENV !== "production") return

    // En producción solo silenciamos si no se ha activado el modo verbose
    if (verbose) return

    const originalLog = console.log
    const originalWarn = console.warn

    // No-op para log y warn
    console.log = (..._args: any[]) => {}
    console.warn = (..._args: any[]) => {}

    // Restaurar en unmount por si se hot-reloadea
    return () => {
      console.log = originalLog
      console.warn = originalWarn
    }
  }, [])

  return null
}

















