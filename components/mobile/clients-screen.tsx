"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Users, TrendingUp, Clock, X, MessageCircle, Calendar, Target, AlertTriangle, Flame, MessageSquare } from "lucide-react"
import { ClientCalendar } from "@/components/coach/client-calendar"

interface Client {
  id: string
  name: string
  email: string
  avatar_url?: string
  progress: number
  status: 'active' | 'inactive' | 'pending'
  lastActive: string
  totalExercises: number
  completedExercises: number
  totalRevenue: number
  activitiesCount: number
  todoCount?: number
  activities: Array<{
    id: number
    title: string
    type: string
    amountPaid: number
  }>
}

export function ClientsScreen() {
  const [filter, setFilter] = useState("all")
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientDetail, setClientDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showTodoSection, setShowTodoSection] = useState(false)
  const [todoTasks, setTodoTasks] = useState<string[]>([])
  const [newTask, setNewTask] = useState("")
  const [loadingTodo, setLoadingTodo] = useState(false)
  const [showInjuries, setShowInjuries] = useState(false)
  const [showBiometrics, setShowBiometrics] = useState(false)
  const [showObjectives, setShowObjectives] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  // Cargar clientes reales
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        
        const response = await fetch('/api/coach/clients')
        const data = await response.json()


        if (data.success) {
          if (data.clients && data.clients.length > 0) {
            console.log('👥 ClientsScreen: Clientes cargados', data.clients.map(client => ({
              id: client.id,
              name: client.name,
              email: client.email,
              activitiesCount: client.activitiesCount,
              progress: 0, // Removido client.progress ya que no existe en la base de datos
              todoCount: client.todoCount,
              totalRevenue: client.totalRevenue,
              activities: client.activities
            })))
          } else {
          }
          setClients(data.clients || [])
        } else {
          setError(data.error || 'Error al cargar clientes')
        }
      } catch (err) {
        console.error('❌ [CLIENTS LIST] Error fetching clients:', err)
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Función para cargar detalles del cliente
  const fetchClientDetail = async (clientId: string) => {
    try {
      setLoadingDetail(true)
      
      const response = await fetch(`/api/coach/clients/${clientId}/details`)
      const data = await response.json()
      
      
      if (data.success && data.client) {
        console.log('👤 ClientsScreen: Detalles del cliente cargados', {
          id: data.client.id,
          name: data.client.name,
          email: data.client.email,
          activities: data.client.activities,
          injuries: data.client.injuries,
          biometrics: data.client.biometrics,
          objectives: data.client.objectives,
          progress: 0, // Removido data.client.progress ya que no existe en la base de datos
          activitiesCount: data.client.activitiesCount,
          todoCount: data.client.todoCount,
          totalRevenue: data.client.totalRevenue
        })
      } else {
      }
      
      setClientDetail(data)
    } catch (error) {
      console.error('❌ [CLIENT DETAIL] Error fetching client detail:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Función para abrir modal del cliente
  const openClientModal = (client: Client) => {
    console.log('👤 ClientsScreen: Abriendo modal del cliente', {
      id: client.id,
      name: client.name,
      email: client.email,
      activities: client.activities,
      progress: 0, // Removido client.progress ya que no existe en la base de datos
      activitiesCount: client.activitiesCount,
      todoCount: client.todoCount,
      totalRevenue: client.totalRevenue
    })
    setSelectedClient(client)
    fetchClientDetail(client.id)
  }

  // Función para cerrar modal
  const closeClientModal = () => {
    setSelectedClient(null)
    setClientDetail(null)
    setShowTodoSection(false)
    setTodoTasks([])
    setNewTask("")
    setShowInjuries(false)
    setShowBiometrics(false)
    setShowObjectives(false)
    setShowCalendar(false)
  }

  // Función para cargar tareas To Do
  const loadTodoTasks = async (clientId: string) => {
    try {
      setLoadingTodo(true)
      const response = await fetch(`/api/coach/clients/${clientId}/todo`)
      const data = await response.json()
      if (data.success && data.tasks) setTodoTasks(data.tasks)
    } catch (error) {
      console.error('Error loading todo tasks:', error)
    } finally {
      setLoadingTodo(false)
    }
  }

  // Agregar nueva tarea
  const addNewTask = async () => {
    if (!newTask.trim() || !selectedClient || todoTasks.length >= 4) return
    try {
      setLoadingTodo(true)
      const response = await fetch(`/api/coach/clients/${selectedClient.id}/todo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: newTask.trim() })
      })
      const data = await response.json()
      if (data.success) {
        setTodoTasks(data.tasks)
        setNewTask("")
      }
    } catch (error) {
      console.error('Error adding task:', error)
    } finally {
      setLoadingTodo(false)
    }
  }

  // Completar tarea (eliminar)
  const completeTask = async (taskIndex: number) => {
    if (!selectedClient) return
    try {
      setLoadingTodo(true)
      const response = await fetch(`/api/coach/clients/${selectedClient.id}/todo`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIndex })
      })
      const data = await response.json()
      if (data.success) setTodoTasks(data.tasks)
    } catch (error) {
      console.error('Error completing task:', error)
    } finally {
      setLoadingTodo(false)
    }
  }

  // Filter clients based on selected filter and search term
  const filteredClients = clients.filter((client) => {
    const matchesFilter = filter === "all" || client.status === filter
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })


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
      <h1 className="text-2xl font-bold mb-6">Mis Clientes</h1>

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
      <div className="space-y-4">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
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
            <div
              key={client.id}
              className="bg-[#141414] rounded-xl p-3 border border-zinc-800/60 shadow-sm cursor-pointer hover:bg-[#181818] transition-colors"
              onClick={() => openClientModal(client)}
            >
              {/* Header */}
              <div className="flex items-center gap-3">
                <img
                  src={client.avatar_url || "/placeholder.svg"}
                  alt={client.name}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium leading-tight truncate text-[15px]">{client.name}</h3>
                    <div className="text-sm font-semibold text-white/90">${client.totalRevenue}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${client.status === "active" ? "bg-green-500" : client.status === "pending" ? "bg-yellow-500" : "bg-gray-500"}`}></span>
                    <span className="truncate">Última ejercitación: {client.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Metrics row */}
              <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-zinc-900/60 rounded-md py-1.5">
                  <div className="text-[10px] text-gray-400 tracking-wide">ACTIVIDADES</div>
                  <div className="text-sm font-medium">{client.activitiesCount}</div>
                </div>
                <div className="bg-zinc-900/60 rounded-md py-1.5">
                  <div className="text-[10px] text-gray-400 tracking-wide">TO DO</div>
                  <div className="text-sm font-medium">{client.todoCount || 0}</div>
                </div>
                <div className="bg-zinc-900/60 rounded-md py-1.5">
                  <div className="text-[10px] text-gray-400 tracking-wide">PROGRESO</div>
                  <div className="text-sm font-medium text-[#FF7939]">{client.progress}%</div>
                </div>
              </div>
              
              {/* Sin subtexto de completados */}
            </div>
          ))
        )}
      </div>

      {/* Modal del cliente - Pantalla completa */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black z-30 flex flex-col">
          {/* Contenido del modal - Pantalla completa */}
          <div className="flex-1 bg-black text-white p-4 pt-20 overflow-y-auto">
            {/* Información básica - compacta */}
            <div className="flex items-center gap-3 mb-4">
              <img
                src={selectedClient.avatar_url || "/placeholder.svg"}
                alt={selectedClient.name}
                className="w-12 h-12 rounded-full object-cover border border-zinc-700"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{selectedClient.name}</h3>
                    <button className="p-1 hover:bg-zinc-800/50 rounded-full transition-colors">
                      <MessageSquare className="h-4 w-4 text-gray-400 hover:text-white" />
                    </button>
                  </div>
                  <button
                    onClick={closeClientModal}
                    className="p-2 hover:bg-zinc-800/50 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-sm text-gray-400">{selectedClient.email}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${selectedClient.status === "active" ? "bg-green-500" : selectedClient.status === "pending" ? "bg-yellow-500" : "bg-gray-500"}`}></span>
                  <span>Última ejercitación: {selectedClient.lastActive}</span>
                </div>
              </div>
            </div>

            {/* Métricas principales - compactas */}
            <div className="flex justify-between items-center mb-4 px-2">
              <div className="text-center">
                <div className="text-lg font-bold text-[#FF7939]">{clientDetail?.client?.progress || selectedClient.progress}%</div>
                <div className="text-xs text-gray-400">Progreso</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{clientDetail?.client?.activitiesCount || selectedClient.activitiesCount}</div>
                <div className="text-xs text-gray-400">Actividades</div>
              </div>
              <div 
                className="text-center cursor-pointer hover:bg-zinc-800/50 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => {
                  if (!showTodoSection && selectedClient) loadTodoTasks(selectedClient.id)
                  setShowTodoSection(!showTodoSection)
                }}
              >
                <div className="text-lg font-bold">{clientDetail?.client?.todoCount || 0}</div>
                <div className="text-xs text-gray-400">To Do</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">${clientDetail?.client?.totalRevenue || selectedClient.totalRevenue}</div>
                <div className="text-xs text-gray-400">Ingresos</div>
              </div>
            </div>

            {/* To Do expandido */}
            {showTodoSection && (
              <div className="mb-4 bg-zinc-900/40 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-300 mb-2">Tareas ({clientDetail?.client?.todoCount || 0}/4)</div>
                <div className="space-y-2">
                  {/* Lista de tareas */}
                  {todoTasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2 py-2 px-3 bg-zinc-800/50 rounded">
                      <button
                        onClick={() => completeTask(index)}
                        className="bg-transparent border-none cursor-pointer p-1 rounded transition-all duration-200 flex items-center justify-center flex-shrink-0"
                        style={{
                          color: '#FF7939',
                          padding: '4px',
                          borderRadius: '4px',
                        }}
                        disabled={loadingTodo}
                        aria-label="Completar tarea"
                        title="Completar"
                      >
                        <Flame size={20} />
                      </button>
                      <span className="text-sm flex-1">{task}</span>
                    </div>
                  ))}

                  {/* Agregar nueva tarea */}
                  {todoTasks.length < 4 && (
                    <div className="flex items-center gap-2 py-2 px-3 bg-zinc-800/30 rounded border border-dashed border-zinc-600">
                      <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Nueva tarea..."
                        className="flex-1 bg-transparent text-sm placeholder-gray-500 focus:outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && addNewTask()}
                        disabled={loadingTodo}
                      />
                      <button
                        onClick={addNewTask}
                        disabled={!newTask.trim() || loadingTodo}
                        className="text-[#FF7939] hover:text-[#FF7939]/80 disabled:text-gray-500 disabled:cursor-not-allowed"
                        aria-label="Agregar tarea"
                        title="Agregar"
                      >
                        +
                      </button>
                    </div>
                  )}

                  {loadingTodo && (
                    <div className="text-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FF7939] mx-auto"></div>
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* Detalles adicionales del cliente */}
            {loadingDetail && (
              <div className="mb-6 text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF7939] mx-auto mb-2"></div>
                <p className="text-sm text-gray-400">Cargando detalles del cliente...</p>
              </div>
            )}

            {clientDetail && clientDetail.success && (
              <>
                {/* Secciones colapsables */}
                <div className="space-y-2 mb-4">
                  {/* Lesiones del cliente - colapsable */}
                  {clientDetail.client.injuries && clientDetail.client.injuries.length > 0 && (
                    <div className="bg-zinc-900/40 rounded-lg">
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                        onClick={() => setShowInjuries(!showInjuries)}
                      >
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium text-gray-300">Lesiones ({clientDetail.client.injuries.length})</span>
                        </div>
                        <div className="text-xs text-gray-500">{showInjuries ? 'Ocultar' : 'Ver'}</div>
                      </div>
                      {showInjuries && (
                        <div className="px-3 pb-3 space-y-2">
                          {clientDetail.client.injuries.map((injury: any, index: number) => (
                            <div key={index} className="p-3 bg-zinc-800/50 rounded">
                              <div className="flex justify-between items-center mb-2">
                                <div className="font-medium text-sm">{injury.name}</div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  injury.severity === 'high' ? 'bg-red-900/50 text-red-400' :
                                  injury.severity === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                                  'bg-green-900/50 text-green-400'
                                }`}>
                                  {injury.severity === 'high' ? 'Alta' : injury.severity === 'medium' ? 'Media' : 'Baja'}
                                </span>
                              </div>
                              
                              {/* Información estandarizada */}
                              {(injury.muscle_name || injury.pain_level) && (
                                <div className="space-y-1 text-xs text-gray-300">
                                  {injury.muscle_name && (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-[#FF7939]">📍</span>
                                      <span>{injury.muscle_name}</span>
                                      {injury.muscle_group && (
                                        <span className="text-gray-500">({injury.muscle_group})</span>
                                      )}
                                    </div>
                                  )}
                                  
                                  {injury.pain_level && (
                                    <div className="flex items-center space-x-1">
                                      <span className="text-[#FF7939]">⚡</span>
                                      <span>Dolor {injury.pain_level}/3</span>
                                      {injury.pain_description && (
                                        <span className="text-gray-500">- {injury.pain_description}</span>
                                      )}
                                    </div>
                                  )}
                                  
                                </div>
                              )}
                              
                              {/* Descripción adicional */}
                              {injury.description && (
                                <div className="mt-2 text-xs text-gray-400 bg-zinc-900/30 p-2 rounded">
                                  {injury.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Biométricas del cliente - colapsable */}
                  {clientDetail.client.biometrics && clientDetail.client.biometrics.length > 0 && (
                    <div className="bg-zinc-900/40 rounded-lg">
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                        onClick={() => setShowBiometrics(!showBiometrics)}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-300">Biométricas ({clientDetail.client.biometrics.length})</span>
                        </div>
                        <div className="text-xs text-gray-500">{showBiometrics ? 'Ocultar' : 'Ver'}</div>
                      </div>
                      {showBiometrics && (
                        <div className="px-3 pb-3 space-y-1">
                          {clientDetail.client.biometrics.map((biometric: any, index: number) => (
                            <div key={index} className="flex justify-between items-center py-2 px-3 bg-zinc-800/50 rounded">
                              <div className="font-medium text-sm">{biometric.name}</div>
                              <div className="text-sm font-semibold text-white">
                                {biometric.value} {biometric.unit}
                              </div>
                      </div>
                    ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Objetivos del cliente - colapsable */}
                  {clientDetail.client.objectives && clientDetail.client.objectives.length > 0 && (
                    <div className="bg-zinc-900/40 rounded-lg">
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                        onClick={() => setShowObjectives(!showObjectives)}
                      >
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-300">Objetivos ({clientDetail.client.objectives.length})</span>
                        </div>
                        <div className="text-xs text-gray-500">{showObjectives ? 'Ocultar' : 'Ver'}</div>
                      </div>
                      {showObjectives && (
                        <div className="px-3 pb-3 space-y-1">
                          {clientDetail.client.objectives.map((objective: any, index: number) => (
                            <div key={index} className="py-2 px-3 bg-zinc-800/50 rounded">
                              <div className="font-medium text-sm mb-1">{objective.exercise_title}</div>
                              <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>Actual: {objective.current_value} {objective.unit}</span>
                                <span>Objetivo: {objective.objective} {objective.unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actividades Activas - debajo de las secciones colapsables */}
                {selectedClient.activities && selectedClient.activities.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-300 mb-2">Actividades Activas ({selectedClient.activities.length})</div>
                    <div className="space-y-1">
                      {selectedClient.activities.map((activity, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-3 bg-zinc-900/40 rounded">
                          <div className="font-medium text-sm">{activity.title}</div>
                          <div className="text-xs text-gray-400">${activity.amountPaid}</div>
                        </div>
                      ))}
                    </div>
                      </div>
                    )}

                {/* Calendario de actividades - colapsable */}
                <div className="bg-zinc-900/40 rounded-lg mb-4">
                  <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-300">Calendario de Actividades</span>
                    </div>
                    <div className="text-xs text-gray-500">{showCalendar ? 'Ocultar' : 'Ver'}</div>
                  </div>
                  {showCalendar && (
                    <div className="px-3 pb-3">
                      <ClientCalendar clientId={selectedClient.id} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Debug info (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-6">
                <details>
                  <summary className="text-sm text-gray-500 cursor-pointer mb-2">Debug Info</summary>
                  <pre className="text-xs text-gray-400 p-3 bg-zinc-900/40 rounded overflow-auto max-h-40">
                    {JSON.stringify({ selectedClient, clientDetail }, null, 2)}
                  </pre>
                </details>
            </div>
        )}

          </div>
      </div>
      )}
    </div>
  )
}
