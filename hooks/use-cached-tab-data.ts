"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface CacheItem<T> {
  data: T
  timestamp: number
}

interface CacheOptions {
  /** Tiempo de expiración de la caché en milisegundos (por defecto: 5 minutos) */
  expirationTime?: number
  /** Clave para almacenar en sessionStorage (opcional) */
  storageKey?: string
  /** Si es true, los datos se guardarán en sessionStorage para persistir entre recargas */
  persistToStorage?: boolean
}

/**
 * Hook personalizado para gestionar datos en caché para tabs
 * Optimiza las consultas al backend evitando solicitudes innecesarias
 */
export function useCachedTabData<T>(fetchFunction: () => Promise<T>, tabId: string, options: CacheOptions = {}) {
  // Opciones por defecto
  const {
    expirationTime = 5 * 60 * 1000, // 5 minutos
    storageKey,
    persistToStorage = false,
  } = options

  // Estado para los datos y estado de carga
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number>(0)

  // Referencia para almacenar la caché en memoria
  const cacheRef = useRef<Map<string, CacheItem<T>>>(new Map())

  // Intentar cargar datos desde sessionStorage al inicio
  useEffect(() => {
    if (persistToStorage && storageKey) {
      try {
        const cachedData = sessionStorage.getItem(`${storageKey}_${tabId}`)
        if (cachedData) {
          const { data: storedData, timestamp } = JSON.parse(cachedData)
          if (Date.now() - timestamp < expirationTime) {
            setData(storedData)
            setLastUpdated(timestamp)
            cacheRef.current.set(tabId, { data: storedData, timestamp })
          }
        }
      } catch (err) {
        console.error("Error loading cached data from storage:", err)
      }
    }
  }, [tabId, persistToStorage, storageKey, expirationTime])

  // Función para cargar datos
  const fetchData = useCallback(
    async (force = false) => {
      // Verificar si hay datos en caché y no están expirados
      const cachedItem = cacheRef.current.get(tabId)
      const now = Date.now()

      if (!force && cachedItem && now - cachedItem.timestamp < expirationTime) {
        // Usar datos en caché
        setData(cachedItem.data)
        return cachedItem.data
      }

      // Si no hay caché válida, cargar datos
      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchFunction()

        // Actualizar caché en memoria
        cacheRef.current.set(tabId, { data: result, timestamp: now })

        // Guardar en sessionStorage si está habilitado
        if (persistToStorage && storageKey) {
          try {
            sessionStorage.setItem(`${storageKey}_${tabId}`, JSON.stringify({ data: result, timestamp: now }))
          } catch (err) {
            console.error("Error saving to sessionStorage:", err)
          }
        }

        setData(result)
        setLastUpdated(now)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error")
        setError(error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [tabId, fetchFunction, expirationTime, persistToStorage, storageKey],
  )

  // Función para invalidar la caché
  const invalidateCache = useCallback(() => {
    cacheRef.current.delete(tabId)
    if (persistToStorage && storageKey) {
      try {
        sessionStorage.removeItem(`${storageKey}_${tabId}`)
      } catch (err) {
        console.error("Error removing from sessionStorage:", err)
      }
    }
  }, [tabId, persistToStorage, storageKey])

  return {
    data,
    isLoading,
    error,
    fetchData,
    invalidateCache,
    lastUpdated,
    isCached:
      cacheRef.current.has(tabId) && Date.now() - (cacheRef.current.get(tabId)?.timestamp || 0) < expirationTime,
  }
}
