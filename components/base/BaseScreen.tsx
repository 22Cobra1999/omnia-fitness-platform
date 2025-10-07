"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Loader2,
  ChevronRight,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useComponentUsage } from "@/hooks/use-component-usage"

// Tipos base para el componente
export interface BaseScreenProps {
  title: string
  children: React.ReactNode
  showSearch?: boolean
  showFilters?: boolean
  showRefresh?: boolean
  searchPlaceholder?: string
  filterOptions?: Array<{ value: string; label: string }>
  onSearch?: (term: string) => void
  onFilter?: (value: string) => void
  onRefresh?: () => void
  isLoading?: boolean
  className?: string
}

// Hook personalizado para funcionalidad común de pantallas
export function useBaseScreen(
  screenName: string,
  options: {
    enableSearch?: boolean
    enableFilters?: boolean
    enableRefresh?: boolean
  } = {}
) {
  const usage = useComponentUsage(screenName)
  const router = useRouter()
  
  // Estados comunes
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")
  
  // Referencias para manejo de eventos
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Función de búsqueda con debounce y prefetching
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Debounce de 300ms
    searchTimeoutRef.current = setTimeout(() => {
      usage.track("search", { term, length: term.length })
      
    }, 300)
  }

  // Función de filtro
  const handleFilter = (value: string) => {
    setActiveFilter(value)
    usage.track("filter", { filter: value })
  }

  // Función de refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    usage.track("refresh")
    
    try {
      // Simular delay mínimo para UX
      await new Promise(resolve => setTimeout(resolve, 500))
    } finally {
      setRefreshing(false)
    }
  }

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return {
    // Estados
    searchTerm,
    showFilters,
    showFiltersModal,
    refreshing,
    activeFilter,
    
    // Setters
    setSearchTerm,
    setShowFilters,
    setShowFiltersModal,
    setRefreshing,
    setActiveFilter,
    
    // Funciones
    handleSearch,
    handleFilter,
    handleRefresh,
    
    // Utilidades
    usage,
    router
  }
}

// Componente base para pantallas
export function BaseScreen({
  title,
  children,
  showSearch = false,
  showFilters = false,
  showRefresh = false,
  searchPlaceholder = "Buscar...",
  filterOptions = [],
  onSearch,
  onFilter,
  onRefresh,
  isLoading = false,
  className = ""
}: BaseScreenProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    onSearch?.(term)
  }

  const handleFilter = (value: string) => {
    setActiveFilter(value)
    onFilter?.(value)
  }

  return (
    <div className={`flex flex-col h-full bg-[#121212] text-white overflow-y-auto pb-20 ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#2A2A2A] p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{title}</h1>
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-[#1E1E1E] border-[#2A2A2A] text-white placeholder-gray-400"
            />
          </div>
        )}

        {/* Filters */}
        {showFilters && filterOptions.length > 0 && (
          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersModal(true)}
              className="bg-[#1E1E1E] border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            
            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto">
              {filterOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={activeFilter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilter(option.value)}
                  className={`${
                    activeFilter === option.value 
                      ? 'bg-[#FF7939] text-white' 
                      : 'bg-[#1E1E1E] border-[#2A2A2A] text-white hover:bg-[#2A2A2A]'
                  }`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {children}
      </div>

      {/* Filters Modal */}
      <Dialog open={showFiltersModal} onOpenChange={setShowFiltersModal}>
        <DialogContent className="bg-[#1E1E1E] text-white border-[#2A2A2A]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Filtros</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFiltersModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Categoría</label>
              <Select value={activeFilter} onValueChange={handleFilter}>
                <SelectTrigger className="bg-[#2A2A2A] border-[#3A3A3A] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1E1E1E] border-[#2A2A2A]">
                  {filterOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-white hover:bg-[#2A2A2A]"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componente de loading común
export function BaseLoadingState({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-[#FF7939] mb-4" />
      <p className="text-gray-400">{message}</p>
    </div>
  )
}

// Componente de estado vacío común
export function BaseEmptyState({ 
  message, 
  action, 
  onAction 
}: { 
  message: string
  action?: string
  onAction?: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-[#2A2A2A] rounded-full flex items-center justify-center mb-4">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">Sin resultados</h3>
      <p className="text-gray-400 mb-4">{message}</p>
      {action && onAction && (
        <Button onClick={onAction} className="bg-[#FF7939] hover:bg-[#E66829]">
          {action}
        </Button>
      )}
    </div>
  )
}

// Hook para manejo de modales comunes
export function useBaseModal() {
  const [isOpen, setIsOpen] = useState(false)
  
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(!isOpen)
  
  return {
    isOpen,
    open,
    close,
    toggle
  }
}

// Componente de error común
export function BaseErrorState({ 
  message, 
  onRetry 
}: { 
  message: string
  onRetry?: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
        <X className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-2">Error</h3>
      <p className="text-gray-400 mb-4">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
          Reintentar
        </Button>
      )}
    </div>
  )
}
