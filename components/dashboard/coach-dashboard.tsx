"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientProfileCard } from "../client-profile-card"
import { ClientProfile } from "../client-profile"
import { useCoachClients } from "@/hooks/use-coach-clients"
import { Skeleton } from "@/components/ui/skeleton"

interface CoachDashboardProps {
  coachId: string
}

export function CoachDashboard({ coachId }: CoachDashboardProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const { clients, loading, error } = useCoachClients(coachId)

  // Filtrar clientes basado en búsqueda y estado
  const filteredClients = clients.filter((client) => {
    const user = client.users || {}
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase()
    const email = (user.email || "").toLowerCase()
    const searchMatch = fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase())

    if (filterStatus === "all") return searchMatch
    return searchMatch && client.engagement === filterStatus
  })

  // Seleccionar el primer cliente por defecto cuando se cargan los datos
  useEffect(() => {
    if (clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0])
    }
  }, [clients, selectedClient])

  return (
    <div className="flex flex-col space-y-4">
      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="analytics">Analítica</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Panel de clientes */}
            <div className="w-full md:w-1/3 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Mis Clientes</CardTitle>
                  <CardDescription>Gestiona tus clientes y su progreso</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Buscar clientes..."
                      className="w-full p-2 rounded-md bg-gray-800 border border-gray-700"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    <div className="flex space-x-2">
                      <button
                        className={`px-3 py-1 rounded-full text-sm ${
                          filterStatus === "all" ? "bg-[#FF7939] text-white" : "bg-gray-800 text-gray-400"
                        }`}
                        onClick={() => setFilterStatus("all")}
                      >
                        Todos
                      </button>
                      <button
                        className={`px-3 py-1 rounded-full text-sm ${
                          filterStatus === "active" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400"
                        }`}
                        onClick={() => setFilterStatus("active")}
                      >
                        Activos
                      </button>
                      <button
                        className={`px-3 py-1 rounded-full text-sm ${
                          filterStatus === "at risk" ? "bg-yellow-600 text-white" : "bg-gray-800 text-gray-400"
                        }`}
                        onClick={() => setFilterStatus("at risk")}
                      >
                        En riesgo
                      </button>
                      <button
                        className={`px-3 py-1 rounded-full text-sm ${
                          filterStatus === "inactive" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-400"
                        }`}
                        onClick={() => setFilterStatus("inactive")}
                      >
                        Inactivos
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {loading ? (
                  // Esqueletos de carga
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <Card key={i} className="bg-[#1A1A1A] border-none rounded-3xl overflow-hidden p-5">
                        <CardContent className="p-0 space-y-6">
                          <div className="flex items-center gap-4">
                            <Skeleton className="h-16 w-16 rounded-full" />
                            <div className="flex-1">
                              <Skeleton className="h-6 w-32 mb-2" />
                              <Skeleton className="h-4 w-48" />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <Skeleton className="h-16 rounded-xl" />
                            <Skeleton className="h-16 rounded-xl" />
                            <Skeleton className="h-16 rounded-xl" />
                          </div>
                          <Skeleton className="h-24 rounded-xl" />
                        </CardContent>
                      </Card>
                    ))
                ) : error ? (
                  <Card className="bg-red-900/20 border-red-800">
                    <CardContent className="p-4">
                      <p className="text-red-400">Error al cargar clientes: {error}</p>
                    </CardContent>
                  </Card>
                ) : filteredClients.length === 0 ? (
                  <Card className="bg-[#1A1A1A] border-none">
                    <CardContent className="p-4 text-center">
                      <p className="text-gray-400">
                        {searchTerm || filterStatus !== "all"
                          ? "No se encontraron clientes con los filtros actuales."
                          : "No tienes clientes aún."}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredClients.map((client) => (
                    <ClientProfileCard
                      key={client.id}
                      client={client}
                      onClientSelect={setSelectedClient}
                      isSelected={selectedClient?.id === client.id}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Panel de detalles del cliente */}
            <div className="w-full md:w-2/3">
              <Card className="h-full">
                <CardContent className="p-6">
                  {loading ? (
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-16 w-16 rounded-full" />
                          <div>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-4 w-48" />
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Skeleton className="h-10 w-24" />
                          <Skeleton className="h-10 w-24" />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        {Array(4)
                          .fill(0)
                          .map((_, i) => (
                            <Skeleton key={i} className="h-24 rounded-lg" />
                          ))}
                      </div>
                      <Skeleton className="h-48 rounded-lg" />
                      <Skeleton className="h-64 rounded-lg" />
                    </div>
                  ) : (
                    <ClientProfile client={selectedClient} />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
              <CardDescription>Gestiona tus productos y servicios</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Contenido de productos (próximamente)</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analítica</CardTitle>
              <CardDescription>Visualiza el rendimiento de tu negocio</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Contenido de analítica (próximamente)</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
