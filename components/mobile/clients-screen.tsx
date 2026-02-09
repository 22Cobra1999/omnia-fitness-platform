"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Search, Filter, Users } from 'lucide-react'
import { useClientListLogic } from "./clients/hooks/useClientListLogic"
import { ClientCard } from "./clients/ui/ClientCard"
import { ClientDetailModal } from "./clients/ui/ClientDetailModal"
import { Client } from "./clients/types"

export function ClientsScreen() {
  const router = useRouter()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

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
    <div className="bg-black text-white min-h-screen p-4 pb-20">
      {/* Search and filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 mr-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF7939]"
          />
        </div>
        <div className="relative">
          <button className="flex items-center bg-zinc-900 border border-zinc-800 rounded-full py-2 px-4 text-sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtro
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex mb-6 border-b border-zinc-800">
        <button
          className={`pb-2 px-4 text-sm font-medium ${filter === "all" ? "text-[#FF7939] border-b-2 border-[#FF7939]" : "text-gray-400"}`}
          onClick={() => setFilter("all")}
        >
          Todos
        </button>
        <button
          className={`pb-2 px-4 text-sm font-medium ${filter === "active" ? "text-[#FF7939] border-b-2 border-[#FF7939]" : "text-gray-400"}`}
          onClick={() => setFilter("active")}
        >
          Activos
        </button>
        <button
          className={`pb-2 px-4 text-sm font-medium ${filter === "pending" ? "text-[#FF7939] border-b-2 border-[#FF7939]" : "text-gray-400"}`}
          onClick={() => setFilter("pending")}
        >
          Pendientes
        </button>
        <button
          className={`pb-2 px-4 text-sm font-medium ${filter === "inactive" ? "text-[#FF7939] border-b-2 border-[#FF7939]" : "text-gray-400"}`}
          onClick={() => setFilter("inactive")}
        >
          Inactivos
        </button>
      </div>

      {/* Client list */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 col-span-3">
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
