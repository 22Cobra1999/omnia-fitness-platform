"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from 'next/navigation'
import { Search, Filter, Calendar as CalendarIcon, ChevronRight, MessageCircle, MoreVertical, X, Phone, Mail, MapPin, Target, AlertTriangle, FileText, ArrowUp, ArrowDown, Activity, Users, Weight, Ruler, Plus, Check, Bell, Droplets, Bone, Flame, Dumbbell, Edit2 } from 'lucide-react'
import { ExerciseProgressList } from './exercise-progress-list'
import { PurchasedActivityCard } from "@/components/activities/purchased-activity-card"
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
  description?: string
  activities: Array<{
    id: number
    title: string
    type: string
    amountPaid: number
  }>
  hasAlert?: boolean
  alertLevel?: number
  alertLabel?: string
  age?: number
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
  const [activeModalTab, setActiveModalTab] = useState<'calendar' | 'info' | 'activities'>('activities')
  const [activeClientPanel, setActiveClientPanel] = useState<'activities' | 'todo' | 'progress' | 'revenue' | null>(null)

  // Coach editing states
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isEditingObjectives, setIsEditingObjectives] = useState(false)
  const [savingObjectives, setSavingObjectives] = useState(false)
  const objectivesListRef = useRef<any>(null)
  const [tempBioData, setTempBioData] = useState<any>({ weight: '', height: '', biometrics: [] })
  const [savingBio, setSavingBio] = useState(false)
  const [showTodoInput, setShowTodoInput] = useState(false)
  const [hiddenActivities, setHiddenActivities] = useState<Set<number>>(new Set())
  const [activitySubTab, setActivitySubTab] = useState<'en-curso' | 'por-empezar' | 'finalizadas'>('en-curso')
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

        console.log('👤 ClientsScreen: Respuesta /api/coach/clients', {
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
            console.log('👤 ClientsScreen: Clientes cargados', data.clients.map((client: any) => ({
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
        // Assuming activitiesDetails, injuriesRes, biometricsRes, objectivesRes are available in this scope or fetched here
        // For the purpose of this change, I'm adding placeholder values or assuming they exist.
        // In a real scenario, these would need to be fetched or derived.
        const activitiesDetails: any[] = data.client.activities || []; // Placeholder
        const injuriesRes: any = { data: data.client.injuries || [] }; // Placeholder
        const biometricsRes: any = { data: data.client.biometrics || [] }; // Placeholder
        const objectivesRes: any = { data: data.client.objectives || [] }; // Placeholder

        console.log('👤 ClientsScreen: Detalles del cliente cargados', {
          id: data.client.id,
          name: data.client.name,
          progress: activitiesDetails.length > 0 ? Math.round(activitiesDetails.reduce((acc: any, a: any) => acc + (a.progressPercent || 0), 0) / activitiesDetails.length) : 0,
          injuries: injuriesRes.data || [],
          biometrics: biometricsRes.data || [],
          objectives: (objectivesRes.data || []).map((obj: any) => ({
            ...obj,
            progress_percentage: obj.objective > 0 ? Math.round((obj.current_value / obj.objective) * 100) : 0
          })),
          totalRevenue: activitiesDetails.reduce((acc: any, a: any) => acc + (Number(a.amount_paid) || 0), 0),
          todoCount: data.client.todoCount,
          program_end_date: data.client.program_end_date // Added this line
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedClient) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [selectedClient])

  // Función para guardar biometría
  const handleSaveBio = async () => {
    if (!selectedClient) return
    setSavingBio(true)
    try {
      const resp = await fetch(`/api/coach/clients/${selectedClient.id}/biometrics`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempBioData)
      })
      if (resp.ok) {
        setClientDetail((prev: any) => ({
          ...prev,
          client: {
            ...prev.client,
            physicalData: {
              ...prev.client.physicalData,
              weight: tempBioData.weight,
              height: tempBioData.height
            },
            biometrics: tempBioData.biometrics
          }
        }))
        setIsEditingBio(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingBio(false)
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

      {/* Client list - Redesigned as a vertical grid (Aligned Left) */}
      <div className="grid grid-cols-3 gap-3 w-full">
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
              className="bg-[#141414] rounded-2xl overflow-hidden border border-zinc-800/80 shadow-lg cursor-pointer hover:bg-[#181818] transition-all hover:border-[#FF7939]/30 flex flex-col group"
              onClick={() => openClientModal(client)}
            >
              {/* Card Header/Hero area */}
              <div className="relative h-24 bg-zinc-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-800/20 to-black/40"></div>

                {/* Alert Badge (Top Left) */}
                {client.hasAlert && (
                  <div className="absolute top-2 left-2 z-20">
                    <div className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter border shadow-lg ${client.alertLevel === 3 ? "bg-red-500/20 text-red-500 border-red-500/30" :
                      client.alertLevel === 2 ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                        "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                      }`}>
                      {client.alertLabel || 'Alerta'}
                    </div>
                  </div>
                )}

                {/* Status Badge (Top Right) */}
                <div className="absolute top-2 right-2 z-20">
                  <div className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter border shadow-lg ${client.status === "active" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                    client.status === "pending" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/20" :
                      "bg-gray-500/20 text-gray-400 border-gray-500/20"
                    }`}>
                    {client.status === "active" ? "Activo" : client.status === "pending" ? "Pendiente" : "Inactivo"}
                  </div>
                </div>

                {/* Large Avatar */}
                <div className="relative z-10 w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-800 shadow-xl group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={client.avatar_url || "/placeholder.svg"}
                    alt={client.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 flex-1 flex flex-col">
                <div className="text-center mb-3">
                  <h3 className="font-bold text-sm text-white truncate leading-tight mb-1">{client.name}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-[9px] text-gray-400">
                    <span className="truncate">Última: {client.lastActive}</span>
                    {(client.age || 0) > 0 && (
                      <>
                        <span className="opacity-40">•</span>
                        <span>{client.age} años</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Section */}
                <div className="mt-4 mb-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-orange-400 font-bold uppercase tracking-tighter text-[7px] opacity-80">Progreso</span>
                    <span className="text-orange-400 font-black text-xs">{client.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF7939] rounded-full shadow-[0_0_8px_rgba(255,121,57,0.4)] transition-all duration-500"
                      style={{ width: `${client.progress}%` }}
                    />
                  </div>
                </div>

                {/* Footer Stats Grid */}
                <div className="grid grid-cols-3 gap-1 mt-4 pt-3 border-t border-zinc-800/60">
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-bold text-white">{client.activitiesCount}</span>
                    <span className="text-[7px] text-gray-500 uppercase font-medium">Acts</span>
                  </div>
                  <div className="flex flex-col items-center border-l border-zinc-800/40">
                    <span className="text-[11px] font-bold text-white">{client.todoCount || 0}</span>
                    <span className="text-[7px] text-gray-500 uppercase font-medium">Tareas</span>
                  </div>
                  <div className="flex flex-col items-center border-l border-zinc-800/40">
                    <span className="text-[11px] font-bold text-white">${(() => {
                      const val = Math.round(client.totalRevenue);
                      return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val;
                    })()}</span>
                    <span className="text-[7px] text-gray-400 uppercase font-bold">Ingr</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal del cliente - Pantalla completa */}
      {
        selectedClient && (
          <div className="fixed inset-0 bg-black z-30 flex flex-col">

            {/* --- FIXED HEADER BUTTONS (Pinned to Corners) --- */}
            <div className="absolute top-20 left-2 z-[100]">
              {/* Botón Notificaciones */}
              <div className="relative">
                <button
                  type="button"
                  className="p-2 rounded-full transition-colors border border-zinc-800 bg-[#1c1c1c] hover:bg-zinc-800 group"
                  onClick={() => {
                    setShowTodoSection(prev => !prev)
                    if (!showTodoSection && selectedClient) {
                      loadTodoTasks(selectedClient.id)
                    }
                  }}
                  title="Notificaciones / To Do"
                >
                  <Bell className="h-4 w-4 text-[#FF7939] group-hover:text-white transition-colors" />
                  {selectedClient?.todoCount && selectedClient.todoCount > 0 ? (
                    <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-[#FF7939] rounded-full border border-black flex items-center justify-center">
                      <span className="text-[9px] font-bold text-black leading-none">
                        {selectedClient.todoCount > 9 ? '9+' : selectedClient.todoCount}
                      </span>
                    </div>
                  ) : null}
                </button>

                {/* Dropdown Notificaciones - Fixed position override for visibility */}
                {showTodoSection && (
                  <div className="absolute top-12 left-0 w-80 bg-[#1c1c1c] border border-zinc-800 rounded-2xl shadow-2xl z-50 p-4 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-white font-[var(--font-anton)] tracking-wide">PENDIENTES</span>
                      <button
                        className="w-6 h-6 rounded-full bg-[#FF7939] text-black font-bold flex items-center justify-center text-sm hover:bg-[#ff8f5a] transition-colors"
                        onClick={() => setShowTodoInput(v => !v)}
                      >
                        +
                      </button>
                    </div>
                    {/* Rest of todo content logic... keeping simplified for move, assumed state handles render */}
                    {showTodoInput && (
                      <div className="flex gap-2 mb-3">
                        <input
                          value={newTask}
                          onChange={(e) => setNewTask(e.target.value)}
                          className="flex-1 bg-black/40 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7939]"
                          placeholder="Nueva tarea..."
                          onKeyDown={(e) => e.key === 'Enter' && addNewTask()}
                          autoFocus
                        />
                      </div>
                    )}
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {loadingTodo ? (
                        <div className="text-xs text-gray-400 text-center py-4">Cargando...</div>
                      ) : todoTasks.length === 0 ? (
                        <div className="text-xs text-zinc-500 text-center py-4 italic">No hay tareas pendientes</div>
                      ) : (
                        todoTasks.map((t, idx) => (
                          <div key={idx} className="flex items-start justify-between bg-zinc-900/50 rounded-lg p-3 hover:bg-zinc-800 transition-colors group">
                            <span className="text-sm text-gray-300 leading-snug">{t}</span>
                            <button
                              onClick={() => completeTask(idx)}
                              className="w-4 h-4 mt-0.5 rounded-full border border-zinc-600 hover:border-[#FF7939] hover:bg-[#FF7939]/20 flex-shrink-0 ml-3 transition-all"
                              title="Marcar como completado"
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute top-20 right-2 z-[100]">
              <button
                onClick={closeClientModal}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-zinc-400 hover:text-white" />
              </button>
            </div>

            {/* Contenedor scrollable */}
            <div className="flex-1 overflow-x-hidden overflow-y-auto" ref={calendarScrollRef}>
              {/* Header con imagen centrada y blur de fondo */}
              {/* Header con imagen centrada (sin fondo) */}
              <div className="relative bg-black pt-12 pb-4 px-4 mt-0">
                {/* Contenido */}
                <div className="relative z-10 w-full">





                  {/* --- CENTER: Avatar & Details --- */}
                  <div className="flex flex-col items-center w-full mt-12 sm:mt-16">
                    {/* Name (Moved to Top) */}
                    <h3 className="font-bold text-xl sm:text-2xl text-zinc-300 mb-1 text-center font-[var(--font-anton)] tracking-wide">{selectedClient.name}</h3>


                    <div className="flex items-center justify-center gap-5 sm:gap-6 mb-2">

                      {/* Botón Calendar */}
                      <button
                        type="button"
                        className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center shadow-sm hover:bg-zinc-800 transition-colors"
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
                        <CalendarIcon className="h-5 w-5 text-white/70" />
                      </button>

                      {/* Foto de perfil Squircle con Borde Roto y Badge */}
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                        {/* Badge "5" (Orange Box) */}
                        {/* Badge "5" (Flame) */}
                        <div className="absolute -bottom-2 sm:-bottom-3 z-20 flex flex-col items-center justify-center">
                          <div className="relative flex items-center justify-center">
                            <Flame className="h-8 w-8 sm:h-10 sm:w-10 text-[#FF7939] drop-shadow-lg" fill="#FF7939" strokeWidth={1.5} />
                            <span className="absolute text-black font-bold text-[10px] sm:text-xs font-[var(--font-anton)] pt-1">
                              {selectedClient.activitiesCount || 0}
                            </span>
                          </div>
                        </div>

                        {/* Image - Clean on Black Background */}
                        <div className="w-full h-full bg-black rounded-[20%] overflow-hidden relative z-10 shadow-2xl">
                          <img
                            src={selectedClient.avatar_url || "/placeholder.svg"}
                            alt={selectedClient.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Botón Messages */}
                      <button
                        type="button"
                        className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center shadow-sm hover:bg-zinc-800 transition-colors"
                        title="Mensajes"
                        onClick={() => {
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
                        <MessageCircle className="h-5 w-5 text-white/70" />
                      </button>
                    </div>

                    {/* Nombre y Detalles debajo */}
                    <div className="flex flex-col items-center w-full max-w-[300px]">


                      {/* Descripción */}
                      {(clientDetail?.client?.physicalData?.description || selectedClient.description) && (
                        <p className="text-sm text-gray-400 text-center mb-2 line-clamp-2 px-4 italic leading-relaxed">
                          {clientDetail?.client?.physicalData?.description || selectedClient.description}
                        </p>
                      )}

                      {/* Edad y Actividad (Moved Below Description) */}
                      <div className="flex items-center justify-center gap-3 mt-1 mb-4">
                        <span className="text-sm text-gray-400 font-medium">
                          {clientDetail?.client?.physicalData?.birth_date
                            ? `${calculateAge(clientDetail.client.physicalData.birth_date)} años`
                            : (clientDetail?.client?.physicalData?.age ? `${clientDetail.client.physicalData.age} años` : '-')}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-sm text-[#FF7939] font-bold capitalize tracking-wide">
                          {clientDetail?.client?.physicalData?.activityLevel || 'Avanzado'}
                        </span>
                      </div>



                      {/* NEW: Inline Stats Row (Between Desc and Age) */}
                      <div className="w-full flex justify-between items-center px-2 mb-8">
                        {/* Progreso */}
                        <div className="flex flex-col items-center">
                          <span
                            className="text-[#FF7939] text-4xl leading-none font-black drop-shadow-lg tracking-tighter"
                          >
                            {clientDetail?.client?.progress || selectedClient.progress}%
                          </span>
                          <span className="text-[8px] text-gray-400 uppercase tracking-[0.2em] font-medium mt-2">Progreso</span>
                        </div>

                        {/* Spacer / Center visual balance */}
                        <div className="w-16"></div>

                        {/* Ingresos */}
                        <div className="flex flex-col items-center">
                          <span
                            className="text-zinc-400 text-4xl leading-none font-black drop-shadow-lg tracking-tighter"
                          >
                            ${(() => {
                              const val = Math.round(clientDetail?.client?.totalRevenue || selectedClient.totalRevenue || 0);
                              return val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val;
                            })()}
                          </span>
                          <span className="text-[8px] text-zinc-500 uppercase tracking-[0.2em] font-medium mt-2">Ingresos</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* --- TABS HEADER --- */}
                <div className="bg-transparent px-4 pt-2">
                  <div className="flex relative border-b border-zinc-800 pb-0">
                    {/* Tab: Estilo Base */}
                    {['calendar', 'activities', 'info'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => {
                          setActiveModalTab(tab as any)
                          if (calendarScrollRef.current) {
                            // Scroll to hide profile header (approx 380px)
                            calendarScrollRef.current.scrollTo({ top: 450, behavior: 'smooth' })
                          }
                        }}
                        className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeModalTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {tab === 'calendar' && 'Calendario'}
                        {tab === 'info' && 'Información'}
                        {tab === 'activities' && (
                          <span>
                            {clientDetail?.client?.activitiesCount || selectedClient.activitiesCount} Actividades
                          </span>
                        )}
                      </button>
                    ))}

                    {/* Animated Line Indicator */}
                    <div
                      className="absolute bottom-0 h-[3px] bg-[#FF7939] transition-all duration-300 ease-out rounded-t-full"
                      style={{
                        left: activeModalTab === 'calendar' ? '12%' : activeModalTab === 'activities' ? '45%' : '78%',
                        width: '10%', // Short line
                        transform: 'translateX(-50%)'
                      }}
                    />
                  </div>
                </div>

                {/* Panel de Contenido por Tabs */}
                <div className="bg-transparent px-0 pt-3 pb-40 min-h-[300px]">

                  {/* --- LOADING SPINNER --- */}
                  {loadingDetail && (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7939] mb-4"></div>
                      <p className="text-zinc-500 text-xs uppercase tracking-wider">Cargando datos...</p>
                    </div>
                  )}

                  {/* --- TAB: CALENDARIO --- */}
                  <div className={!loadingDetail && activeModalTab === 'calendar' ? 'block' : 'hidden'}>
                    <div className="p-2 bg-black text-white min-h-[400px]">
                      <div className="mt-4 w-full overflow-hidden" ref={calendarContainerRef}>
                        <ClientCalendar
                          clientId={selectedClient.id}
                          onDaySelected={() => { }}
                          exercisesListRef={exercisesListRef}
                        />
                      </div>
                    </div>
                  </div>

                  {/* --- TAB: INFORMACION --- */}
                  {/* --- TAB: INFORMACION --- */}
                  <div className={!loadingDetail && activeModalTab === 'info' ? 'block' : 'hidden'}>
                    {clientDetail?.client && (
                      <div className="pt-4 space-y-6 pb-32 bg-black">
                        {/* 1. SECCIÓN BIOMETRÍA EXPANDIBLE */}
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-[#FF6A00]" />
                              <h2 className="text-sm font-semibold text-gray-200">Biometría</h2>
                            </div>
                            {isEditingBio ? (
                              <div className="flex items-center gap-2">
                                <button
                                  disabled={savingBio}
                                  onClick={() => setIsEditingBio(false)}
                                  className="p-1 px-2 rounded-lg bg-zinc-800 text-[10px] font-bold text-gray-400 hover:text-white"
                                >
                                  Cancelar
                                </button>
                                <button
                                  disabled={savingBio}
                                  onClick={handleSaveBio}
                                  className="p-1 px-2 rounded-lg bg-orange-500/20 text-[10px] font-bold text-orange-400 hover:bg-orange-500/30 flex items-center gap-1"
                                >
                                  {savingBio ? '...' : (
                                    <>
                                      <Check className="h-3 w-3" />
                                      Guardar
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setTempBioData({
                                    weight: clientDetail.client.physicalData?.weight || '',
                                    height: clientDetail.client.physicalData?.height || '',
                                    biometrics: clientDetail.client.biometrics || []
                                  })
                                  setIsEditingBio(true)
                                }}
                                className="p-1 rounded-full hover:bg-white/5 text-gray-400 transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="w-full overflow-x-auto pb-2 px-2 custom-scrollbar">
                            <div className="flex gap-2 min-w-max">
                              {/* Helper to pick icon */}
                              {(() => {
                                const getIcon = (name: string, unit: string) => {
                                  const n = name.toLowerCase();
                                  const u = unit.toLowerCase();
                                  if (n.includes('grasa') || u.includes('%')) return <Droplets className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#FF7939]" />;
                                  if (n.includes('masa') || n.includes('hueso')) return <Bone className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#FF7939]" />;
                                  if (n.includes('metabolismo') || n.includes('cal')) return <Flame className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#FF7939]" />;
                                  if (n.includes('pecho') || n.includes('cintura') || u.includes('cm')) return <Ruler className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#FF7939]" />;
                                  if (n.includes('muscula')) return <Dumbbell className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#FF7939]" />;
                                  return <Activity className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#FF7939]" />;
                                };

                                return (
                                  <>
                                    {/* Card Peso */}
                                    <div className="bg-white/5 rounded-2xl p-2.5 cursor-pointer hover:bg-white/10 transition-all duration-300 ease-out border-l-2 border-transparent hover:border-l-[#FF6A00] w-[140px] flex flex-col justify-between group overflow-hidden">
                                      <div className="flex justify-between items-start">
                                        <div className="p-1.5 bg-zinc-800/80 rounded-lg group-hover:bg-[#FF7939]/20 group-hover:text-[#FF7939] transition-colors shrink-0">
                                          <Weight className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#FF7939]" />
                                        </div>
                                        <span className="text-[10px] uppercase text-gray-400 font-bold leading-tight tracking-wider ml-2 whitespace-nowrap opacity-100 group-hover:opacity-100 transition-opacity">
                                          Peso
                                        </span>
                                      </div>
                                      <div className="flex items-baseline gap-1 mt-auto">
                                        {isEditingBio ? (
                                          <input
                                            type="number"
                                            value={tempBioData.weight || ''}
                                            onChange={(e) => setTempBioData({ ...tempBioData, weight: e.target.value })}
                                            className="bg-transparent border-b border-orange-500/30 text-lg font-bold text-white w-full focus:outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <>
                                            <span className="text-lg font-bold text-white shrink-0">{clientDetail.client.physicalData?.weight || '-'}</span>
                                            <span className="text-[10px] text-gray-500 font-medium shrink-0">kg</span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Card Altura */}
                                    <div className="bg-white/5 rounded-2xl p-2.5 cursor-pointer hover:bg-white/10 transition-all duration-300 ease-out border-l-2 border-transparent hover:border-l-[#FF6A00] w-[140px] flex flex-col justify-between group overflow-hidden">
                                      <div className="flex justify-between items-start">
                                        <div className="p-1.5 bg-zinc-800/80 rounded-lg group-hover:bg-[#FF7939]/20 group-hover:text-[#FF7939] transition-colors shrink-0">
                                          <Ruler className="h-3.5 w-3.5 text-gray-400 group-hover:text-[#FF7939]" />
                                        </div>
                                        <span className="text-[10px] uppercase text-gray-400 font-bold leading-tight tracking-wider ml-2 whitespace-nowrap">
                                          Altura
                                        </span>
                                      </div>
                                      <div className="flex items-baseline gap-1 mt-auto">
                                        {isEditingBio ? (
                                          <input
                                            type="number"
                                            value={tempBioData.height || ''}
                                            onChange={(e) => setTempBioData({ ...tempBioData, height: e.target.value })}
                                            className="bg-transparent border-b border-orange-500/30 text-lg font-bold text-white w-full focus:outline-none"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        ) : (
                                          <>
                                            <span className="text-lg font-bold text-white shrink-0">{clientDetail.client.physicalData?.height || '-'}</span>
                                            <span className="text-[10px] text-gray-500 font-medium shrink-0">cm</span>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Dynamic Biometrics */}
                                    {clientDetail.client.biometrics && clientDetail.client.biometrics.length > 0 && (
                                      clientDetail.client.biometrics.map((bio: any, bioIndex: number) => (
                                        <div key={bio.id} className="bg-white/5 rounded-2xl p-2.5 cursor-pointer hover:bg-white/10 transition-all duration-300 ease-out border-l-2 border-transparent hover:border-l-[#FF6A00] w-[140px] flex flex-col justify-between group overflow-hidden">
                                          <div className="flex items-center gap-1.5 mb-1 w-full">
                                            <div className="p-1.5 bg-zinc-800/80 rounded-lg group-hover:bg-[#FF7939]/20 group-hover:text-[#FF7939] transition-colors shrink-0">
                                              {getIcon(bio.name || '', bio.unit || '')}
                                            </div>
                                            <span className="text-[9px] uppercase text-gray-400 font-bold leading-tight tracking-wider ml-1 truncate group-hover:overflow-visible group-hover:whitespace-normal group-hover:text-clip transition-all">
                                              {bio.name}
                                            </span>
                                          </div>
                                          <div className="mt-auto">
                                            <div className="flex items-baseline gap-1">
                                              {isEditingBio ? (
                                                <input
                                                  type="number"
                                                  value={tempBioData.biometrics[bioIndex]?.value || ''}
                                                  onChange={(e) => {
                                                    const newBio = [...tempBioData.biometrics]
                                                    newBio[bioIndex].value = e.target.value
                                                    setTempBioData({ ...tempBioData, biometrics: newBio })
                                                  }}
                                                  className="bg-transparent border-b border-orange-500/30 text-lg font-bold text-white w-full focus:outline-none"
                                                  onClick={(e) => e.stopPropagation()}
                                                />
                                              ) : (
                                                <>
                                                  <span className="text-lg font-bold text-white truncate max-w-[80px]" title={bio.value}>{bio.value}</span>
                                                  <span className="text-[10px] text-gray-500 font-medium">{bio.unit}</span>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          </div>
                        </div>


                        {/* 2. SECCIÓN OBJETIVOS */}
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-[#FF6A00]" />
                              <h2 className="text-sm font-semibold text-gray-200">Objetivos</h2>
                            </div>
                            {isEditingObjectives ? (
                              <div className="flex items-center gap-2">
                                <button
                                  disabled={savingObjectives}
                                  onClick={() => {
                                    setIsEditingObjectives(false)
                                    objectivesListRef.current?.cancelEditing()
                                  }}
                                  className="p-1 px-2 rounded-lg bg-zinc-800 text-[10px] font-bold text-gray-400 hover:text-white"
                                >
                                  Cancelar
                                </button>
                                <button
                                  disabled={savingObjectives}
                                  onClick={async () => {
                                    setSavingObjectives(true)
                                    await objectivesListRef.current?.saveChanges()
                                    setSavingObjectives(false)
                                    setIsEditingObjectives(false)
                                  }}
                                  className="p-1 px-2 rounded-lg bg-orange-500/20 text-[10px] font-bold text-orange-400 hover:bg-orange-500/30 flex items-center gap-1"
                                >
                                  {savingObjectives ? '...' : (
                                    <>
                                      <Check className="h-3 w-3" />
                                      Guardar
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setIsEditingObjectives(true)}
                                className="p-1 rounded-full hover:bg-white/5 text-gray-400 transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Exercise List Horizontal */}
                          <div className="w-full px-2">
                            <ExerciseProgressList ref={objectivesListRef} userId={selectedClient.id} isEditing={isEditingObjectives} />
                          </div>
                        </div>


                        {/* SECCIÓN LESIONES */}
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-[#FF6A00]" />
                              <h2 className="text-sm font-semibold text-gray-200">Lesiones</h2>
                            </div>
                          </div>

                          <div className="bg-transparent h-[120px] w-full">
                            <div className="overflow-x-auto pb-2 px-2 custom-scrollbar">
                              <div className="flex gap-3 min-w-max">
                                {clientDetail.client.injuries && clientDetail.client.injuries.length > 0 ? (
                                  clientDetail.client.injuries.map((injury: any, index: number) => (
                                    <div
                                      key={index}
                                      className="bg-white/5 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all border-l-2 border-transparent hover:border-l-[#FF6A00] w-[140px] h-[100px] flex flex-col justify-between group"
                                    >
                                      <div className="flex justify-between items-start">
                                        <span className="text-[10px] uppercase text-gray-400 font-bold leading-tight max-w-[85%]">{injury.name}</span>
                                        <div className={`h-2 w-2 rounded-full ${injury.severity === 'high' ? 'bg-red-500' :
                                          injury.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                          }`}></div>
                                      </div>

                                      <div className="mt-auto">
                                        <span className="text-white text-sm font-bold block truncate">{injury.name}</span>
                                        <span className={`text-[10px] font-medium ${injury.severity === 'high' ? 'text-red-400' :
                                          injury.severity === 'medium' ? 'text-yellow-400' : 'text-green-400'
                                          }`}>
                                          {injury.severity === 'high' ? 'Alta' : injury.severity === 'medium' ? 'Media' : 'Baja'}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center justify-center w-full h-[100px] text-xs text-gray-500 border border-dashed border-white/10 rounded-2xl px-8">
                                    Sin lesiones activas
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Información Adicional (Bio, Contacto) */}
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
                                  <MessageCircle className="h-4 w-4" />
                                  <span className="text-xs">Teléfono</span>
                                </div>
                                <span className="text-sm text-white">{clientDetail.client.physicalData.phone}</span>
                              </div>
                            )}

                            {/* Emergencia */}
                            {clientDetail.client.physicalData?.emergency_contact && (
                              <div className="p-3 flex items-center justify-between bg-[#FF7939]/5">
                                <div className="flex items-center gap-2 text-[#FF7939]">
                                  <Phone className="h-4 w-4" />
                                  <span className="text-xs">Emergencia</span>
                                </div>
                                <span className="text-sm text-white font-medium">{clientDetail.client.physicalData.emergency_contact}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* --- TAB: ACTIVIDADES --- */}
                  <div className={!loadingDetail && activeModalTab === 'activities' ? 'block' : 'hidden'}>
                    <div className="space-y-4 px-2">
                      {/* Sub-tabs for activities */}
                      <div className="flex gap-1 p-1 bg-[#1A1A1A] rounded-xl border border-zinc-800/50">
                        {(['en-curso', 'por-empezar', 'finalizadas'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActivitySubTab(tab as any)}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${activitySubTab === tab ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            {tab === 'en-curso' ? 'En Curso' : tab === 'por-empezar' ? 'Por Empezar' : 'Finalizadas'}
                          </button>
                        ))}
                      </div>

                      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold pl-1 mt-1">
                        {clientDetail?.client?.physicalData?.meet_credits || 0} Créditos de Meet Disponibles
                      </div>

                      {(() => {
                        const allActivities = clientDetail?.client?.activities || []
                        const filteredByTab = allActivities.filter((a: any) => {
                          const progressPercent = Number(a?.progressPercent ?? 0) || 0
                          const isExpiredStart = !!a?.isExpiredStart
                          const isCompleted = progressPercent >= 100 ||
                            a?.status === 'finalizada' ||
                            a?.status === 'finished' ||
                            a?.status === 'expirada' ||
                            a?.status === 'expired' ||
                            isExpiredStart

                          const hasStarted = !!(a?.start_date || a?.enrollmentStartDate)

                          if (activitySubTab === 'finalizadas') return isCompleted
                          if (activitySubTab === 'por-empezar') return !isCompleted && !hasStarted
                          return !isCompleted && hasStarted // 'en-curso'
                        })

                        if (filteredByTab.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-zinc-800/50 rounded-2xl bg-zinc-900/20">
                              <Activity className="h-8 w-8 text-zinc-700 mb-2" />
                              <p className="text-xs text-zinc-500 font-medium">No hay actividades {activitySubTab}</p>
                            </div>
                          )
                        }

                        return (
                          <div className="flex gap-4 overflow-x-auto pb-6 snap-x scrollbar-hide -mx-2 px-2">
                            {filteredByTab.map((a: any, index: number) => {
                              // Construct Enrollment object compatible with PurchasedActivityCard
                              const enrollmentMock = {
                                id: a.enrollment_id,
                                created_at: a.created_at || new Date().toISOString(),
                                start_date: a.start_date || a.enrollmentStartDate,
                                expiration_date: a.enrollmentExpirationDate,
                                program_end_date: a.program_end_date,
                                status: a.status,
                                client_id: selectedClient.id,
                                activity_id: a.id,
                                activity: {
                                  id: a.id,
                                  title: a.title,
                                  type: a.type,
                                  image_url: a.image_url,
                                  coach_name: a.coach_name || 'Coach',
                                  coach_avatar_url: a.coach_avatar_url,
                                  categoria: a.categoria,
                                  dias_acceso: a.dias_acceso
                                }
                              }

                              const progressPercent = Number(a?.progressPercent ?? 0) || 0

                              return (
                                <div key={`act-${a.id}-idx-${index}`} className="snap-center flex-shrink-0">
                                  <PurchasedActivityCard
                                    enrollment={enrollmentMock as any}
                                    realProgress={progressPercent}
                                    size="small"
                                    isCoachView={true}
                                    daysCompleted={a.daysCompleted}
                                    daysPassed={a.daysPassed}
                                    daysMissed={a.daysMissed}
                                    daysRemainingFuture={a.daysRemainingFuture}
                                    itemsCompletedTotal={a.itemsCompletedTotal}
                                    itemsDebtPast={a.itemsDebtPast}
                                    itemsPendingToday={a.itemsPendingToday}
                                    amountPaid={a.amount_paid}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* End Tabs Content */}
                </div>
              </div>
              {/* End Scrollable */}
            </div>

            {/* End Fixed Modal */}
          </div>
        )
      }
      {/* End Root */}
    </div >
  )
}
