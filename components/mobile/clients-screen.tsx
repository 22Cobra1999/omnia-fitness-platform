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
      <div className="flex flex-col mb-8">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Seguimiento</span>
        <h1 className="text-2xl font-black text-white italic uppercase tracking-tight">Mis Clientes</h1>
      </div>

      {/* Search and filter */}
      <div className="flex items-center gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-full py-3.5 pl-11 pr-4 text-[13px] font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-[#FF7939]/50 transition-all"
          />
        </div>
        <button className="bg-[#111111] border border-white/5 rounded-full px-4 py-3 flex items-center gap-2 active:scale-95 transition-transform">
          <SlidersHorizontal size={18} className="text-white/40" />
          <span className="text-[11px] font-black text-white/40 uppercase tracking-tighter">Filtro</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-6 border-b border-white/5 pb-1 mb-8 overflow-x-auto hide-scrollbar">
        {[
          { id: "all", label: "Todos" },
          { id: "active", label: "Activos" },
          { id: "pending", label: "Pendientes" },
          { id: "inactive", label: "Inactivos" }
        ].map((tab) => (
          <button
            key={tab.id}
            className="relative pb-3 transition-all"
            onClick={() => setFilter(tab.id as any)}
          >
            <span className={cn(
              "text-[16px] font-black uppercase tracking-tight whitespace-nowrap px-1",
              filter === tab.id ? "text-white" : "text-white/40"
            )}>{tab.label}</span>
            {filter === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF7939] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Interactive Legend for Rings */}
      <div className="mb-8">
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className={cn(
            "flex items-center gap-3 px-5 py-3 rounded-full border transition-all duration-300",
            isLegendOpen
              ? "bg-[#111111] border-[#FF7939]/30 text-white w-full"
              : "bg-[#111111] border-white/5 text-white/40"
          )}
        >
          <div className={cn(
            "w-6 h-6 rounded-lg flex items-center justify-center border",
            isLegendOpen ? "bg-[#FF7939]/10 border-[#FF7939]/20 text-[#FF7939]" : "bg-white/5 border-white/10 text-white/20"
          )}>
            <Info size={14} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest italic">Info de anillos</span>
          {isLegendOpen ? <X size={14} className="ml-auto" /> : null}
        </button>

        <AnimatePresence>
          {isLegendOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden"
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
      </div>

      {/* Client list */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full pb-10 px-2 sm:px-0">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 col-span-2 sm:col-span-3">
            <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">
              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes'}
            </p>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Los clientes aparecerán aquí cuando compren tus actividades'}
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
