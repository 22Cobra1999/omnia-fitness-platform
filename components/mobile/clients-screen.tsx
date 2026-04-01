"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, Users, Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useClientListLogic } from "./clients/hooks/useClientListLogic"
import { ClientCard } from "./clients/ui/ClientCard"
import { ClientDetailModal } from "./clients/ui/ClientDetailModal"
import { Client } from "./clients/types"
import { cn } from "@/lib/utils/utils"

export function ClientsScreen() {
  const router = useRouter()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isLegendOpen, setIsLegendOpen] = useState(false)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)

  // Logic Hooks
  const {
    clients,
    loading,
    error,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    filteredClients,
    refreshClients
  } = useClientListLogic()

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen p-4 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7939] mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen p-4 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#FF7939] text-white px-4 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black text-white min-h-screen p-5 pb-20">
      <div className="flex flex-row items-center justify-between mb-8 mt-4 gap-2">
          <h1 className="text-xl font-black text-white italic uppercase tracking-tight shrink-0">Mis Clientes</h1>
          
          <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar flex-1 justify-center border-l border-white/5 ml-2 pl-2">
              {[
                  { id: "all", label: "Todos" },
                  { id: "active", label: "Activos" },
              ].map((tab) => (
                  <button
                      key={tab.id}
                      className="relative pb-1 transition-all"
                      onClick={() => setFilter(tab.id as any)}
                  >
                      <span className={cn(
                          "text-[12px] font-black uppercase tracking-tight whitespace-nowrap px-1",
                          filter === tab.id ? "text-white" : "text-white/40"
                      )}>{tab.label}</span>
                      {filter === tab.id && (
                          <motion.div 
                              layoutId="activeTabUnderline"
                              className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FF7939] rounded-full" 
                          />
                      )}
                  </button>
              ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <AnimatePresence mode="wait">
                {isSearchExpanded ? (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="absolute right-12 top-4 z-50 flex items-center bg-[#111] border border-white/10 rounded-full px-3 py-1.5 shadow-2xl"
                    >
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none text-xs font-bold text-white placeholder:text-white/20 focus:outline-none w-24 sm:w-32"
                        />
                        <button onClick={() => { setIsSearchExpanded(false); setSearchTerm("") }} className="ml-2 text-white/40 hover:text-white">
                            <X size={14} />
                        </button>
                    </motion.div>
                ) : (
                    <motion.button
                        key="search-btn"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setIsSearchExpanded(true)}
                        className="text-white/40 hover:text-white p-1.5 transition-colors active:scale-95"
                    >
                        <Search size={16} />
                    </motion.button>
                )}
            </AnimatePresence>

            <button
                onClick={() => setIsLegendOpen(!isLegendOpen)}
                className={cn(
                    "p-1.5 transition-all flex items-center justify-center active:scale-90",
                    isLegendOpen ? "text-[#FF7939]" : "text-white/40"
                )}
            >
                <Info size={16} />
            </button>
          </div>
      </div>

      {/* Interactive Legend for Rings */}
      <AnimatePresence>
        {isLegendOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: -20 }}
            animate={{ opacity: 1, height: "auto", marginTop: -20 }}
            exit={{ opacity: 0, height: 0, marginTop: -20 }}
            className="overflow-hidden mb-8"
          >
            <div className="px-5 py-6 bg-[#111111] rounded-[24px] border border-white/5 relative shadow-2xl">
              <div className="grid grid-cols-1 gap-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-[#FACC15] shadow-[0_0_10px_rgba(250,204,21,0.4)]" />
                  <span className="text-[10px] font-black text-white/90 uppercase tracking-tighter italic">Amarillo marca platos completados</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-[#FF7939] shadow-[0_0_10px_rgba(255,121,57,0.4)]" />
                  <span className="text-[10px] font-black text-white/90 uppercase tracking-tighter italic">Naranja ejercicios completados</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                  <span className="text-[10px] font-black text-white/90 uppercase tracking-tighter italic">Rojo marca no completados</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-[#27272a] border border-white/5" />
                  <span className="text-[10px] font-black text-white/90 uppercase tracking-tighter italic">Gris marca proximos</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full pb-10 px-2 sm:px-0">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 col-span-2 sm:col-span-3">
            <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes'}
            </p>
            <p className="text-sm text-gray-500">
              {searchTerm && 'Intenta con otros términos de búsqueda'}
            </p>
          </div>
        ) : (
          filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onClick={setSelectedClient}
            />
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  )
}
