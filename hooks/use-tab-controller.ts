"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useCachedTabData } from "./use-cached-tab-data"

interface TabConfig<T> {
  id: string
  label: string
  fetchFunction: () => Promise<T>
  /** Tiempo de caché en milisegundos (por defecto: 5 minutos) */
  cacheTime?: number
  /** Si es true, los datos se cargarán cuando el componente se monte, no solo cuando se active la tab */
  preload?: boolean
}

interface TabControllerOptions {
  /** Clave para almacenar en sessionStorage */
  storageKey?: string
  /** Si es true, los datos se guardarán en sessionStorage */
  persistToStorage?: boolean
  /** Si es true, se recordará la última tab activa */
  rememberActiveTab?: boolean
  /** Tab activa por defecto */
  defaultActiveTab?: string
}

/**
 * Hook para gestionar tabs con carga de datos optimizada
 */
export function useTabController<T>(tabs: TabConfig<T>[], options: TabControllerOptions = {}) {
  const {
    storageKey = "tab_controller",
    persistToStorage = true,
    rememberActiveTab = true,
    defaultActiveTab = tabs[0]?.id,
  } = options

  // Intentar recuperar la última tab activa
  const getInitialActiveTab = () => {
    if (rememberActiveTab && persistToStorage) {
      try {
        const savedTab = sessionStorage.getItem(`${storageKey}_active_tab`)
        if (savedTab && tabs.some((tab) => tab.id === savedTab)) {
          return savedTab
        }
      } catch (err) {
        console.error("Error retrieving active tab:", err)
      }
    }
    return defaultActiveTab
  }

  // Estado para la tab activa
  const [activeTab, setActiveTab] = useState<string>(getInitialActiveTab())

  // Referencia para controlar si el componente está montado
  const isMounted = useRef(true)

  // Crear un mapa para almacenar los resultados de useCachedTabData para cada tab
  const tabDataResults = useRef<Record<string, ReturnType<typeof useCachedTabData<T>>>>({})

  // Crear los hooks useCachedTabData al montar el componente
  useEffect(() => {
    tabs.forEach((tab) => {
      tabDataResults.current[tab.id] = useCachedTabData(tab.fetchFunction, tab.id, {
        expirationTime: tab.cacheTime || 5 * 60 * 1000,
        storageKey,
        persistToStorage,
      })
    })

    return () => {
      // Limpiar los resultados al desmontar el componente
      tabDataResults.current = {}
    }
  }, [tabs, storageKey, persistToStorage])

  // Guardar la tab activa en sessionStorage
  useEffect(() => {
    if (rememberActiveTab && persistToStorage) {
      try {
        sessionStorage.setItem(`${storageKey}_active_tab`, activeTab)
      } catch (err) {
        console.error("Error saving active tab:", err)
      }
    }
  }, [activeTab, rememberActiveTab, persistToStorage, storageKey])

  // Cargar datos para la tab activa y las tabs con preload
  useEffect(() => {
    isMounted.current = true

    // Cargar datos para la tab activa
    tabDataResults.current[activeTab]?.fetchData()

    // Cargar datos para tabs con preload
    tabs.forEach((tab) => {
      if (tab.preload && tab.id !== activeTab) {
        // Usar setTimeout para dar prioridad a la tab activa
        setTimeout(() => {
          if (isMounted.current) {
            tabDataResults.current[tab.id]?.fetchData()
          }
        }, 100)
      }
    })

    return () => {
      isMounted.current = false
    }
  }, [activeTab, tabs])

  // Función para cambiar de tab
  const changeTab = useCallback(
    (tabId: string) => {
      if (tabs.some((tab) => tab.id === tabId)) {
        setActiveTab(tabId)
      }
    },
    [tabs],
  )

  // Función para recargar los datos de una tab específica
  const refreshTab = useCallback((tabId: string) => {
    if (tabDataResults.current[tabId]) {
      return tabDataResults.current[tabId].fetchData(true)
    }
    return Promise.reject(new Error(`Tab ${tabId} not found`))
  }, [])

  // Función para recargar los datos de todas las tabs
  const refreshAllTabs = useCallback(() => {
    return Promise.all(tabs.map((tab) => tabDataResults.current[tab.id].fetchData(true)))
  }, [tabs])

  return {
    activeTab,
    changeTab,
    refreshTab,
    refreshAllTabs,
    tabsData: tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      data: tabDataResults.current[tab.id].data,
      isLoading: tabDataResults.current[tab.id].isLoading,
      error: tabDataResults.current[tab.id].error,
      lastUpdated: tabDataResults.current[tab.id].lastUpdated,
      isCached: tabDataResults.current[tab.id].isCached,
    })),
    activeTabData: {
      data: tabDataResults.current[activeTab]?.data,
      isLoading: tabDataResults.current[activeTab]?.isLoading,
      error: tabDataResults.current[activeTab]?.error,
      refresh: () => refreshTab(activeTab),
      lastUpdated: tabDataResults.current[activeTab]?.lastUpdated,
      isCached: tabDataResults.current[activeTab]?.isCached,
    },
  }
}
