'use client'

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '../../contexts/auth-context'
import { createBuenosAiresDate, getBuenosAiresDateString, getBuenosAiresDayOfWeek, getTodayBuenosAiresString } from '../../utils/date-utils'

interface CoachCalendarMonthlyProps {
  onActivityClick?: (activityId: string) => void;
}

interface DayActivities {
  fecha: string;
  actividades: Array<{
    activity_id: string;
    actividad_nombre: string;
    tipo: string;
    horarios: Array<{
      hora_inicio: string;
      hora_fin: string;
      cupo: number;
      inscritos?: number;
    }>;
    total_horarios: number;
    total_inscritos: number;
  }>;
}

export function CoachCalendarMonthly({ onActivityClick }: CoachCalendarMonthlyProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [dayActivities, setDayActivities] = useState<{[key: string]: DayActivities}>({})
  const [dayCounts, setDayCounts] = useState({
    total_actividades: 0,
    total_horarios: 0,
    total_inscritos: 0
  })
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  
  const { user } = useAuth()
  const supabase = createClient()

  // Función para manejar el clic en una actividad
  const handleActivityClick = (activityId: string) => {
    console.log('🎯 [CoachCalendarMonthly] Clic en actividad:', activityId)
    if (onActivityClick) {
      onActivityClick(activityId)
    } else {
      console.warn('⚠️ [CoachCalendarMonthly] onActivityClick no está definido')
    }
  }

  // Obtener actividades del coach para el mes actual
  const loadCoachActivities = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('📅 [CoachCalendarMonthly] Cargando actividades del coach para el mes:', currentMonth)

      // Obtener todas las actividades del coach
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('id, title, type')
        .eq('coach_id', user.id)

      if (activitiesError) {
        console.error('❌ [CoachCalendarMonthly] Error obteniendo actividades:', activitiesError)
        return
      }

      if (!activities || activities.length === 0) {
        console.log('⚠️ [CoachCalendarMonthly] No se encontraron actividades del coach')
        setDayActivities({})
        setDayCounts({ total_actividades: 0, total_horarios: 0, total_inscritos: 0 })
        return
      }

      const activityIds = activities.map(a => a.id)
      console.log('✅ [CoachCalendarMonthly] Actividades encontradas:', activityIds)

      // Obtener detalles de talleres (workshops) con sus horarios
      const { data: tallerDetalles, error: tallerError } = await supabase
        .from('taller_detalles')
        .select('*')
        .in('actividad_id', activityIds)

      if (tallerError) {
        console.error('❌ [CoachCalendarMonthly] Error obteniendo detalles de talleres:', tallerError)
      }

      // Obtener enrollments para calcular inscripciones
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('activity_enrollments')
        .select('activity_id, status')
        .in('activity_id', activityIds)
        .eq('status', 'activa')

      if (enrollmentsError) {
        console.error('❌ [CoachCalendarMonthly] Error obteniendo enrollments:', enrollmentsError)
      }

      // Procesar datos
      const newDayActivities: Record<string, DayActivities> = {}
      const counts = { total_actividades: 0, total_horarios: 0, total_inscritos: 0 }

      // Procesar talleres
      if (tallerDetalles && tallerDetalles.length > 0) {
        tallerDetalles.forEach(taller => {
          const actividad = activities.find(a => a.id === taller.actividad_id)
          if (!actividad) return

          // Procesar horarios originales
          if (taller.originales?.fechas_horarios && Array.isArray(taller.originales.fechas_horarios)) {
            taller.originales.fechas_horarios.forEach((horario: any) => {
              const fecha = horario.fecha
              const fechaDate = createBuenosAiresDate(fecha)
              const dayKey = fechaDate.toDateString()

              if (!newDayActivities[dayKey]) {
                newDayActivities[dayKey] = {
                  fecha: fecha,
                  actividades: []
                }
              }

              let actividadExistente = newDayActivities[dayKey].actividades.find(a => a.activity_id === actividad.id.toString())
              if (!actividadExistente) {
                actividadExistente = {
                  activity_id: actividad.id.toString(),
                  actividad_nombre: taller.nombre || actividad.title,
                  tipo: actividad.type,
                  horarios: [],
                  total_horarios: 0,
                  total_inscritos: 0
                }
                newDayActivities[dayKey].actividades.push(actividadExistente)
              }

              const inscritos = enrollments?.filter(e => e.activity_id === actividad.id).length || 0
              actividadExistente.horarios.push({
                hora_inicio: horario.hora_inicio,
                hora_fin: horario.hora_fin,
                cupo: horario.cupo || 20,
                inscritos: inscritos
              })
              actividadExistente.total_horarios++
              actividadExistente.total_inscritos += inscritos

              counts.total_horarios++
              counts.total_inscritos += inscritos
            })
          }

        })
      }

      counts.total_actividades = activities.length

      setDayActivities(newDayActivities)
      setDayCounts(counts)
      
      console.log('✅ [CoachCalendarMonthly] Actividades procesadas:', {
        dias_con_actividades: Object.keys(newDayActivities).length,
        total_actividades: counts.total_actividades,
        total_horarios: counts.total_horarios,
        total_inscritos: counts.total_inscritos
      })

    } catch (error) {
      console.error('❌ [CoachCalendarMonthly] Error inesperado:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar actividades cuando cambie el mes
  useEffect(() => {
    loadCoachActivities()
  }, [user?.id, currentMonth])

  const handleDayClick = (date: Date) => {
    const dateString = getBuenosAiresDateString(date)
    const buenosAiresDate = createBuenosAiresDate(dateString)
    const dayKey = buenosAiresDate.toDateString()
    
    if (dayActivities[dayKey]) {
      setSelectedDay(date)
    } else {
      setSelectedDay(null)
    }
  }

  const getDayActivityCount = (date: Date) => {
    const dateString = getBuenosAiresDateString(date)
    const buenosAiresDate = createBuenosAiresDate(dateString)
    const dayKey = buenosAiresDate.toDateString()
    
    return dayActivities[dayKey]?.actividades.length || 0
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    // Calcular el primer día de la semana (0 = domingo, 1 = lunes, etc.)
    // Ajustar para que lunes sea 0
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
    
    const days = []
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        date: new Date(year, month, i - startingDayOfWeek + 1),
        isCurrentMonth: false,
        dayNumber: i - startingDayOfWeek + 1
      })
    }
    
    // Agregar días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
        dayNumber: day
      })
    }
    
    // Agregar días vacíos al final para completar la cuadrícula
    const remainingDays = 42 - days.length // 6 semanas × 7 días = 42
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        dayNumber: day
      })
    }
    
    return days
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() - 1)
      return newMonth
    })
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + 1)
      return newMonth
    })
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <div className="text-white">Cargando calendario...</div>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .calendar-container::-webkit-scrollbar {
          width: 8px;
        }
        .calendar-container::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .calendar-container::-webkit-scrollbar-thumb {
          background: rgba(255, 106, 0, 0.6);
          border-radius: 4px;
        }
        .calendar-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 106, 0, 0.8);
        }
      `}</style>
      <div 
        className="calendar-container"
        style={{
          height: '100vh',
          background: 'linear-gradient(135deg, #0F0F0F 0%, #1A1A1A 100%)',
          padding: '20px',
          color: '#FFFFFF',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 106, 0, 0.5) rgba(255, 255, 255, 0.1)'
        }}>
      
      {/* Header del calendario */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 30,
        padding: '0 10px'
      }}>
        <button
          onClick={goToPreviousMonth}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: 8,
            color: '#FFFFFF',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          ‹
        </button>
        
        <h2 style={{
          fontSize: 20,
          fontWeight: 'bold',
          margin: 0,
          textAlign: 'center'
        }}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        
        <button
          onClick={goToNextMonth}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: 8,
            color: '#FFFFFF',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: 16
          }}
        >
          ›
        </button>
      </div>

      {/* Días de la semana */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 8,
        marginBottom: 15
      }}>
        {dayNames.map(day => (
          <div key={day} style={{
            textAlign: 'center',
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.6)',
            padding: '8px 4px'
          }}>
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 8,
        marginBottom: 30
      }}>
        {getDaysInMonth(currentMonth).map((dayInfo, index) => {
          const isToday = dayInfo.date.toDateString() === new Date().toDateString()
          const activityCount = getDayActivityCount(dayInfo.date)
          const hasActivities = activityCount > 0

          return (
            <div
              key={index}
              onClick={() => hasActivities && handleDayClick(dayInfo.date)}
              style={{
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: dayInfo.isCurrentMonth ? 
                  (hasActivities ? '#FF7939' : 'transparent') : 'transparent',
                color: dayInfo.isCurrentMonth ?
                  (hasActivities ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)') : 'rgba(255, 255, 255, 0.3)',
                fontSize: 14,
                fontWeight: isToday ? 'bold' : 'normal',
                borderRadius: 8,
                border: isToday ? '2px solid #FF6B35' : 'none',
                cursor: hasActivities ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <span>{dayInfo.dayNumber}</span>
              {hasActivities && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  marginTop: 2,
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 10,
                  padding: '2px 6px',
                  minWidth: 16,
                  textAlign: 'center'
                }}>
                  {activityCount}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Estadísticas del mes */}
      <div style={{
        marginTop: 20,
        paddingTop: 20,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: 20,
          maxWidth: 750,
          margin: '0 auto'
        }}>
          {/* Total de actividades */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#FF7939',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }} />
            <span style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 500
            }}>
              Actividades ({dayCounts.total_actividades})
            </span>
          </div>

          {/* Total de horarios */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#FFC933',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }} />
            <span style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 500
            }}>
              Horarios ({dayCounts.total_horarios})
            </span>
          </div>

          {/* Total de inscritos */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#00C851',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }} />
            <span style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 500
            }}>
              Inscritos ({dayCounts.total_inscritos})
            </span>
          </div>
        </div>
      </div>

      {/* Sección de actividades del día seleccionado */}
      {selectedDay && (() => {
        const dateString = getBuenosAiresDateString(selectedDay)
        const buenosAiresDate = createBuenosAiresDate(dateString)
        const dayKey = buenosAiresDate.toDateString()
        const dayData = dayActivities[dayKey]

        if (!dayData) {
          return null
        }

        return (
          <div style={{
            marginTop: 30,
            padding: '20px 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20
            }}>
              <h3 style={{
                color: '#FFFFFF',
                fontSize: 20,
                fontWeight: 'bold',
                margin: 0
              }}>
                {selectedDay.toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#FFFFFF',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 16
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {dayData.actividades.map((actividad, index) => (
                <div
                  key={index}
                  onClick={() => handleActivityClick(actividad.activity_id)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 12,
                    padding: 20,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.transform = 'translateY(0px)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 15
                  }}>
                    <span style={{
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      fontSize: 16
                    }}>
                      {actividad.actividad_nombre}
                    </span>
                    <div style={{
                      background: '#FF7939',
                      color: '#FFFFFF',
                      padding: '6px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {actividad.tipo}
                    </div>
                  </div>
                  
                  {/* Formato compacto: actividad x tema/s a las horas */}
                  <div style={{ marginBottom: 15 }}>
                    <div style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: '500',
                      lineHeight: 1.4
                    }}>
                      De <strong>{actividad.actividad_nombre}</strong> tenemos <strong>{actividad.total_horarios} tema{actividad.total_horarios > 1 ? 's' : ''}</strong> a las:
                    </div>
                    <div style={{
                      marginTop: 8,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 6
                    }}>
                      {actividad.horarios.map((horario, horarioIndex) => (
                        <div key={horarioIndex} style={{
                          background: 'rgba(255, 121, 57, 0.2)',
                          border: '1px solid rgba(255, 121, 57, 0.3)',
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          color: '#FFFFFF',
                          fontWeight: '500'
                        }}>
                          {horario.hora_inicio}-{horario.hora_fin}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resumen */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 15
                  }}>
                    <div style={{
                      flex: 1,
                      height: 8,
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        background: '#FF7939',
                        width: `${Math.min((actividad.total_inscritos / (actividad.horarios.reduce((sum, h) => sum + h.cupo, 0))) * 100, 100)}%`,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: 14,
                      fontWeight: 'bold',
                      minWidth: 80,
                      textAlign: 'right'
                    }}>
                      {actividad.total_inscritos} inscritos
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
      </div>
    </>
  )
}
