"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import { Search, Filter, Users, TrendingUp, Clock, X, MessageCircle, Calendar, Target, AlertTriangle, Flame, MessageSquare, MapPin } from "lucide-react"
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
  const router = useRouter()
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
  const [activeTab, setActiveTab] = useState<'calendar' | 'info'>('calendar')
  const [activeClientPanel, setActiveClientPanel] = useState<'activities' | 'todo' | 'progress' | 'revenue' | null>(null)
  const [showTodoInput, setShowTodoInput] = useState(false)
  const [hiddenActivities, setHiddenActivities] = useState<Set<number>>(new Set())
  const [scrollPositions, setScrollPositions] = useState<{ calendar: number; info: number }>({ calendar: 0, info: 0 })
  const calendarScrollRef = useRef<HTMLDivElement>(null)
  const calendarContainerRef = useRef<HTMLDivElement>(null)
  const exercisesListRef = useRef<HTMLDivElement>(null)

  const preserveModalScrollPosition = (fn: () => void) => {
    const prevTop = calendarScrollRef.current?.scrollTop
    fn()
    setTimeout(() => {
      if (calendarScrollRef.current && typeof prevTop === 'number') {
        calendarScrollRef.current.scrollTop = prevTop
      }
    }, 0)
  }

  const navigateToTab = (tab: string, section?: string) => {
    window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab, section } }))
  }

  // Cargar clientes reales
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        
        const response = await fetch('/api/coach/clients', {
          credentials: 'include'
        })
        const data = await response.json()

        console.log('👥 ClientsScreen: Respuesta /api/coach/clients', {
          status: response.status,
          ok: response.ok,
          success: data?.success,
          clientsCount: data?.clients?.length || 0,
          debug: data?.debug,
          error: data?.error,
          warning: data?.warning
        })


        if (response.ok && data.success) {
          if (data.clients && data.clients.length > 0) {
            console.log('👥 ClientsScreen: Clientes cargados', data.clients.map((client: any) => ({
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
      
      const response = await fetch(`/api/coach/clients/${clientId}/details`, {
        credentials: 'include'
      })
      const data = await response.json()

      console.log('👤 ClientsScreen: Respuesta /api/coach/clients/[id]/details', {
        status: response.status,
        ok: response.ok,
        success: data?.success,
        hasClient: !!data?.client,
        error: data?.error,
        stats: data?.stats
      })
      
      
      if (response.ok && data.success && data.client) {
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
      const response = await fetch(`/api/coach/clients/${clientId}/todo`, { credentials: 'include' })
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
    if (!newTask.trim() || !selectedClient || todoTasks.length >= 5) return
    try {
      setLoadingTodo(true)
      const response = await fetch(`/api/coach/clients/${selectedClient.id}/todo`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: newTask.trim() })
      })
      const data = await response.json()
      if (data.success) {
        setTodoTasks(data.tasks)
        setNewTask("")
        setShowTodoInput(false)
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
        credentials: 'include',
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
              <div className="mt-2 bg-zinc-900/60 rounded-md py-2 px-2">
                <div className="grid grid-cols-3 text-center">
                  <div>
                    <div className="text-[10px] text-gray-400 tracking-wide">ACTIVIDADES</div>
                    <div className="text-sm font-medium">{client.activitiesCount}</div>
                  </div>
                  <div className="border-l border-zinc-800">
                    <div className="text-[10px] text-gray-400 tracking-wide">TO DO</div>
                    <div className="text-sm font-medium">{client.todoCount || 0}</div>
                  </div>
                  <div className="border-l border-zinc-800">
                    <div className="text-[10px] text-gray-400 tracking-wide">PROGRESO</div>
                    <div className="text-sm font-medium text-[#FF7939]">{client.progress}%</div>
                  </div>
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
          {/* Contenedor scrollable */}
          <div className="flex-1 overflow-y-auto" ref={calendarScrollRef}>
            {/* Header con imagen centrada y blur de fondo */}
            <div 
              className="relative bg-black pt-16 pb-4 px-4"
              style={{
                backgroundImage: selectedClient.avatar_url 
                  ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)), url(${selectedClient.avatar_url})`
                  : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Fondo blur adicional más visible */}
              {selectedClient.avatar_url && (
                <div 
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: `url(${selectedClient.avatar_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(12px)',
                    transform: 'scale(1.1)'
                  }}
                />
              )}
              
              {/* Contenido sobre el blur */}
              <div className="relative z-10">
                {/* Botón cerrar */}
                <button
                  onClick={closeClientModal}
                  className="absolute top-0 right-0 p-2 hover:bg-black/20 rounded-full transition-colors z-30"
                >
                  <X className="h-5 w-5 text-white" />
                </button>

                {/* Imagen centrada sin círculo */}
                <div className="flex flex-col items-center mb-3">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden mb-2">
                    <img
                      src={selectedClient.avatar_url || "/placeholder.svg"}
                      alt={selectedClient.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Nombre + acciones */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-sm hover:bg-white/15 transition-colors"
                      title="Crear Meet"
                      onClick={() => {
                        try {
                          const url = `/` + `?tab=calendar&clientId=${encodeURIComponent(selectedClient.id)}`
                          router.push(url)
                          navigateToTab('calendar')
                        } catch {
                          navigateToTab('calendar')
                        }
                      }}
                    >
                      <Calendar className="h-4 w-4 text-white/85" />
                    </button>

                    <h3 className="font-semibold text-lg text-white mx-1">{selectedClient.name}</h3>

                    <button
                      type="button"
                      className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-sm hover:bg-white/15 transition-colors"
                      title="Mensajes"
                      onClick={() => {
                        // Navegar a mensajes y dejar el clientId en query para poder preseleccionar conversación
                        try {
                          const url = `/` + `?tab=messages&clientId=${encodeURIComponent(selectedClient.id)}`
                          router.push(url)
                          navigateToTab('messages')
                        } catch {
                          navigateToTab('messages')
                        }
                        closeClientModal()
                      }}
                    >
                      <MessageSquare className="h-4 w-4 text-white/85" />
                    </button>
                  </div>
                  
                  {/* Email y última ejercitación */}
                  <p className="text-sm text-white/70 mt-0.5">{selectedClient.email}</p>
                  <div className="flex items-center gap-2 text-xs text-white/60 mt-0.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${selectedClient.status === "active" ? "bg-green-500" : selectedClient.status === "pending" ? "bg-yellow-500" : "bg-gray-500"}`}></span>
                    <span>Última ejercitación: {selectedClient.lastActive}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas - fondo negro, sticky arriba */}
            <div className="flex justify-between items-center bg-black px-4 py-3 border-b border-zinc-800 sticky top-0 z-20">
              <button
                className="text-center flex-1"
                onClick={() => {
                  preserveModalScrollPosition(() => {
                    setActiveClientPanel((prev) => (prev === 'progress' ? null : 'progress'))
                  })
                }}
              >
                <div className="text-lg font-bold text-[#FF7939]">{clientDetail?.client?.progress || selectedClient.progress}%</div>
                <div className="text-xs text-gray-400">Progreso</div>
              </button>

              <button
                className="text-center flex-1 border-l border-zinc-800"
                onClick={() => {
                  preserveModalScrollPosition(() => {
                    setActiveClientPanel((prev) => (prev === 'activities' ? null : 'activities'))
                  })
                }}
              >
                <div className="text-lg font-bold text-white">{clientDetail?.client?.activitiesCount || selectedClient.activitiesCount}</div>
                <div className="text-xs text-gray-400">Actividades</div>
              </button>

              <button
                className="text-center flex-1 border-l border-zinc-800"
                onClick={() => {
                  if (selectedClient) {
                    preserveModalScrollPosition(() => {
                      setActiveClientPanel((prev) => (prev === 'todo' ? null : 'todo'))
                      setShowTodoSection(true)
                      loadTodoTasks(selectedClient.id)
                    })
                  }
                }}
              >
                <div className="text-lg font-bold text-white">{clientDetail?.client?.todoCount || 0}</div>
                <div className="text-xs text-gray-400">To Do</div>
              </button>

              <button
                className="text-center flex-1 border-l border-zinc-800"
                onClick={() => {
                  preserveModalScrollPosition(() => {
                    setActiveClientPanel((prev) => (prev === 'revenue' ? null : 'revenue'))
                  })
                }}
              >
                <div className="text-lg font-bold text-white">
                  ${clientDetail?.client?.totalRevenue || selectedClient.totalRevenue}
                </div>
                <div className="text-xs text-gray-400">Ingresos</div>
              </button>
            </div>

            {/* Panel inline debajo de métricas (sin scroll) */}
            {activeClientPanel && (
              <div className="bg-zinc-900/60 border-b border-zinc-800 px-4 py-3">
                {activeClientPanel === 'activities' && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">Actividades compradas</div>
                    {(clientDetail?.client?.activities || []).length === 0 ? (
                      <div className="text-sm text-gray-300">Sin actividades</div>
                    ) : (
                      <div className="space-y-2">
                        {(clientDetail?.client?.activities || []).map((a: any) => {
                          const progressPercent = Number(a?.progressPercent ?? 0) || 0
                          const upToDate = !!a?.upToDate
                          const daysBehind = Number(a?.daysBehind ?? 0) || 0
                          return (
                            <div key={String(a?.enrollmentId || a?.id)} className="bg-black/30 rounded-lg px-3 py-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm text-white truncate">{a?.title || 'Actividad'}</div>
                                  <div className="text-xs text-gray-400">Estado: {a?.enrollmentStatus || '—'}</div>
                                </div>
                                <div className="text-sm font-semibold text-white flex-shrink-0">${Number(a?.paidAmount || a?.amountPaid || 0) || 0}</div>
                              </div>

                              <div className="mt-2 flex items-center justify-between">
                                <div className="text-xs text-gray-300">Progreso: <span className="text-white">{progressPercent}%</span></div>
                                <div className={`text-xs ${upToDate ? 'text-green-400' : 'text-yellow-400'}`}
                                >
                                  {upToDate ? 'Al día' : `Atrasado ${daysBehind}d`}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeClientPanel === 'todo' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-400">To Do (máx 5)</div>
                      <button
                        className="w-7 h-7 rounded-full bg-[#FF7939] text-black font-bold flex items-center justify-center"
                        onClick={() => {
                          setShowTodoInput((v) => !v)
                        }}
                        type="button"
                        title="Agregar tarea"
                      >
                        +
                      </button>
                    </div>

                    <div className="h-px w-full bg-white/10" />

                    {showTodoInput && (
                      <div className="flex gap-2">
                        <input
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          placeholder="Ej: coordinar ejercitación del viernes"
                          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FF7939]"
                          disabled={loadingTodo || (todoTasks.length >= 5)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addNewTask()
                            }
                          }}
                        />
                        <button
                          onClick={addNewTask}
                          disabled={loadingTodo || !newTask.trim() || todoTasks.length >= 5}
                          className="px-3 py-2 rounded-lg bg-[#FF7939] text-black text-sm font-semibold disabled:opacity-50"
                        >
                          Guardar
                        </button>
                      </div>
                    )}

                    {loadingTodo ? (
                      <div className="text-sm text-gray-300">Cargando...</div>
                    ) : todoTasks.length === 0 ? (
                      <div className="text-sm text-gray-300">Sin tareas</div>
                    ) : (
                      <div className="space-y-2">
                        {todoTasks.map((t, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
                            <div className="text-sm text-white pr-3">{t}</div>
                            <button
                              type="button"
                              onClick={() => completeTask(idx)}
                              className="w-5 h-5 rounded-full border border-white/30 hover:border-[#FF7939] hover:bg-[#FF7939]/20 transition-colors flex items-center justify-center shrink-0"
                              title="Completar"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeClientPanel === 'progress' && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">Progreso</div>
                    <div className="text-sm text-white">{clientDetail?.client?.progress || selectedClient.progress}%</div>
                  </div>
                )}

                {activeClientPanel === 'revenue' && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400">Ingresos</div>
                    <div className="text-sm text-white">Total: ${clientDetail?.client?.totalRevenue || selectedClient.totalRevenue}</div>
                  </div>
                )}
              </div>
            )}

            {/* Tabs - sticky debajo de estadísticas */}
            <div className="flex bg-[#1A1C1F] border-b border-zinc-800 sticky top-[60px] z-10">
            <button
              onClick={() => {
                // Guardar posición de scroll actual antes de cambiar
                if (calendarScrollRef.current) {
                  if (activeTab === 'calendar') {
                    setScrollPositions(prev => ({ ...prev, calendar: calendarScrollRef.current!.scrollTop }))
                  } else if (activeTab === 'info') {
                    setScrollPositions(prev => ({ ...prev, info: calendarScrollRef.current!.scrollTop }))
                  }
                }
                setActiveTab('calendar')
                // Hacer scroll automático hacia el calendario después del render
                setTimeout(() => {
                  if (calendarScrollRef.current && calendarContainerRef.current) {
                    const calendarTop = calendarContainerRef.current.offsetTop
                    calendarScrollRef.current.scrollTo({
                      top: calendarTop - 100, // Offset para dejar espacio arriba
                      behavior: 'smooth'
                    })
                  }
                }, 100)
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'text-[#FF7939] border-b-2 border-[#FF7939]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Calendario de actividades
            </button>
            <button
              onClick={() => {
                // Guardar posición de scroll actual antes de cambiar
                if (calendarScrollRef.current) {
                  if (activeTab === 'calendar') {
                    setScrollPositions(prev => ({ ...prev, calendar: calendarScrollRef.current!.scrollTop }))
                  } else if (activeTab === 'info') {
                    setScrollPositions(prev => ({ ...prev, info: calendarScrollRef.current!.scrollTop }))
                  }
                }
                setActiveTab('info')
                // Restaurar posición después del render
                setTimeout(() => {
                  if (calendarScrollRef.current) {
                    calendarScrollRef.current.scrollTop = scrollPositions.info
                  }
                }, 50)
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'info'
                  ? 'text-[#FF7939] border-b-2 border-[#FF7939]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Información
            </button>
          </div>

            {/* Contenido del modal - scrollable */}
            <div className="bg-black text-white pb-20">
            {loadingDetail && (
              <div className="py-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF7939] mx-auto mb-2"></div>
                <p className="text-sm text-gray-400">Cargando detalles del cliente...</p>
              </div>
            )}

            {clientDetail && clientDetail.success && (
              <>
                {/* Tab: Calendario de actividades */}
                {activeTab === 'calendar' && (
                  <div className="p-4">
                    {/* Calendario */}
                    <div className="mt-4" ref={calendarContainerRef}>
                      <ClientCalendar 
                        clientId={selectedClient.id} 
                        onDaySelected={() => {}}
                        exercisesListRef={exercisesListRef}
                      />
                    </div>
                  </div>
                )}

                {/* Tab: Información */}
                {activeTab === 'info' && (
                  <div className="p-3 space-y-2 pb-32">
                    {/* Información personal */}
                    {clientDetail.client.physicalData && (
                      <div className="bg-zinc-900/40 rounded-lg p-3 space-y-2">
                        <h4 className="text-sm font-semibold text-white mb-2">Información Personal</h4>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {/* Edad */}
                          {clientDetail.client.physicalData.age && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-[#FF7939] flex-shrink-0" />
                              <div>
                                <div className="text-xs text-gray-400">Edad</div>
                                <div className="text-xs text-white font-medium">{clientDetail.client.physicalData.age} años</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Género */}
                          {clientDetail.client.physicalData.gender && (
                            <div className="flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-[#FF7939] flex-shrink-0" />
                              <div>
                                <div className="text-xs text-gray-400">Género</div>
                                <div className="text-xs text-white font-medium">
                                  {clientDetail.client.physicalData.gender === 'male' ? 'Masculino' : 
                                   clientDetail.client.physicalData.gender === 'female' ? 'Femenino' : 
                                   clientDetail.client.physicalData.gender}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Peso */}
                          {clientDetail.client.physicalData.weight && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-3.5 w-3.5 text-[#FF7939] flex-shrink-0" />
                              <div>
                                <div className="text-xs text-gray-400">Peso</div>
                                <div className="text-xs text-white font-medium">{clientDetail.client.physicalData.weight} kg</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Altura */}
                          {clientDetail.client.physicalData.height && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-3.5 w-3.5 text-[#FF7939] flex-shrink-0" />
                              <div>
                                <div className="text-xs text-gray-400">Altura</div>
                                <div className="text-xs text-white font-medium">{clientDetail.client.physicalData.height} cm</div>
                              </div>
                            </div>
                          )}
                          
                          {/* IMC */}
                          {clientDetail.client.physicalData.bmi && (
                            <div className="flex items-center gap-2">
                              <Target className="h-3.5 w-3.5 text-[#FF7939] flex-shrink-0" />
                              <div>
                                <div className="text-xs text-gray-400">IMC</div>
                                <div className="text-xs text-white font-medium">{clientDetail.client.physicalData.bmi}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Ubicación */}
                          {clientDetail.client.physicalData.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-[#FF7939] flex-shrink-0" />
                              <div>
                                <div className="text-xs text-gray-400">Ubicación</div>
                                <div className="text-xs text-white font-medium">{clientDetail.client.physicalData.location}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Teléfono */}
                        {clientDetail.client.physicalData.phone && (
                          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                            <MessageSquare className="h-3.5 w-3.5 text-[#FF7939] flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-400">Teléfono</div>
                              <div className="text-xs text-white font-medium">{clientDetail.client.physicalData.phone}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Contacto de emergencia */}
                        {clientDetail.client.physicalData.emergencyContact && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-[#FF7939] flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-400">Contacto de emergencia</div>
                              <div className="text-xs text-white font-medium">{clientDetail.client.physicalData.emergencyContact}</div>
                            </div>
                          </div>
                        )}
                        
                        {/* Nivel de actividad */}
                        {clientDetail.client.physicalData.activityLevel && (
                          <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                            <TrendingUp className="h-3.5 w-3.5 text-[#FF7939] flex-shrink-0" />
                            <div>
                              <div className="text-xs text-gray-400">Nivel de actividad</div>
                              <div className="text-xs text-white font-medium">
                                {clientDetail.client.physicalData.activityLevel === 'sedentary' ? 'Sedentario' :
                                 clientDetail.client.physicalData.activityLevel === 'lightly_active' ? 'Ligeramente activo' :
                                 clientDetail.client.physicalData.activityLevel === 'moderately_active' ? 'Moderadamente activo' :
                                 clientDetail.client.physicalData.activityLevel === 'very_active' ? 'Muy activo' :
                                 clientDetail.client.physicalData.activityLevel === 'extremely_active' ? 'Extremadamente activo' :
                                 clientDetail.client.physicalData.activityLevel}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Fitness Goals */}
                        {clientDetail.client.physicalData.fitnessGoals && clientDetail.client.physicalData.fitnessGoals.length > 0 && (
                          <div className="pt-2 border-t border-zinc-800">
                            <div className="text-xs text-gray-400 mb-1">Objetivos de fitness</div>
                            <div className="flex flex-wrap gap-1">
                              {clientDetail.client.physicalData.fitnessGoals.map((goal: string, index: number) => (
                                <span key={index} className="text-xs px-2 py-1 bg-[#FF7939]/20 text-[#FF7939] rounded">
                                  {goal}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Descripción */}
                        {clientDetail.client.physicalData.description && (
                          <div className="pt-2 border-t border-zinc-800">
                            <div className="text-xs text-gray-400 mb-1">Descripción</div>
                            <div className="text-xs text-white leading-relaxed">{clientDetail.client.physicalData.description}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lesiones */}
                    {clientDetail.client.injuries && clientDetail.client.injuries.length > 0 && (
                      <div className="bg-zinc-900/40 rounded-lg">
                        <div 
                          className="flex items-center justify-between p-2 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                          onClick={() => setShowInjuries(!showInjuries)}
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-300">Lesiones ({clientDetail.client.injuries.length})</span>
                          </div>
                          <div className="text-xs text-gray-500">{showInjuries ? 'Ocultar' : 'Ver'}</div>
                        </div>
                        {showInjuries && (
                          <div className="px-2 pb-2 space-y-1.5">
                            {clientDetail.client.injuries.map((injury: any, index: number) => (
                              <div key={index} className="p-2 bg-zinc-800/50 rounded">
                                <div className="flex justify-between items-center mb-1">
                                  <div className="font-medium text-xs">{injury.name}</div>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    injury.severity === 'high' ? 'bg-red-900/50 text-red-400' :
                                    injury.severity === 'medium' ? 'bg-yellow-900/50 text-yellow-400' :
                                    'bg-green-900/50 text-green-400'
                                  }`}>
                                    {injury.severity === 'high' ? 'Alta' : injury.severity === 'medium' ? 'Media' : 'Baja'}
                                  </span>
                                </div>
                                {(injury.muscle_name || injury.pain_level) && (
                                  <div className="space-y-0.5 text-xs text-gray-300">
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
                                {injury.description && (
                                  <div className="mt-1.5 text-xs text-gray-400 bg-zinc-900/30 p-1.5 rounded">
                                    {injury.description}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Biométricas */}
                    {clientDetail.client.biometrics && clientDetail.client.biometrics.length > 0 && (
                      <div className="bg-zinc-900/40 rounded-lg">
                        <div 
                          className="flex items-center justify-between p-2 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                          onClick={() => setShowBiometrics(!showBiometrics)}
                        >
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs font-medium text-gray-300">Biométricas ({clientDetail.client.biometrics.length})</span>
                          </div>
                          <div className="text-xs text-gray-500">{showBiometrics ? 'Ocultar' : 'Ver'}</div>
                        </div>
                        {showBiometrics && (
                          <div className="px-2 pb-2 space-y-0.5">
                            {clientDetail.client.biometrics.map((biometric: any, index: number) => (
                              <div key={index} className="flex justify-between items-center py-1.5 px-2 bg-zinc-800/50 rounded">
                                <div className="font-medium text-xs">{biometric.name}</div>
                                <div className="text-xs font-semibold text-white">
                                  {biometric.value} {biometric.unit}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Objetivos */}
                    {clientDetail.client.objectives && clientDetail.client.objectives.length > 0 && (
                      <div className="bg-zinc-900/40 rounded-lg">
                        <div 
                          className="flex items-center justify-between p-2 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                          onClick={() => setShowObjectives(!showObjectives)}
                        >
                          <div className="flex items-center gap-2">
                            <Target className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-xs font-medium text-gray-300">Objetivos ({clientDetail.client.objectives.length})</span>
                          </div>
                          <div className="text-xs text-gray-500">{showObjectives ? 'Ocultar' : 'Ver'}</div>
                        </div>
                        {showObjectives && (
                          <div className="px-2 pb-2 space-y-0.5">
                            {clientDetail.client.objectives.map((objective: any, index: number) => (
                              <div key={index} className="py-1.5 px-2 bg-zinc-800/50 rounded">
                                <div className="font-medium text-xs mb-0.5">{objective.exercise_title}</div>
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
                )}
              </>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
