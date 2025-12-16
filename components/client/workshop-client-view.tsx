"use client"

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Clock, Calendar, Users, CheckCircle, X, Edit2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/supabase-client'
import { useAuth } from '@/contexts/auth-context'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TallerDetalle {
  id: number
  nombre: string
  descripcion: string
  originales: {
    fechas_horarios: Array<{
      fecha: string
      hora_inicio: string
      hora_fin: string
      cupo: number
    }>
  }
}

interface TemaEstado {
  tema_id: number
  tema_nombre: string
  fecha_seleccionada: string | null
  horario_seleccionado: any
  confirmo_asistencia: boolean
  asistio: boolean
}

interface WorkshopClientViewProps {
  activityId: number
  activityTitle: string
  activityDescription?: string
  activityImageUrl?: string
}

export function WorkshopClientView({ 
  activityId, 
  activityTitle, 
  activityDescription,
  activityImageUrl 
}: WorkshopClientViewProps) {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [temas, setTemas] = useState<TallerDetalle[]>([])
  const [ejecucionId, setEjecucionId] = useState<number | null>(null)
  const [temasCubiertos, setTemasCubiertos] = useState<TemaEstado[]>([])
  const [temasPendientes, setTemasPendientes] = useState<TemaEstado[]>([])
  const [expandedTema, setExpandedTema] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [cuposOcupados, setCuposOcupados] = useState<Record<string, number>>({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedHorario, setSelectedHorario] = useState<any>(null)
  // Indica si este cliente pertenece a la versión ACTUAL del taller
  // Si es false, no debe poder reservar en los nuevos horarios de una versión futura
  const [isOnCurrentWorkshopVersion, setIsOnCurrentWorkshopVersion] = useState(true)

  useEffect(() => {
    if (user) {
      loadWorkshopData()
    }
  }, [user, activityId])

  const parseSpanishDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null
    // Formato esperado: dd/mm/aa o dd/mm/aaaa
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    const [dd, mm, yy] = parts
    const day = parseInt(dd, 10)
    const month = parseInt(mm, 10) - 1
    let year = parseInt(yy, 10)
    if (year < 100) {
      // Asumimos siglo 2000+ para dos dígitos
      year = 2000 + year
    }
    const d = new Date(year, month, day)
    return isNaN(d.getTime()) ? null : d
  }

  const loadWorkshopData = async () => {
    try {
      setLoading(true)
      console.log('📚 [WorkshopClientView] Cargando datos del taller:', activityId)

      // 1. Cargar temas del taller desde taller_detalles
      const { data: temasData, error: temasError } = await supabase
        .from('taller_detalles')
        .select('*')
        .eq('actividad_id', activityId)
        .order('id')

      if (temasError) {
        console.error('❌ Error cargando temas:', temasError)
        return
      }

      setTemas(temasData || [])
      console.log('✅ Temas cargados:', temasData?.length)

      // 2. Cargar o crear ejecución del cliente
      // Primero verificar si existe
      const { data: ejecucionExistente, error: checkError } = await supabase
        .from('ejecuciones_taller')
        .select('*')
        .eq('cliente_id', user!.id)
        .eq('actividad_id', activityId)
        .limit(1)

      let ejecucion = ejecucionExistente && ejecucionExistente.length > 0 ? ejecucionExistente[0] : null

      // Si no existe, crear ejecución vacía
      if (!ejecucion) {
        console.log('📝 Creando nueva ejecución para el cliente')

        const { data: nuevaEjecucion, error: insertError } = await supabase
          .from('ejecuciones_taller')
          .insert({
            cliente_id: user!.id,
            actividad_id: activityId,
            temas_pendientes: [],
            temas_cubiertos: [],
            estado: 'en_progreso'
          })
          .select()
          .single()

        if (insertError) {
          console.error('❌ Error creando ejecución:', insertError)
          return
        }

        ejecucion = nuevaEjecucion
      } else {
        console.log('✅ Ejecución existente encontrada, ID:', ejecucion.id)
      }

      setEjecucionId(ejecucion.id)
      setTemasCubiertos(ejecucion.temas_cubiertos || [])
      setTemasPendientes(ejecucion.temas_pendientes || [])

      // 3. Determinar si el cliente pertenece a la versión actual del taller
      try {
        const { data: activityInfo, error: activityError } = await supabase
          .from('activities')
          .select('workshop_versions, created_at')
          .eq('id', activityId)
          .single()

        if (activityError) {
          console.error('❌ Error cargando activity para versiones de taller:', activityError)
        } else {
          const versions = activityInfo?.workshop_versions?.versions || []

          if (versions.length === 0) {
            // No hay versiones: todos los clientes pertenecen a la versión actual
            setIsOnCurrentWorkshopVersion(true)
          } else {
            const lastVersion = versions[versions.length - 1]
            const lastVersionStart = parseSpanishDate(lastVersion?.empezada_el)

            // Usar fecha de inscripción o creación de la ejecución
            const ejecucionCreatedAt =
              (ejecucion as any)?.fecha_inscripcion ||
              (ejecucion as any)?.created_at ||
              null

            const ejecucionDate = ejecucionCreatedAt ? new Date(ejecucionCreatedAt) : null

            if (lastVersionStart && ejecucionDate) {
              // Si la ejecución es anterior al inicio de la última versión,
              // significa que este cliente compró una versión ANTERIOR del taller.
              const belongsToCurrent = ejecucionDate >= lastVersionStart
              setIsOnCurrentWorkshopVersion(belongsToCurrent)

              console.log('📊 [WorkshopClientView] Versión taller / ejecución cliente', {
                activityId,
                ejecucionId: ejecucion.id,
                ejecucionDate: ejecucionDate.toISOString(),
                lastVersionStart: lastVersionStart.toISOString(),
                isOnCurrentWorkshopVersion: belongsToCurrent
              })
            } else {
              // Si no podemos determinar bien las fechas, por seguridad
              // asumimos que pertenece a la versión actual
              setIsOnCurrentWorkshopVersion(true)
            }
          }
        }
      } catch (e) {
        console.error('❌ Error determinando versión de taller para el cliente:', e)
        setIsOnCurrentWorkshopVersion(true)
      }

      // 4. Cargar cupos ocupados
      await loadCuposOcupados()

    } catch (error) {
      console.error('❌ Error general:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCuposOcupados = async () => {
    try {
      // Obtener todas las ejecuciones de esta actividad
      const { data: ejecuciones } = await supabase
        .from('ejecuciones_taller')
        .select('temas_cubiertos, temas_pendientes')
        .eq('actividad_id', activityId)

      const cupos: Record<string, number> = {}

      ejecuciones?.forEach(ejecucion => {
        // Contar confirmaciones en temas cubiertos
        ;(ejecucion.temas_cubiertos || []).forEach((tema: any) => {
          if (tema.confirmo_asistencia && tema.fecha_seleccionada && tema.horario_seleccionado) {
            const key = `${tema.tema_id}-${tema.fecha_seleccionada}-${tema.horario_seleccionado.hora_inicio}`
            cupos[key] = (cupos[key] || 0) + 1
          }
        })

        // Contar confirmaciones en temas pendientes
        ;(ejecucion.temas_pendientes || []).forEach((tema: any) => {
          if (tema.confirmo_asistencia && tema.fecha_seleccionada && tema.horario_seleccionado) {
            const key = `${tema.tema_id}-${tema.fecha_seleccionada}-${tema.horario_seleccionado.hora_inicio}`
            cupos[key] = (cupos[key] || 0) + 1
          }
        })
      })

      setCuposOcupados(cupos)
    } catch (error) {
      console.error('❌ Error cargando cupos:', error)
    }
  }

  const handleSelectHorario = (
    temaId: number,
    temaNombre: string,
    fecha: string,
    horario: any
  ) => {
    const cupoKey = `${temaId}-${fecha}-${horario.hora_inicio}`
    const ocupados = cuposOcupados[cupoKey] || 0

    if (ocupados >= horario.cupo) {
      alert('Este horario está lleno. Por favor, selecciona otro.')
      return
    }

    setSelectedHorario({
      temaId,
      temaNombre,
      fecha,
      horario
    })
    setShowConfirmModal(true)
  }

  const confirmAsistencia = async () => {
    try {
      const { temaId, temaNombre, fecha, horario } = selectedHorario

      // Crear el tema cubierto con la nueva estructura
      const temaCubierto = {
        asistio: false,
        tema_id: temaId,
        tema_nombre: temaNombre,
        fecha_seleccionada: fecha,
        confirmo_asistencia: true,
        horario_seleccionado: {
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin
        }
      }

      // Agregar el tema a cubiertos
      const nuevosTemasCubiertos = [...temasCubiertos, temaCubierto]

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('ejecuciones_taller')
        .update({
          temas_cubiertos: nuevosTemasCubiertos
        })
        .eq('id', ejecucionId)

      if (error) {
        console.error('❌ Error actualizando:', error)
        alert('Error al confirmar asistencia')
        return
      }

      // Actualizar estado local
      setTemasCubiertos(nuevosTemasCubiertos)
      
      // Actualizar cupos
      const cupoKey = `${temaId}-${fecha}-${horario.hora_inicio}`
      setCuposOcupados(prev => ({
        ...prev,
        [cupoKey]: (prev[cupoKey] || 0) + 1
      }))

      setShowConfirmModal(false)
      setSelectedHorario(null)
      alert('¡Asistencia confirmada! Te esperamos en este horario.')

    } catch (error) {
      console.error('❌ Error:', error)
      alert('Error al confirmar asistencia')
    }
  }

  const cancelConfirmacion = () => {
    setShowConfirmModal(false)
    setSelectedHorario(null)
  }

  const editarReservacion = async (temaId: number) => {
    const temaCubierto = temasCubiertos.find(t => t.tema_id === temaId)
    if (!temaCubierto) return

    if (!canEditReservation(temaCubierto.fecha_seleccionada!, temaCubierto.horario_seleccionado!.hora_inicio)) {
      alert('❌ Los cambios solo son posibles con 48 horas o más de antelación al evento.')
      return
    }

    // Liberar el cupo actual
    const cupoKey = `${temaId}-${temaCubierto.fecha_seleccionada}-${temaCubierto.horario_seleccionado.hora_inicio}`
    setCuposOcupados(prev => ({
      ...prev,
      [cupoKey]: Math.max(0, (prev[cupoKey] || 1) - 1)
    }))

    // Mover de temas_cubiertos de vuelta a pendiente
    const nuevosTemasCubiertos = temasCubiertos.filter(t => t.tema_id !== temaId)

    // Actualizar en la base de datos
    const { error } = await supabase
      .from('ejecuciones_taller')
      .update({
        temas_cubiertos: nuevosTemasCubiertos
      })
      .eq('id', ejecucionId)

    if (error) {
      console.error('❌ Error editando reserva:', error)
      alert('Error al editar la reserva')
      return
    }

    setTemasCubiertos(nuevosTemasCubiertos)
    setExpandedTema(temaId) // Expandir el tema para que pueda seleccionar nuevo horario
  }

  const getTemaData = (temaId: number): TallerDetalle | undefined => {
    return temas.find(t => t.id === temaId)
  }

  const getTemaEstado = (temaId: number): 'completado' | 'reservado' | 'pendiente' => {
    const temaCubierto = temasCubiertos.find(t => t.tema_id === temaId)
    if (temaCubierto?.asistio) return 'completado'
    if (temaCubierto && !temaCubierto.asistio) return 'reservado'
    return 'pendiente'
  }

  const canEditReservation = (fechaSeleccionada: string, horaInicio: string): boolean => {
    if (!fechaSeleccionada || !horaInicio) return false
    
    const fechaHoraEvento = new Date(`${fechaSeleccionada}T${horaInicio}`)
    const ahora = new Date()
    const horasHastaEvento = (fechaHoraEvento.getTime() - ahora.getTime()) / (1000 * 60 * 60)
    
    return horasHastaEvento >= 48
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM", { locale: es })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Fondo con imagen */}
        {activityImageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${activityImageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          </div>
        )}
        <div className="relative z-10 text-white">Cargando taller...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen text-white">
      {/* Imagen de fondo */}
      {activityImageUrl && (
        <div 
          className="fixed inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${activityImageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}
      
      {/* Contenido con glassmorphism */}
      <div className="relative z-10 pt-20 px-4 pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-3">{activityTitle}</h1>
        {activityDescription && (
          <p className="text-gray-200 text-base leading-relaxed">{activityDescription}</p>
        )}
      </div>

        {/* Próximas Sesiones */}
        <h2 className="text-xl font-bold text-white mb-4">Próximas Sesiones</h2>
        {temasCubiertos.filter(tema => !tema.asistio).length > 0 ? (
          <div className="space-y-3 mb-6">
            {temasCubiertos
              .filter(tema => !tema.asistio)
              .map((tema) => {
                return (
                  <div key={tema.tema_id} className="bg-black/30 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold">{tema.tema_nombre}</div>
                        <div className="text-gray-300 text-sm">
                          {tema.fecha_seleccionada && formatDate(tema.fecha_seleccionada)} - {tema.horario_seleccionado?.hora_inicio} a {tema.horario_seleccionado?.hora_fin}
                        </div>
                      </div>
                      <CheckCircle className="w-5 h-5 text-[#FF7939]" />
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4 mb-6">No tienes sesiones confirmadas</p>
        )}

      {/* Lista de Temas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Temas del Taller</h2>
          {/* Barra de progreso simple */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#FF7939]">
              {temasCubiertos.filter(t => t.asistio).length} / {temas.length}
            </span>
            <div className="w-20 h-2 bg-black/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF7939] to-[#FF5B39] transition-all duration-500 rounded-full"
                style={{
                  width: `${((temasCubiertos.filter(t => t.asistio).length / temas.length) * 100) || 0}%`
                }}
              />
            </div>
          </div>
        </div>
        
        {temas.filter(tema => {
          const estado = getTemaEstado(tema.id)
          return estado === 'pendiente' || estado === 'reservado'
        }).map((tema) => {
          const temaData = getTemaData(tema.id)
          if (!temaData) return null

          const estado = getTemaEstado(tema.id)
          const isExpanded = expandedTema === tema.id

          return (
            <div 
              key={tema.id}
              className="bg-black/30 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden shadow-2xl"
            >
              {/* Header del tema */}
              <div 
                className="p-6 cursor-pointer hover:bg-white/10 transition-all duration-300"
                onClick={() => setExpandedTema(isExpanded ? null : tema.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-white font-semibold text-lg">{temaData.nombre}</h3>
                        {estado === 'completado' && (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        )}
                        {estado === 'reservado' && (
                          <>
                            <span className="bg-gradient-to-r from-[#FF7939] to-[#FF5B39] text-white text-xs px-3 py-1 rounded-full font-medium">
                              Reservado
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                editarReservacion(tema.id)
                              }}
                              className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300"
                              title="Editar horario"
                            >
                              <Edit2 className="w-4 h-4 text-white" />
                            </button>
                          </>
                        )}
                      </div>
                      {/* Descripción directamente debajo del nombre */}
                      {temaData.descripcion && (
                        <p className="text-gray-300 text-sm leading-relaxed">{temaData.descripcion}</p>
                      )}
                    </div>
                  </div>
                  <div className="transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Contenido expandible */}
              {isExpanded && (
                <div className="px-6 pb-6 space-y-6">
                  {/* Información de reserva si está reservado */}
                  {estado === 'reservado' && (() => {
                    const temaCubierto = temasCubiertos.find(t => t.tema_id === tema.id)
                    if (!temaCubierto) return null
                    
                    const puedeEditar = canEditReservation(
                      temaCubierto.fecha_seleccionada!,
                      temaCubierto.horario_seleccionado!.hora_inicio
                    )
                    
                    return (
                      <div className="bg-[#FF7939]/10 rounded-xl p-4 border border-[#FF7939]/30">
                        <h4 className="text-base font-semibold text-white mb-3">Tu Reserva</h4>
                        <div className="space-y-2 text-gray-200">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#FF7939]" />
                            <span>{formatDate(temaCubierto.fecha_seleccionada!)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#FF7939]" />
                            <span>{temaCubierto.horario_seleccionado?.hora_inicio} - {temaCubierto.horario_seleccionado?.hora_fin}</span>
                          </div>
                        </div>
                        {!puedeEditar && (
                          <p className="text-yellow-300 text-sm mt-3">
                            ⚠️ Los cambios solo son posibles con 48 horas o más de antelación
                          </p>
                        )}
                      </div>
                    )
                  })()}
                  
                  {/* Horarios (solo si es pendiente) */}
                  {estado === 'pendiente' && (
                    <>
                      {!isOnCurrentWorkshopVersion ? (
                        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                          <p className="text-sm text-gray-300">
                            Este taller ya finalizó para tu inscripción original. 
                            Los nuevos horarios pertenecen a una nueva versión del taller
                            y requieren una nueva compra.
                          </p>
                        </div>
                      ) : (
                        temaData.originales?.fechas_horarios &&
                        temaData.originales.fechas_horarios.length > 0 && (
                    <div>
                      <h4 className="text-base font-semibold text-gray-300 mb-4">Horarios Disponibles</h4>
                      <div className="space-y-3">
                        {temaData.originales.fechas_horarios.map((horario, idx) => {
                          const cupoKey = `${temaData.id}-${horario.fecha}-${horario.hora_inicio}`
                          const ocupados = cuposOcupados[cupoKey] || 0
                          const disponibles = horario.cupo - ocupados
                          const isLleno = disponibles <= 0
                          const isSeleccionado = false // No hay selección previa para temas pendientes

                          return (
                            <div 
                              key={idx}
                              className={`flex items-center justify-between p-4 rounded-xl border backdrop-blur-sm ${
                                isSeleccionado 
                                  ? 'bg-[#FF7939]/20 border-[#FF7939] shadow-lg' 
                                  : isLleno
                                  ? 'bg-black/30 border-white/10 opacity-50'
                                  : 'bg-black/30 border-white/10 hover:border-[#FF7939] hover:bg-[#FF7939]/10 cursor-pointer'
                              } transition-all duration-300`}
                              onClick={() => !isLleno && !isSeleccionado && handleSelectHorario(
                                tema.id,
                                temaData.nombre,
                                horario.fecha,
                                horario
                              )}
                            >
                              <div className="flex items-center gap-4">
                                <div className="p-2 bg-[#FF7939]/20 rounded-lg">
                                  <Calendar className="w-5 h-5 text-[#FF7939]" />
                                </div>
                                <div>
                                  <div className="text-white text-base font-semibold">
                                    {formatDate(horario.fecha)}
                                  </div>
                                  <div className="text-gray-300 text-sm flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {horario.hora_inicio} - {horario.hora_fin}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`flex items-center gap-1 text-xs ${
                                  isLleno ? 'text-red-500' : disponibles <= 3 ? 'text-orange-500' : 'text-gray-400'
                                }`}>
                                  <Users className="w-3 h-3" />
                                  <span>{disponibles}/{horario.cupo}</span>
                                </div>
                                {isSeleccionado && (
                                  <CheckCircle className="w-4 h-4 text-[#FF7939]" />
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                        )
                      )}
                    </>
                  )}

                </div>
              )}
            </div>
          )
        })}

        {/* Temas Completados */}
        {temasCubiertos.filter(tema => tema.asistio).length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-white mb-3">Temas Completados</h2>
            {temasCubiertos
              .filter(tema => tema.asistio)
              .map((tema) => {
                return (
                  <div 
                    key={tema.tema_id}
                    className="bg-green-900/20 backdrop-blur-md rounded-xl border border-green-500/30 p-4 mb-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-white font-medium">{tema.tema_nombre}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {tema.fecha_seleccionada && formatDate(tema.fecha_seleccionada)}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && selectedHorario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={cancelConfirmacion} />
          <div className="relative bg-black/50 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Confirmar Asistencia</h3>
              <button 
                onClick={cancelConfirmacion}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">{selectedHorario.temaNombre}</h4>
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-[#FF7939]" />
                  <span>{formatDate(selectedHorario.fecha)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 mt-1">
                  <Clock className="w-4 h-4 text-[#FF7939]" />
                  <span>{selectedHorario.horario.hora_inicio} - {selectedHorario.horario.hora_fin}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={cancelConfirmacion}
                  className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmAsistencia}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-[#FF7939] to-[#FF5B39] hover:from-[#FF5B39] hover:to-[#FF7939] text-white rounded-xl font-medium transition-all duration-300"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


