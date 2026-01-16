"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  MoreVertical,
  X,
  MessageSquare,
  Calendar,
  Users,
  TrendingUp,
  Target,
  MapPin,
  AlertTriangle,
  Ruler,
  Weight,
  Clock,
  Activity,
  FileText
} from "lucide-react"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
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

const calculateAge = (birthDate: string | null) => {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
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
  const [activeTab, setActiveTab] = useState<'calendar' | 'info'>('info')
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
              className="bg-[#141414] rounded-3xl p-4 border border-zinc-800/60 shadow-sm cursor-pointer hover:bg-[#181818] transition-colors flex flex-col items-center"
              onClick={() => openClientModal(client)}
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-800 shadow-xl mb-2">
                <img
                  src={client.avatar_url || "/placeholder.svg"}
                  alt={client.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex flex-col items-center mb-0">
                <h3 className="font-semibold text-base text-white mb-0.5 text-center leading-tight">{client.name}</h3>
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${client.status === "active" ? "bg-green-500" : client.status === "pending" ? "bg-yellow-500" : "bg-gray-500"}`}></span>
                  <span className="truncate">Última: {client.lastActive}</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-4 gap-1 items-start mt-2">
                {/* Progreso - Elevado (Col 1) */}
                <div className="flex flex-col items-center justify-start pt-0">
                  <div className="text-base font-bold text-[#FF7939] leading-tight">{client.progress}%</div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wide scale-90">Progreso</div>
                </div>

                {/* Actividades - Bajo (Col 2) */}
                <div className="flex flex-col items-center justify-start pt-3 border-l border-zinc-800/50 h-full">
                  <div className="text-base font-bold text-white leading-tight">{client.activitiesCount}</div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wide scale-90">Actividades</div>
                </div>

                {/* To Do - Bajo (Col 3) */}
                <div className="flex flex-col items-center justify-start pt-3 border-l border-zinc-800/50 h-full">
                  <div className="text-base font-bold text-white leading-tight">{client.todoCount || 0}</div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wide scale-90">To Do</div>
                </div>

                {/* Ingresos - Elevado (Col 4) */}
                <div className="flex flex-col items-center justify-start pt-0 border-l border-zinc-800/50">
                  <div className="text-xs font-bold text-white leading-tight mt-0.5">${client.totalRevenue}</div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-wide scale-90 mt-0.5">Ingresos</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal del cliente - Pantalla completa */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black z-30 flex flex-col">
          {/* Contenedor scrollable */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto" ref={calendarScrollRef}>
            {/* Header con imagen centrada y blur de fondo */}
            {/* Header con imagen centrada (sin fondo) */}
            <div className="relative bg-black pt-20 pb-4 px-4 mt-6">
              {/* Contenido */}
              <div className="relative z-10">
                {/* Botón cerrar */}
                <button
                  onClick={closeClientModal}
                  className="absolute top-0 right-0 p-2 hover:bg-black/20 rounded-full transition-colors z-30"
                >
                  <X className="h-5 w-5 text-white" />
                </button>

                {/* Contenedor Flex: Calendar - Foto - Messages */}
                <div className="flex items-center justify-center gap-6 mb-3">

                  {/* Botón Calendar */}
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-sm hover:bg-white/15 transition-colors"
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
                    <Calendar className="h-5 w-5 text-white/85" />
                  </button>

                  {/* Foto de perfil */}
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-zinc-800 shadow-xl">
                    <img
                      src={selectedClient.avatar_url || "/placeholder.svg"}
                      alt={selectedClient.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Botón Messages */}
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shadow-sm hover:bg-white/15 transition-colors"
                    title="Mensajes"
                    onClick={() => {
                      /* Navegar a mensajes */
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
                    <MessageSquare className="h-5 w-5 text-white/85" />
                  </button>
                </div>

                {/* Nombre y Detalles debajo */}
                <div className="flex flex-col items-center w-full max-w-[300px]">
                  <h3 className="font-semibold text-xl text-white mb-2 text-center">{selectedClient.name}</h3>

                  {/* Ubicación y Edad */}
                  <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
                    {clientDetail?.client?.physicalData?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{clientDetail.client.physicalData.location}</span>
                      </div>
                    )}
                    {(clientDetail?.client?.physicalData?.birth_date || clientDetail?.client?.physicalData?.age) && (
                      <div className="flex items-center gap-1">
                        <span>
                          {clientDetail.client.physicalData?.birth_date
                            ? calculateAge(clientDetail.client.physicalData.birth_date)
                            : clientDetail.client.physicalData?.age} años
                        </span>
                      </div>
                    )}
                    {/* Fallback si no hay datos aun */}
                    {!clientDetail?.client?.physicalData?.location && !clientDetail?.client?.physicalData?.birth_date && !clientDetail?.client?.physicalData?.age && (
                      <div className="flex items-center gap-1 opacity-50">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>Sin ubicación</span>
                      </div>
                    )}
                  </div>

                  {/* Peso y Altura */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Weight className="h-3.5 w-3.5" />
                      <span className="text-white font-medium">{clientDetail?.client?.physicalData?.weight || '-'} kg</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Ruler className="h-3.5 w-3.5" />
                      <span className="text-white font-medium">{clientDetail?.client?.physicalData?.height || '-'} cm</span>
                    </div>
                  </div>

                  {/* Objetivos y Deportes (Scrollable Row) */}
                  <div className="w-full overflow-x-auto scrollbar-hide flex justify-center">
                    <div className="flex items-center gap-2 px-4 whitespace-nowrap">
                      {/* Goals */}
                      {clientDetail?.client?.physicalData?.fitness_goals?.map((g: string, i: number) => (
                        <div key={`g-${i}`} className="px-3 py-1 rounded-full bg-[#FF7939]/10 border border-[#FF7939]/30 text-[#FF7939] text-[10px] uppercase font-bold tracking-wider">
                          {g}
                        </div>
                      ))}
                      {/* Sports */}
                      {clientDetail?.client?.physicalData?.sports?.map((s: string, i: number) => (
                        <div key={`s-${i}`} className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] uppercase font-bold tracking-wider">
                          {s}
                        </div>
                      ))}
                      {(!clientDetail?.client?.physicalData?.fitness_goals?.length && !clientDetail?.client?.physicalData?.sports?.length) && (
                        <span className="text-xs text-gray-600 italic">Sin objetivos definidos</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Estadísticas - fondo transparente (usando layout) */}
            <div className="bg-transparent px-4 pt-1 pb-6 sticky top-0 z-20 backdrop-blur-sm">
              <div className="grid grid-cols-4 gap-2 items-start">

                {/* Progreso (Esquina Izq - Arriba) */}
                <div className=" p-2 flex flex-col items-center justify-center h-20 shadow-sm relative z-10">
                  <div className="text-lg font-bold text-[#FF7939]">{clientDetail?.client?.progress || selectedClient.progress}%</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">Progreso</div>
                </div>

                {/* Actividades (Centro - Abajo con flecha) */}
                <button
                  className="mt-4 p-2 flex flex-col items-center justify-center h-20 shadow-sm relative group active:scale-95 transition-all"
                  onClick={() => {
                    preserveModalScrollPosition(() => {
                      setActiveClientPanel((prev) => (prev === 'activities' ? null : 'activities'))
                    })
                  }}
                >
                  <div className="text-lg font-bold text-white">{clientDetail?.client?.activitiesCount || selectedClient.activitiesCount}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Actividades</div>
                  <div className="absolute -bottom-2.5">
                    <svg className={`w-4 h-4 text-[#FF7939] transition-transform duration-300 ${activeClientPanel === 'activities' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* To Do (Centro - Abajo con flecha) */}
                <button
                  className="mt-4 p-2 flex flex-col items-center justify-center h-20 shadow-sm relative group active:scale-95 transition-all"
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
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">To Do</div>
                  <div className="absolute -bottom-2.5">
                    <svg className={`w-4 h-4 text-[#FF7939] transition-transform duration-300 ${activeClientPanel === 'todo' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Ingresos (Esquina Der - Arriba) */}
                <div className="p-2 flex flex-col items-center justify-center h-20 shadow-sm relative z-10">
                  <div className="text-sm font-bold text-white">
                    ${clientDetail?.client?.totalRevenue || selectedClient.totalRevenue}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">Ingresos</div>
                </div>

              </div>
            </div>

            {/* Panel inline debajo de métricas (sin scroll) */}
            {activeClientPanel && (
              <div className="bg-transparent border-b border-zinc-800 px-4 py-3">
                {activeClientPanel === 'activities' && (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                      {clientDetail?.client?.physicalData?.meet_credits || 0} Créditos de Meet
                    </div>
                    {(clientDetail?.client?.activities || []).length === 0 ? (
                      <div className="text-sm text-gray-300 italic">Sin actividades activas</div>
                    ) : (
                      <div className="space-y-3">
                        {(clientDetail?.client?.activities || []).map((a: any, index: number) => {
                          const progressPercent = Number(a?.progressPercent ?? 0) || 0
                          const upToDate = !!a?.upToDate
                          const daysBehind = Number(a?.daysBehind ?? 0) || 0
                          const pendingItems = Number(a?.pendingItems ?? 0) || 0
                          const daysWithPending = Number(a?.daysWithPending ?? 0) || 0

                          return (
                            <div key={`act-${a.id}-idx-${index}`} className="group relative bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 pl-4 shadow-sm overflow-hidden">
                              {/* Status Vertical Line Indicator */}
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${(() => {
                                const now = new Date();
                                const start = a?.enrollmentStartDate ? new Date(a.enrollmentStartDate) : null;
                                const end = a?.enrollmentExpirationDate ? new Date(a.enrollmentExpirationDate) : null;
                                const isCompleted = progressPercent >= 100 || a?.status === 'finalizada'; // Check status too
                                const isNotStarted = start && start > now;
                                const isExpired = end && end < now && !isCompleted;

                                if (isCompleted) return 'bg-[#FF7939]'; // Orange for Finalizado (Requested change)
                                if (isNotStarted) return 'bg-yellow-500';
                                if (upToDate) return 'bg-[#FF7939]'; // Orange for 'Al día'
                                if (isExpired) return 'bg-zinc-600';
                                return 'bg-red-500'; // Red for Alert/Pending
                              })()
                                }`} />

                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-white leading-tight mb-1">{a?.title || 'Actividad'}</div>
                                  <div className="text-xs text-gray-400 capitalize">
                                    {a?.enrollmentStartDate && (
                                      <span className="text-gray-500 text-[10px] leading-none block mt-0.5">
                                        {format(new Date(a.enrollmentStartDate), "d MMM", { locale: es })}
                                        {a?.enrollmentExpirationDate ? ` - ${format(new Date(a.enrollmentExpirationDate), "d MMM", { locale: es })}` : ''}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm font-medium text-gray-500/80">
                                  ${Number(a?.paidAmount || a?.amountPaid || 0)}
                                </div>
                              </div>

                              {/* Progress Section */}
                              {!(() => {
                                const isCompleted = progressPercent >= 100 || a?.status === 'finalizada';
                                return isCompleted;
                              })() ? (
                                <div className="mt-2 flex items-center gap-3">
                                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${(() => {
                                        // Match bar color to vertical line
                                        const now = new Date();
                                        const start = a?.enrollmentStartDate ? new Date(a.enrollmentStartDate) : null;
                                        const end = a?.enrollmentExpirationDate ? new Date(a.enrollmentExpirationDate) : null;
                                        const isCompleted = progressPercent >= 100 || a?.status === 'finalizada';
                                        const isNotStarted = start && start > now;
                                        const isExpired = end && end < now && !isCompleted;

                                        if (isCompleted) return 'bg-[#FF7939]';
                                        if (isNotStarted) return 'bg-yellow-500';
                                        if (upToDate) return 'bg-[#FF7939]';
                                        if (isExpired) return 'bg-zinc-600';
                                        return 'bg-red-500';
                                      })()
                                        }`}
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-zinc-400">{progressPercent}%</span>
                                </div>
                              ) : (
                                <div className="mt-2 flex items-center justify-between">
                                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full border bg-orange-500/10 border-orange-500/20">
                                    <span className="text-[10px] uppercase tracking-wide font-semibold text-orange-300">Finalizado</span>
                                  </div>
                                  <span className="text-xs font-bold text-[#FF7939]">{progressPercent}%</span>
                                </div>
                              )}

                              {(() => {
                                // Status Logic
                                let badgeBg = 'bg-zinc-800 border-zinc-700'
                                let badgeText = 'text-gray-300'
                                let icon = null
                                let statusLabel = ''

                                const now = new Date();
                                const start = a?.enrollmentStartDate ? new Date(a.enrollmentStartDate) : null;
                                const end = a?.enrollmentExpirationDate ? new Date(a.enrollmentExpirationDate) : null;

                                const isCompleted = progressPercent >= 100 || a?.status === 'finalizada';
                                const isNotStarted = start && start > now;
                                const isExpired = end && end < now && !isCompleted;

                                if (isCompleted) {
                                  // Already handled in the progress block above
                                  return null;
                                }

                                if (isNotStarted) {
                                  statusLabel = 'No iniciado';
                                  badgeBg = 'bg-yellow-500/10 border-yellow-500/20';
                                  badgeText = 'text-yellow-500';
                                } else if (upToDate) {
                                  statusLabel = 'Al día';
                                  badgeBg = 'bg-orange-500/10 border-orange-500/20';
                                  badgeText = 'text-orange-300';
                                  // Removed Icon as requested
                                } else if (isExpired) {
                                  statusLabel = 'Expirada';
                                  badgeBg = 'bg-zinc-800 border-zinc-700';
                                  badgeText = 'text-zinc-500';
                                  icon = (
                                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  );
                                } else {
                                  // Pending / Warning State
                                  statusLabel = `${daysWithPending || daysBehind} días pendientes • ${pendingItems} items`;
                                  badgeBg = 'bg-red-500/10 border-red-900/50';
                                  badgeText = 'text-red-500';
                                  icon = (
                                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                  );
                                }

                                return (
                                  <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                                    {icon}
                                    <span className={`text-[10px] uppercase tracking-wide font-semibold ${badgeText}`}>
                                      {statusLabel}
                                    </span>
                                  </div>
                                )
                              })()}
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
            <div className="flex bg-transparent border-b border-zinc-800 sticky top-[60px] z-10">
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
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'calendar'
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
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'info'
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
                      <div className="mt-4 w-full overflow-hidden" ref={calendarContainerRef}>
                        <ClientCalendar
                          clientId={selectedClient.id}
                          onDaySelected={() => { }}
                          exercisesListRef={exercisesListRef}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tab: Información */}
                  {activeTab === 'info' && (
                    <div className="p-4 space-y-6 pb-32">

                      {/* 1. Resumen Físico (Minimalista) */}
                      <div className="grid grid-cols-4 gap-3">
                        {/* Edad */}
                        <div className="bg-[#141414] border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Edad</span>
                          <div className="flex items-center gap-1.5 justify-center">
                            <span className="text-lg font-bold text-white">
                              {clientDetail.client.physicalData?.birth_date
                                ? calculateAge(clientDetail.client.physicalData.birth_date)
                                : (clientDetail.client.physicalData?.age || '-')}
                            </span>
                            <span className="text-xs font-normal text-gray-500">años</span>
                          </div>
                        </div>

                        {/* Peso */}
                        <div className="bg-[#141414] border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Peso</span>
                          <div className="flex items-center gap-1.5 justify-center">
                            <span className="text-lg font-bold text-white">{clientDetail.client.physicalData?.weight || '-'}</span>
                            <span className="text-xs font-normal text-gray-500">kg</span>
                          </div>
                        </div>

                        {/* Altura */}
                        <div className="bg-[#141414] border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Altura</span>
                          <div className="flex items-center gap-1.5 justify-center">
                            <span className="text-lg font-bold text-white">{clientDetail.client.physicalData?.height || '-'}</span>
                            <span className="text-xs font-normal text-gray-500">cm</span>
                          </div>
                        </div>

                        {/* Nivel Actividad */}
                        <div className="bg-[#141414] border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Actividad</span>
                          <div className="flex items-center gap-1.5 justify-center">
                            <span className="text-sm font-bold text-white truncate max-w-full">
                              {clientDetail.client.physicalData?.nivel_actividad || '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 2. Descripción (Notas moved here) */}
                      {clientDetail.client.physicalData?.description && (
                        <div>
                          <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Descripción</h3>
                          <div className="bg-[#141414] border border-zinc-800 rounded-xl p-4">
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {clientDetail.client.physicalData.description}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-6">

                        {/* Fitness Goals (Objetivos) - Pills Style */}
                        {clientDetail.client.physicalData?.fitness_goals && clientDetail.client.physicalData.fitness_goals.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Objetivos
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {clientDetail.client.physicalData.fitness_goals.map((goal: string, index: number) => (
                                <div
                                  key={index}
                                  className="px-3 py-1.5 rounded-full border border-[#FF7939]/30 bg-[#FF7939]/10 text-[#FF7939] text-xs font-medium"
                                >
                                  {goal}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Lesiones */}
                        {clientDetail.client.injuries && clientDetail.client.injuries.length > 0 && (
                          <div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" />
                                Lesiones
                              </h3>
                              <div className="space-y-2">
                                {clientDetail.client.injuries.map((injury: any, index: number) => (
                                  <div key={index} className="bg-[#141414] rounded-xl p-3 border border-zinc-900">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-sm font-semibold text-white">{injury.name}</span>
                                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${injury.severity === 'high' ? 'bg-red-500/10 text-red-500' :
                                        injury.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                                        }`}>
                                        {injury.severity === 'high' ? 'Alta' : injury.severity === 'medium' ? 'Media' : 'Baja'}
                                      </span>
                                    </div>
                                    {injury.description && (
                                      <p className="text-xs text-gray-500 leading-relaxed">
                                        {injury.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 4. Información Adicional (Bio, Contacto) */}
                        <div>
                          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Más Detalles
                          </h3>
                          <div className="divide-y divide-zinc-800 bg-[#141414] rounded-xl border border-zinc-800 overflow-hidden">
                            {/* Ubicación */}
                            {clientDetail.client.physicalData?.location && (
                              <div className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <MapPin className="h-4 w-4" />
                                  <span className="text-xs">Ubicación</span>
                                </div>
                                <span className="text-sm text-white">{clientDetail.client.physicalData.location}</span>
                              </div>
                            )}

                            {/* Email */}
                            <div className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-gray-400">
                                <div className="w-4 flex justify-center font-bold">@</div>
                                <span className="text-xs">Email</span>
                              </div>
                              <span className="text-sm text-white">{clientDetail.client.email}</span>
                            </div>

                            {/* Teléfono */}
                            {clientDetail.client.physicalData?.phone && (
                              <div className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-gray-400">
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="text-xs">Teléfono</span>
                                </div>
                                <span className="text-sm text-white">{clientDetail.client.physicalData.phone}</span>
                              </div>
                            )}

                            {/* Contacto Emergencia */}
                            {clientDetail.client.physicalData?.emergencyContact && (
                              <div className="p-3 flex items-center justify-between bg-red-500/5">
                                <div className="flex items-center gap-2 text-red-400">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-xs font-medium">Emergencia</span>
                                </div>
                                <span className="text-sm text-white">{clientDetail.client.physicalData.emergencyContact}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )
      }
    </div >
  )
}
