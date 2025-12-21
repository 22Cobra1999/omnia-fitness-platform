"use client"

import { useState, useEffect } from "react"
import { createClient } from '@/lib/supabase/supabase-client'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CalendarViewProps {
  activityIds: string[]
  onActivityClick: (activityId: string) => void
}

export default function CalendarView({ activityIds, onActivityClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [activitiesByDate, setActivitiesByDate] = useState<Record<string, any[]>>({})
  const [activitiesInfo, setActivitiesInfo] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Listener para resetear al origen cuando se presiona el tab activo
  useEffect(() => {
    const handleResetToOrigin = (event: CustomEvent) => {
      const { tab } = event.detail
      if (tab === 'calendar') {
        // Resetear fecha seleccionada
        setSelectedDate(null)
        
        // Scroll al inicio
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      }
    }

    window.addEventListener('reset-tab-to-origin', handleResetToOrigin as EventListener)
    return () => {
      window.removeEventListener('reset-tab-to-origin', handleResetToOrigin as EventListener)
    }
  }, [])

  useEffect(() => {
    const fetchActivities = async () => {
      if (activityIds.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const activitiesMap: Record<string, any[]> = {}

        // Obtener progreso del cliente para cada actividad
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // 1) Obtener metadata de las actividades (nombre, tipo, etc.)
        const numericIds = activityIds.map(id => Number(id))
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('id, title, type, categoria, workshop_mode')
          .in('id', numericIds)

        if (activitiesError) {
          console.error('Error fetching activities info:', activitiesError)
        } else if (activitiesData) {
          const infoMap: Record<string, any> = {}
          activitiesData.forEach((a: any) => {
            infoMap[a.id.toString()] = a
          })
          setActivitiesInfo(infoMap)
        }

        // 2) Obtener progreso del cliente para cada actividad y día del mes
        //    Calcular cantidad de actividades pendientes de HOY para cada actividad
        for (const activityId of activityIds) {
          const { data: progress } = await supabase
            .from('progreso_cliente')
            .select('fecha, actividad_id, ejercicios_pendientes, detalles_series')
            .eq('actividad_id', activityId)
            .eq('cliente_id', user.id)
            .gte('fecha', startOfMonth(currentDate).toISOString().split('T')[0])
            .lte('fecha', endOfMonth(currentDate).toISOString().split('T')[0])

          if (progress) {
            progress.forEach((p: any) => {
              const dateKey = p.fecha.split('T')[0]
              
              // Calcular cantidad de actividades pendientes de HOY
              let pendingCount = 0
              
              // Intentar desde ejercicios_pendientes (array)
              if (Array.isArray(p.ejercicios_pendientes)) {
                pendingCount = p.ejercicios_pendientes.length
              } else if (typeof p.ejercicios_pendientes === 'string') {
                try {
                  const parsed = JSON.parse(p.ejercicios_pendientes)
                  if (Array.isArray(parsed)) {
                    pendingCount = parsed.length
                  }
                } catch (e) {
                  // Ignorar error de parseo
                }
              }
              
              // Si no hay ejercicios_pendientes, intentar contar desde detalles_series
              if (pendingCount === 0 && p.detalles_series) {
                try {
                  const detalles = typeof p.detalles_series === 'string' 
                    ? JSON.parse(p.detalles_series) 
                    : p.detalles_series
                  if (detalles && typeof detalles === 'object') {
                    pendingCount = Object.keys(detalles).length
                  }
                } catch (e) {
                  // Ignorar error de parseo
                }
              }

              if (!activitiesMap[dateKey]) {
                activitiesMap[dateKey] = []
              }
              activitiesMap[dateKey].push({ 
                id: activityId, 
                fecha: p.fecha,
                pendingCount 
              })
            })
          }
        }

        setActivitiesByDate(activitiesMap)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [activityIds, currentDate, supabase])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDateClick = (date: Date) => {
    // Solo seleccionar el día y mostrar la lista de actividades debajo.
    // La navegación a la actividad se hace recién cuando el usuario hace
    // click en una de las actividades listadas.
    setSelectedDate(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Cargando calendario...</div>
      </div>
    )
  }

  return (
    <div className="p-4 text-white">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={previousMonth} className="text-white">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-bold">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <Button variant="ghost" onClick={nextMonth} className="text-white">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysInMonth.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const activities = activitiesByDate[dateKey] || []
          const hasActivities = activities.length > 0
          // Sumar todas las actividades pendientes de todas las actividades de ese día
          const totalPending = activities.reduce((sum, a: any) => {
            const n = typeof a.pendingCount === 'number' ? a.pendingCount : 0
            return sum + n
          }, 0)
          const isSelected = selectedDate && isSameDay(day, selectedDate)

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square p-2 rounded-lg border transition-colors
                ${isToday(day) ? 'border-[#FF7939] bg-[#FF7939]/10' : 'border-gray-700'}
                ${isSelected ? 'bg-[#FF7939]/20 border-[#FF7939]' : ''}
                ${hasActivities ? 'bg-[#FF7939]/30 hover:bg-[#FF7939]/40' : 'hover:bg-gray-800'}
                text-white text-sm
              `}
            >
              <div className="flex flex-col items-center">
                <span>{format(day, 'd')}</span>
                {hasActivities && totalPending > 0 && (
                  <div
                    className="mt-1 px-1.5 h-5 rounded-full flex items-center justify-center gap-0.5"
                    style={{
                      background: '#FF7939',
                    }}
                  >
                    <Flame className="w-3 h-3 text-black" />
                    <span className="text-[10px] font-semibold text-black">
                      {totalPending}
                    </span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selectedDate && activitiesByDate[format(selectedDate, 'yyyy-MM-dd')] && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-3 text-white/90">
            Actividades para {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
          </h3>
          <div className="space-y-2">
            {activitiesByDate[format(selectedDate, 'yyyy-MM-dd')].map((activity, index) => {
              const info = activitiesInfo[activity.id]
              const type = info?.type || 'program'
              const categoria = (info?.categoria || '').toLowerCase()
              const pendingCount = typeof activity.pendingCount === 'number' ? activity.pendingCount : 0

              // Colores del frame según tipo:
              // - Naranja fuerte: programa
              // - Naranja claro: taller
              // - Blanco: consulta / meet con coach
              let borderClass = 'border-[#FF7939]'
              let bgClass = 'bg-[#FF7939]/10'
              let label = 'Programa'

              if (type === 'workshop') {
                borderClass = 'border-[#FFB873]'
                bgClass = 'bg-[#FFB873]/12'
                label = 'Taller'
              } else if (type === 'consultation' || categoria === 'consultation') {
                borderClass = 'border-white/80'
                bgClass = 'bg-black'
                label = 'Consulta / Meet'
              } else if (categoria === 'nutricion' || categoria === 'nutrition') {
                label = 'Programa de nutrición'
              }

              return (
                <button
                  key={index}
                  onClick={() => onActivityClick(activity.id)}
                  className={`
                    w-full text-left p-3 rounded-xl border relative
                    ${borderClass} ${bgClass}
                    hover:bg-white/5 transition-colors
                  `}
                  style={{ backgroundClip: 'padding-box' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-semibold text-white truncate">
                        {info?.title || `Actividad ${activity.id}`}
                      </span>
                      <span className="text-[11px] text-gray-300 mt-0.5">
                        {label}
                      </span>
                    </div>

                    {/* Fuego con cantidad DENTRO del frame, bien visible */}
                    {pendingCount > 0 && (
                      <div 
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: '#FF7939',
                        }}
                      >
                        <div className="flex items-center gap-0.5">
                          <Flame className="w-3 h-3 text-black" />
                          <span className="text-[10px] font-bold text-black leading-none">
                            {pendingCount}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Tags adicionales si es taller o consulta */}
                    {type === 'workshop' && (
                      <span className="flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold text-[#FFB873] bg-black/40 border border-[#FFB873]/60">
                        Taller
                      </span>
                    )}
                    {(type === 'consultation' || categoria === 'consultation') && (
                      <span className="flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-semibold text-white bg-black/60 border border-white/60">
                        Meet
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
