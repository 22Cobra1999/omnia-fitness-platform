'use client'

import React from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useAuth } from '../../contexts/auth-context';
import { createBuenosAiresDate, getBuenosAiresDateString, getBuenosAiresDayOfWeek, getTodayBuenosAiresString } from '../../utils/date-utils';

interface CalendarViewProps {
  activityIds: string[];
  onActivityClick?: (activityId: string) => void;
}

interface DayActivities {
  fecha: string;
  actividades: Array<{
    activity_id: string;
    actividad_nombre: string;
    total_ejercicios: number;
    completados: number;
    estado: 'completed' | 'started' | 'not-started';
  }>;
}

export default function CalendarView({ activityIds, onActivityClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [dayStatuses, setDayStatuses] = React.useState<{[key: string]: string}>({});
  const [dayActivities, setDayActivities] = React.useState<{[key: string]: DayActivities}>({});
  const [dayCounts, setDayCounts] = React.useState({
    pending: 0,
    started: 0,
    completed: 0
  });
  const [enrollment, setEnrollment] = React.useState<any>(null);
  const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
  
  const { user } = useAuth();
  const supabase = createClient();

  // Función para manejar el clic en una actividad
  const handleActivityClick = (activityId: string) => {
    console.log('🎯 [CalendarView] Clic en actividad:', activityId);
    if (onActivityClick) {
      onActivityClick(activityId);
    } else {
      console.warn('⚠️ [CalendarView] onActivityClick no está definido');
    }
  };

  // Obtener enrollments del usuario para todas las actividades
  React.useEffect(() => {
    if (!user || !activityIds || activityIds.length === 0) return;

    const fetchEnrollments = async () => {
      try {
        console.log('🔍 [CalendarView] Buscando enrollments:', { activityIds, clientId: user.id });
        
        const { data, error } = await supabase
          .from('activity_enrollments')
          .select('*')
          .in('activity_id', activityIds)
          .eq('client_id', user.id)
          .eq('status', 'activa')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ [CalendarView] Error obteniendo enrollments:', error);
          setEnrollment(null);
          return;
        }

        if (!data || data.length === 0) {
          console.warn('⚠️ [CalendarView] No se encontraron enrollments para estas actividades');
          setEnrollment(null);
          return;
        }

        // Para compatibilidad, tomar el primer enrollment (el más reciente)
        // En el futuro, esto podría manejar múltiples enrollments
        const enrollment = data[0];
        console.log('✅ [CalendarView] Enrollments encontrados:', data.length);
        console.log('✅ [CalendarView] Usando enrollment:', enrollment);
        setEnrollment(enrollment);
        
      } catch (error) {
        console.error('❌ [CalendarView] Error inesperado:', error);
        setEnrollment(null);
      }
    };

    fetchEnrollments();
  }, [user, activityIds]);

  const getDayStatus = (date: Date) => {
    const dateString = getBuenosAiresDateString(date);
    const buenosAiresDate = createBuenosAiresDate(dateString);
    const status = dayStatuses[buenosAiresDate.toDateString()];
    
        // Debug para días específicos
        if (dateString === '2025-10-08') {
          //   dateString,
          //   dayKey: buenosAiresDate.toDateString(),
          //   status,
          //   dayStatusesKeys: Object.keys(dayStatuses)
          // });
    }
    
    if (!status) {
      return 'no-exercises';
    }
    return status;
  };

  const handleDayClick = (date: Date) => {
    const dateString = getBuenosAiresDateString(date);
    const buenosAiresDate = createBuenosAiresDate(dateString);
    const dayKey = buenosAiresDate.toDateString();
    
    if (dayActivities[dayKey]) {
      setSelectedDay(date);
    } else {
      setSelectedDay(null);
    }
  };

  const getDayActivityCount = (date: Date) => {
    const dateString = getBuenosAiresDateString(date);
    const buenosAiresDate = createBuenosAiresDate(dateString);
    const dayKey = buenosAiresDate.toDateString();
    
    // Debug para días específicos
    if (dateString === '2025-10-08') {
      //   dateString,
      //   dayKey,
      //   dayActivities: dayActivities[dayKey],
      //   dayActivitiesKeys: Object.keys(dayActivities)
      // });
    }
    
    return dayActivities[dayKey]?.actividades.length || 0;
  };

  // Función para cargar estados de todos los días del mes
  const loadDayStatuses = async () => {
    if (!user || !activityIds || activityIds.length === 0 || !enrollment || !enrollment.start_date) return;

    try {
      console.log('📅 [CalendarView] Cargando estados para actividades:', activityIds);

      // Obtener todas las ejecuciones con fecha_ejercicio para TODAS las actividades del usuario
      const { data: ejecuciones, error } = await supabase
        .from('ejecuciones_ejercicio')
        .select(`
          id,
          ejercicio_id,
          completado,
          fecha_ejercicio,
          ejercicios_detalles!inner(
            activity_id,
            tipo,
            nombre_ejercicio,
            activities!inner(
              title
            )
          )
        `)
        .eq('client_id', user.id)
        .in('ejercicios_detalles.activity_id', activityIds);

      if (error) {
        console.error('Error obteniendo ejecuciones:', error);
        return;
      }


      // Agrupar por fecha_ejercicio
      const ejecucionesPorFecha = ejecuciones.reduce((acc, ejecucion) => {
        const fecha = ejecucion.fecha_ejercicio;
        if (!acc[fecha]) {
          acc[fecha] = [];
        }
        acc[fecha].push(ejecucion);
        return acc;
      }, {} as Record<string, any[]>);

      const newDayStatuses: Record<string, string> = {};
      const newDayActivities: Record<string, DayActivities> = {};
      const counts = { completed: 0, pending: 0, started: 0 };

      // Procesar cada fecha de ejercicio
      for (const [fecha, ejecucionesFecha] of Object.entries(ejecucionesPorFecha)) {
        const totalEjercicios = ejecucionesFecha.length;
        const completados = ejecucionesFecha.filter(e => e.completado).length;
        
        // Determinar estado del día
        let estadoDia: string;
        if (completados === 0) {
          estadoDia = 'not-started';
          counts.pending++;
        } else if (completados === totalEjercicios) {
          estadoDia = 'completed';
          counts.completed++;
        } else {
          estadoDia = 'started';
          counts.started++;
        }

        // Convertir fecha a Date para usar como clave (en Buenos Aires)
        const fechaDate = createBuenosAiresDate(fecha);
        newDayStatuses[fechaDate.toDateString()] = estadoDia;
        
        // Crear detalle de actividades para este día
        const actividadNombre = ejecucionesFecha[0]?.ejercicios_detalles?.activities?.title || 'Actividad';
        const activityId = ejecucionesFecha[0]?.ejercicios_detalles?.activity_id?.toString() || '';
        newDayActivities[fechaDate.toDateString()] = {
          fecha: fecha,
          actividades: [{
            activity_id: activityId,
            actividad_nombre: actividadNombre,
            total_ejercicios: totalEjercicios,
            completados: completados,
            estado: estadoDia as 'completed' | 'started' | 'not-started'
          }]
        };
        
      }

      setDayStatuses(newDayStatuses);
      setDayActivities(newDayActivities);
      setDayCounts(counts);
      
      
    } catch (error) {
      console.error('Error cargando estados de días:', error);
    }
  };

  // Cargar estados de los días cuando cambie el mes
  React.useEffect(() => {
    loadDayStatuses();
  }, [user?.id, activityIds, currentMonth, enrollment]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Calcular el primer día de la semana (0 = domingo, 1 = lunes, etc.)
    // Ajustar para que lunes sea 0
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const days = [];
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        date: new Date(year, month, i - startingDayOfWeek + 1),
        isCurrentMonth: false,
        dayNumber: i - startingDayOfWeek + 1
      });
    }
    
    // Agregar días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true,
        dayNumber: day
      });
    }
    
    // Agregar días vacíos al final para completar la cuadrícula
    const remainingDays = 42 - days.length; // 6 semanas × 7 días = 42
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false,
        dayNumber: day
      });
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
          // Estilos personalizados para la barra de scroll (Firefox)
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
          const isToday = dayInfo.date.toDateString() === new Date().toDateString();
          const dayStatus = getDayStatus(dayInfo.date);
          const activityCount = getDayActivityCount(dayInfo.date);
          const hasActivities = activityCount > 0;

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
                  (dayStatus === 'completed' ? '#FF6A00' :
                   dayStatus === 'started' ? '#FFC933' :
                   dayStatus === 'not-started' ? '#FF4444' :
                   dayStatus === 'no-exercises' ? 'transparent' :
                   '#2A2D31') : 'transparent',
                color: dayInfo.isCurrentMonth ?
                  (dayStatus === 'started' ? '#000000' : 
                   dayStatus === 'no-exercises' ? 'rgba(255, 255, 255, 0.5)' :
                   '#FFFFFF') : 'rgba(255, 255, 255, 0.3)',
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
          );
        })}
      </div>

      {/* Leyenda */}
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
          {/* Estado: Sin iniciar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#FF4444',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }} />
            <span style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 500
            }}>
               Pendiente ({dayCounts.pending})
            </span>
          </div>

          {/* Estado: Iniciado */}
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
               En curso ({dayCounts.started})
            </span>
          </div>

          {/* Estado: Completado */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#FF6A00',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }} />
            <span style={{
              fontSize: 11,
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 500
            }}>
               Completado ({dayCounts.completed})
            </span>
          </div>
        </div>
      </div>

      {/* Sección de actividades del día seleccionado */}
      {selectedDay && (() => {
        const dateString = getBuenosAiresDateString(selectedDay);
        const buenosAiresDate = createBuenosAiresDate(dateString);
        const dayKey = buenosAiresDate.toDateString();
        const dayData = dayActivities[dayKey];

        if (!dayData) {
          return null;
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
                    transition: 'all 0.2s ease',
                    ':hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0px)';
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
                      background: actividad.estado === 'completed' ? '#FF6A00' :
                                 actividad.estado === 'started' ? '#FFC933' : '#FF4444',
                      color: actividad.estado === 'started' ? '#000000' : '#FFFFFF',
                      padding: '6px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      {actividad.estado === 'completed' ? 'Completado' :
                       actividad.estado === 'started' ? 'En curso' : 'Pendiente'}
                    </div>
                  </div>
                  
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
                        background: actividad.estado === 'completed' ? '#FF6A00' :
                                   actividad.estado === 'started' ? '#FFC933' : '#FF4444',
                        width: `${(actividad.completados / actividad.total_ejercicios) * 100}%`,
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
                      {actividad.completados}/{actividad.total_ejercicios} ejercicios
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
      </div>
    </>
  );
}
