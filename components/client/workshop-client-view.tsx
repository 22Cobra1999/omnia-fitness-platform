"use client"

import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, ChevronDown, ChevronUp, Download, AlignLeft, Star, Users, X, Edit2, FileText } from "lucide-react"
import { createClient } from '@/lib/supabase/supabase-client'
import { useAuth } from '@/contexts/auth-context'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from "@/components/ui/button"
import { ActivitySurveyModal } from "@/components/shared/activities/activity-survey-modal"

interface TallerDetalle {
  id: number
  nombre: string
  descripcion: string
  pdf_url?: string
  pdf_file_name?: string
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
  tema_nombre: string  // From taller_detalles JOIN
  fecha_seleccionada?: string | null
  horario_seleccionado?: any
  confirmo_asistencia: boolean
  asistio: boolean
  // PDF info from taller_detalles
  pdf_url?: string | null
  pdf_file_name?: string | null
}


interface WorkshopClientViewProps {
  activityId: number
  activityTitle: string
  activityDescription?: string
  activityImageUrl?: string
  isDocument?: boolean
}

export function WorkshopClientView({
  activityId,
  activityTitle,
  activityDescription,
  activityImageUrl,
  isDocument = false
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
  const [isOnCurrentWorkshopVersion, setIsOnCurrentWorkshopVersion] = useState(true)
  const [documentProgress, setDocumentProgress] = useState<Record<number, boolean>>({})
  const [enrollment, setEnrollment] = useState<any>(null)

  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const MAX_DESCRIPTION_LENGTH = 150
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [isRated, setIsRated] = useState(false)

  useEffect(() => {
    if (user?.id) {
      const init = async () => {
        const enr = await loadEnrollment()
        if (enr) {
          loadWorkshopData(enr.id)
        }
      }
      init()
    }
  }, [user?.id, activityId])

  const loadEnrollment = async () => {
    const { data } = await supabase
      .from('activity_enrollments')
      .select('*')
      .eq('client_id', user!.id)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: false }) // Get latest
      .limit(1)
      .maybeSingle()

    if (data) {
      setEnrollment(data)
      // Check if already rated (using feedback column or similar flag as program does)
      setIsRated((data as any).status === 'finalizada' && (((data as any).rating_activity !== null && (data as any).rating_activity !== undefined) || ((data as any).feedback !== null && (data as any).feedback !== undefined)))
    }
    return data
  }

  const parseSpanishDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null
    const parts = dateStr.split('/')
    if (parts.length !== 3) return null
    const [dd, mm, yy] = parts
    const day = parseInt(dd, 10)
    const month = parseInt(mm, 10) - 1
    let year = parseInt(yy, 10)
    if (year < 100) year = 2000 + year
    const d = new Date(year, month, day)
    return isNaN(d.getTime()) ? null : d
  }

  const loadWorkshopData = async (enrollmentId?: number) => {
    try {
      setLoading(true)

      // 1. Cargar temas o tópicos del documento
      let temasData: any[] = []

      if (isDocument) {
        const { data: topicsData, error: topicsError } = await supabase
          .from('document_topics')
          .select('*')
          .eq('activity_id', activityId)
          .order('id')

        if (topicsError) console.error('Error loading document topics', topicsError)

        // Map document_topics to TallerDetalle structure
        temasData = (topicsData || []).map((topic: any) => ({
          id: topic.id,
          nombre: topic.title,
          descripcion: topic.description,
          pdf_url: topic.pdf_url,
          pdf_file_name: topic.pdf_filename,
          originales: { fechas_horarios: [] } // Document topics don't have schedules
        }))

        // Load document progress
        let progressQuery = supabase
          .from('client_document_progress')
          .select('topic_id, completed')
          .eq('client_id', user!.id)
          .eq('activity_id', activityId)

        if (enrollmentId) {
          progressQuery = progressQuery.eq('enrollment_id', enrollmentId)
        }

        const { data: progressData } = await progressQuery

        if (progressData) {
          const progressMap: Record<number, boolean> = {}
          progressData.forEach((p: any) => {
            progressMap[p.topic_id] = p.completed
          })
          setDocumentProgress(progressMap)
        }

      } else {
        const { data: workshopTemas, error: temasError } = await supabase
          .from('taller_detalles')
          .select('*')
          .eq('actividad_id', activityId)
          .order('id')

        if (temasError) {
          console.error('❌ Error cargando temas:', temasError)
          return
        }
        temasData = workshopTemas || []
      }

      setTemas(temasData)

      // 2. For WORKSHOPS ONLY: Check if progress records exist
      // Documents use client_document_progress table, not taller_progreso_temas
      let existingProgress: any = null // Declare outside for versioning check later
      let ejecucionId: number | null = null // Declare outside so it's accessible later

      if (isDocument) {
        // For documents, we don't need ejecucion_id, skip to loading progress
        setEjecucionId(0) // Not used for documents
      } else {
        // WORKSHOP: Check if progress records exist for this client+activity AND enrollment
        let progressQuery = supabase
          .from('taller_progreso_temas')
          .select('ejecucion_id, created_at')
          .eq('cliente_id', user!.id)
          .eq('actividad_id', activityId)

        if (enrollmentId) {
          progressQuery = progressQuery.eq('enrollment_id', enrollmentId)
        }

        const { data: progressData } = await progressQuery.limit(1)

        existingProgress = progressData

        if (existingProgress && existingProgress.length > 0) {
          // Use existing ejecucion_id
          ejecucionId = existingProgress[0].ejecucion_id
        } else {
          // Generate new ejecucion_id (simple counter based on max + 1)
          const { data: maxEjecucion } = await supabase
            .from('taller_progreso_temas')
            .select('ejecucion_id')
            .order('ejecucion_id', { ascending: false })
            .limit(1)

          ejecucionId = maxEjecucion && maxEjecucion.length > 0 ? (maxEjecucion[0] as any).ejecucion_id + 1 : 1

          // Create initial progress records (snapshot)
          if (temasData.length > 0) {
            const progressRecords = temasData.map((t: any) => ({
              ejecucion_id: ejecucionId,
              cliente_id: user!.id,
              actividad_id: activityId,
              enrollment_id: enrollmentId, // IMPORTANT: Save enrollment_id
              tema_id: t.id,
              snapshot_originales: t.originales || null,
              estado: 'pendiente'
            }))

            const { error: batchError } = await (supabase
              .from('taller_progreso_temas') as any)
              .insert(progressRecords)

            if (batchError) {
              console.error('Error creating topic snapshots:', batchError)
            }
          }
        }
      }

      setEjecucionId(ejecucionId)

      // 3. Fetch topic progress WITHOUT JOIN (no FK relationship exists)
      // Only fetch if ejecucionId is valid
      let topicProgress: any = null
      let progressError: any = null

      if (ejecucionId !== null && ejecucionId !== undefined) {
        const result = await supabase
          .from('taller_progreso_temas')
          .select('*')
          .eq('ejecucion_id', ejecucionId)

        topicProgress = result.data
        progressError = result.error
      }

      if (progressError) {
        console.error('❌ [Workshop] Error fetching progress:', progressError)
      }

      console.log('🔍 [Workshop] Topic progress data:', topicProgress)
      console.log('🔍 [Workshop] Ejecucion ID:', ejecucionId)
      console.log('🔍 [Workshop] Activity ID:', activityId)
      console.log('🔍 [Workshop] Client ID:', user!.id)

      // 4. Fetch taller_detalles separately and merge
      let tallerDetallesMap: Record<number, any> = {}
      if (topicProgress && topicProgress.length > 0) {
        const temaIds = topicProgress.map((p: any) => p.tema_id)
        const { data: detalles } = await supabase
          .from('taller_detalles')
          .select('*')
          .in('id', temaIds)

        if (detalles) {
          detalles.forEach((d: any) => {
            tallerDetallesMap[d.id] = d
          })
        }
      }

      const cubiertos: TemaEstado[] = []
      const pendientes: TemaEstado[] = []

      // Map DB rows to component state structure
      if (topicProgress) {
        topicProgress.forEach((row: any) => {
          const temaDetails = tallerDetallesMap[row.tema_id]
          const item: TemaEstado = {
            tema_id: row.tema_id,
            tema_nombre: temaDetails?.nombre || 'Sin nombre',
            fecha_seleccionada: row.fecha_seleccionada,
            horario_seleccionado: row.horario_seleccionado,
            // Convert string booleans to actual booleans
            confirmo_asistencia: row.confirmo_asistencia === true || row.confirmo_asistencia === 'true',
            asistio: row.asistio === true || row.asistio === 'true',
            pdf_url: temaDetails?.pdf_url,
            pdf_file_name: temaDetails?.pdf_file_name,
            // Attach snapshot to item for strict versioning access
            ...({ snapshot_originales: row.snapshot_originales } as any)
          }

          if (item.confirmo_asistencia || item.asistio) {
            cubiertos.push(item)
          } else {
            pendientes.push(item)
          }
        })
      }

      setTemasCubiertos(cubiertos)
      setTemasPendientes(pendientes)


      // 4. Versioning (Solo si es workshop real, aunque para docs no afecta mucho)
      if (!isDocument) {
        try {
          const { data: activityInfo } = await supabase
            .from('activities')
            .select('workshop_versions')
            .eq('id', activityId)
            .single()

          const versions = (activityInfo as any)?.workshop_versions?.versions || []
          if (versions.length > 0) {
            const lastVersion = versions[versions.length - 1]
            const lastVersionStart = parseSpanishDate(lastVersion?.empezada_el)
            // Use created_at from first progress record to determine version
            const progressCreatedAt = existingProgress && existingProgress.length > 0 ? (existingProgress[0] as any).created_at : null
            const progressDate = progressCreatedAt ? new Date(progressCreatedAt) : null
            if (lastVersionStart && progressDate) {
              setIsOnCurrentWorkshopVersion(progressDate >= lastVersionStart)
            }
          }
        } catch (e) { console.error(e) }
      }

      // 5. Cupos (Solo workshops)
      if (!isDocument) {
        await loadCuposOcupados()
      }

    } catch (error) {
      console.error('❌ Error general:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCuposOcupados = async () => {
    try {
      // Must now count from taller_progreso_temas
      const { data: progress } = await supabase
        .from('taller_progreso_temas')
        .select('*')
        .eq('actividad_id', activityId)
        .or('confirmo_asistencia.eq.true,asistio.eq.true')

      const cupos: Record<string, number> = {}
      progress?.forEach((row: any) => {
        if (row.fecha_seleccionada && row.horario_seleccionado) {
          // Handle jsonb potentially being string or object
          const horaInicio = typeof row.horario_seleccionado === 'string'
            ? JSON.parse(row.horario_seleccionado).hora_inicio
            : row.horario_seleccionado.hora_inicio

          const key = `${row.tema_id}-${row.fecha_seleccionada}-${horaInicio}`
          cupos[key] = (cupos[key] || 0) + 1
        }
      })
      setCuposOcupados(cupos)
    } catch (error) { console.error(error) }
  }

  const handleSelectHorario = (temaId: number, temaNombre: string, fecha: string, horario: any) => {
    const cupoKey = `${temaId}-${fecha}-${horario.hora_inicio}`
    const ocupados = cuposOcupados[cupoKey] || 0
    if (ocupados >= horario.cupo) {
      alert('Este horario está lleno.')
      return
    }
    setSelectedHorario({ temaId, temaNombre, fecha, horario })
    setShowConfirmModal(true)
  }

  const confirmAsistencia = async () => {
    try {
      const { temaId, temaNombre, fecha, horario } = selectedHorario
      const temaCubierto = {
        asistio: false,
        tema_id: temaId,
        tema_nombre: temaNombre,
        fecha_seleccionada: fecha,
        confirmo_asistencia: true,
        horario_seleccionado: { hora_inicio: horario.hora_inicio, hora_fin: horario.hora_fin }
      }
      const nuevosTemasCubiertos = [...temasCubiertos, temaCubierto as TemaEstado]
      const { error } = await (supabase.from('taller_progreso_temas') as any)
        .update({
          confirmo_asistencia: true,
          estado: 'reservado',
          fecha_seleccionada: fecha,
          horario_seleccionado: { hora_inicio: horario.hora_inicio, hora_fin: horario.hora_fin }
        })
        .eq('ejecucion_id', ejecucionId as any)
        .eq('tema_id', temaId)

      if (error) { alert('Error al confirmar'); return; }

      // Reload data to refresh lists from DB
      await loadWorkshopData(enrollment?.id)

      const cupoKey = `${temaId}-${fecha}-${horario.hora_inicio}`
      setCuposOcupados(prev => ({ ...prev, [cupoKey]: (prev[cupoKey] || 0) + 1 }))
      setShowConfirmModal(false)
      setSelectedHorario(null)
      alert('¡Asistencia confirmada!')
    } catch (e) { alert('Error confirmando') }
  }

  const cancelConfirmacion = () => { setShowConfirmModal(false); setSelectedHorario(null); }

  const editarReservacion = async (temaId: number) => {
    const temaCubierto = temasCubiertos.find(t => t.tema_id === temaId)
    if (!temaCubierto) return

    if (!canEditReservation(temaCubierto.fecha_seleccionada!, temaCubierto.horario_seleccionado!.hora_inicio)) {
      alert('❌ Los cambios solo son posibles con 48 horas o más de antelación al evento.')
      return
    }

    const cupoKey = `${temaId}-${temaCubierto.fecha_seleccionada}-${temaCubierto.horario_seleccionado.hora_inicio}`
    setCuposOcupados(prev => ({ ...prev, [cupoKey]: Math.max(0, (prev[cupoKey] || 1) - 1) }))

    // Update DB row state
    const { error } = await (supabase
      .from('taller_progreso_temas') as any)
      .update({
        fecha_seleccionada: null,
        horario_seleccionado: null,
        confirmo_asistencia: false,
        estado: 'pendiente'
      })
      .eq('ejecucion_id', ejecucionId as any)
      .eq('tema_id', temaId)

    if (!error) {
      // Optimistically update lists
      setTemasCubiertos(prev => prev.filter(t => t.tema_id !== temaId))
      // Need to re-add to pendientes with cleared data, reusing snapshot logic if possible
      // Easiest is to reload or manually move.
      // Let's reload for safety with this complex state
      loadWorkshopData(enrollment?.id)
      setExpandedTema(temaId)
    }
  }



  const getTemaData = (temaId: number) => temas.find(t => t.id === temaId)
  const getTemaEstado = (temaId: number) => {
    const temaCubierto = temasCubiertos.find(t => t.tema_id === temaId)
    if (temaCubierto?.asistio) return 'completado'
    if (temaCubierto && !temaCubierto.asistio) return 'reservado'
    return 'pendiente'
  }
  const canEditReservation = (fecha: string, hora: string) => {
    if (!fecha || !hora) return false
    const eventDate = new Date(`${fecha}T${hora}`)
    const diff = (eventDate.getTime() - new Date().getTime()) / (1000 * 3600)
    return diff >= 48
  }
  const formatDate = (d: string) => {
    if (!d) return d
    try {
      // Handle YYYY-MM-DD or other formats
      const date = d.includes('-') ? new Date(d + 'T12:00:00') : new Date(d)
      return format(date, "dd 'de' MMMM", { locale: es })
    } catch { return d }
  }

  const isTemaFinalizado = (temaId: number) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1. Check if user already attended or reserved a past date
    const cubierto = temasCubiertos.find(t => t.tema_id === temaId)
    if (cubierto?.fecha_seleccionada) {
      const selectedDate = new Date(cubierto.fecha_seleccionada + 'T00:00:00')
      return selectedDate < today
    }



    // 3. If no reservation (pendiente), check if ALL available schedules have passed
    const pendiente = temasPendientes.find(t => t.tema_id === temaId)
    // Access snapshot
    const snapshot = (pendiente as any)?.snapshot_originales
    const horarios = snapshot?.fechas_horarios || []

    if (horarios.length > 0) {
      // Check if any schedule is in the future (or today)
      // If we find at least one future date, topic is NOT finalized (user can still book)
      const hasFutureDates = horarios.some((h: any) => {
        const hDate = new Date(h.fecha)
        // We include today as "not passed"
        return hDate >= today
      })
      // If NO future dates, then it IS finalized (missed)
      return !hasFutureDates
    }

    // If no schedules and no reservation, maybe it's just empty/tbd. 
    // But usually implies nothing to do. Let's keep false if likely just TBD, or true if strictly "finished"?
    // If snapshot is empty, let's treat as "nothing available" -> not necessarily "Finalizado" badge, 
    // maybe just empty state. But user wants to hide stuff.
    // Let's return false here to fallback to "No hay horarios" message, unless we want to hide that too.
    return false
  }

  // Check if workshop has expired
  const isWorkshopExpired = () => {
    if (!enrollment?.expiration_date) return false
    const expDate = new Date(enrollment.expiration_date)
    return expDate < new Date()
  }

  // Calculate attendance summary
  const getAttendanceSummary = () => {
    const totalTopics = temas.length
    const attendedTopics = temasCubiertos.filter(t => t.asistio).length
    return { totalTopics, attendedTopics }
  }

  const toggleDocumentTopic = async (topicId: number) => {
    if (!user) return
    const current = documentProgress[topicId] || false
    const newValue = !current

    // Optimistic update
    setDocumentProgress(prev => ({ ...prev, [topicId]: newValue }))

    const { error } = await (supabase
      .from('client_document_progress') as any)
      .upsert({
        client_id: user.id,
        activity_id: activityId,
        topic_id: topicId,
        completed: newValue,
        completed_at: newValue ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id, activity_id, topic_id' })

    if (error) {
      console.error('Error updating progress:', error)
      // Revert if error
      setDocumentProgress(prev => ({ ...prev, [topicId]: current }))
    }
  }

  const handleDownloadPdf = (url: string) => {
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-black">
        {activityImageUrl && (
          <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm" style={{ backgroundImage: `url(${activityImageUrl})` }} />
        )}
        <div className="relative z-10 text-white animate-pulse">Cargando contenido...</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen text-white bg-black">
      {activityImageUrl && (
        <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${activityImageUrl})` }}>
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90 backdrop-blur-[2px]" />
        </div>
      )}

      <div className="relative z-10 pt-20 px-4 pb-32 max-w-4xl mx-auto">

        {/* HEADER SECTION with Glassmorphism */}
        <div className="mb-8 p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">{activityTitle}</h1>

          {activityDescription && (
            <div className="text-gray-300 text-sm leading-relaxed">
              <p className={isDescriptionExpanded ? '' : 'line-clamp-3'}>
                {activityDescription}
              </p>
              {activityDescription.length > MAX_DESCRIPTION_LENGTH && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="mt-2 text-[#FF7939] text-xs font-semibold hover:text-[#FF9F70] flex items-center gap-1"
                >
                  {isDescriptionExpanded ? 'Mostrar menos' : 'Ver más'}
                  {isDescriptionExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Workshop Completion Banner */}
        {!isDocument && isWorkshopExpired() && (
          <div className="mb-4 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-base mb-1">Taller Finalizado</h3>
                <div className="text-gray-400 text-xs space-y-0.5 mb-3">
                  {(() => {
                    const { totalTopics, attendedTopics } = getAttendanceSummary()
                    return (
                      <>
                        <p>Total: <strong>{totalTopics}</strong> temas</p>
                        <p>Asistencia: <strong>{attendedTopics}</strong>/{totalTopics} clases</p>
                      </>
                    )
                  })()}
                </div>
                {!isRated ? (
                  <button
                    onClick={() => setIsRatingModalOpen(true)}
                    className="border border-white/20 hover:bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 w-max"
                  >
                    <Star className="w-3.5 h-3.5 text-[#FF7939]" />
                    Calificar talle
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-green-500/80 text-xs font-medium">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Calificado
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 
            SI ES WORKSHOP: Mostrar Sesiones Próximas (reservas).
            SI ES DOCUMENTO: No mostrar esto (no hay sesión en vivo).
            SOLO MOSTRAR SI SON FUTURAS.
        */}
        {!isDocument && temasCubiertos.filter(tema => {
          if (tema.asistio) return false // Already attended
          if (!tema.fecha_seleccionada) return false
          const date = new Date(tema.fecha_seleccionada)
          date.setHours(23, 59, 59) // End of day
          return date >= new Date() // Only future or today
        }).length > 0 && (
            <>
              <h2 className="text-lg font-bold text-white mb-4 px-2">Próximas Sesiones</h2>
              <div className="space-y-3 mb-8">
                {temasCubiertos.filter(tema => {
                  if (tema.asistio) return false
                  if (!tema.fecha_seleccionada) return false
                  const date = new Date(tema.fecha_seleccionada)
                  date.setHours(23, 59, 59)
                  return date >= new Date()
                }).map((tema) => (
                  <div key={tema.tema_id} className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold mb-1">{tema.tema_nombre}</div>
                      <div className="text-gray-400 text-xs flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-[#FF7939]" />
                        {tema.fecha_seleccionada && formatDate(tema.fecha_seleccionada)}
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                        <Clock className="w-3 h-3 text-[#FF7939]" />
                        {tema.horario_seleccionado?.hora_inicio} a {tema.horario_seleccionado?.hora_fin}
                      </div>
                    </div>
                    <CheckCircle className="w-6 h-6 text-[#FF7939]" />
                  </div>
                ))}
              </div>
            </>
          )}

        {/* LISTA DE TEMAS / CAPÍTULOS */}
        <div>
          <div className="flex items-center justify-between mb-5 px-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {isDocument ? <AlignLeft className="w-5 h-5 text-[#FF7939]" /> : null}
              {isDocument ? 'Contenido' : 'Temas del Taller'}
            </h2>
            {!isDocument ? (
              <div className="flex items-center gap-3 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                <span className="text-xs font-bold text-[#FF7939]">{temasCubiertos.filter(t => t.asistio).length} / {temas.length}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                <span className="text-xs font-bold text-[#FF7939]">{Object.values(documentProgress).filter(Boolean).length} / {temas.length}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {temas.map((tema) => {
              const temaData = getTemaData(tema.id)
              if (!temaData) return null
              const estado = getTemaEstado(tema.id)
              const isExpanded = expandedTema === tema.id

              return (
                <div key={tema.id} className="group bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-all duration-300 hover:border-white/20 hover:bg-black/50">
                  <div className="p-5 cursor-pointer" onClick={() => setExpandedTema(isExpanded ? null : tema.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-white font-semibold text-base group-hover:text-[#FF7939] transition-colors">{temaData.nombre}</h3>
                          {!isDocument && estado === 'completado' && <CheckCircle className="w-4 h-4 text-green-400" />}
                          {!isDocument && isTemaFinalizado(tema.id) && <span className="bg-gray-700 text-gray-300 text-[10px] px-2 py-0.5 rounded-full border border-gray-600">Finalizado</span>}
                          {!isDocument && estado === 'reservado' && !isTemaFinalizado(tema.id) && <span className="bg-[#FF7939]/20 text-[#FF7939] text-[10px] px-2 py-0.5 rounded-full border border-[#FF7939]/30">Reservado</span>}

                          {isDocument && (
                            <div
                              onClick={(e) => { e.stopPropagation(); toggleDocumentTopic(tema.id); }}
                              className={`ml-2 p-1 rounded-full border transition-all cursor-pointer ${documentProgress[tema.id]
                                ? 'bg-[#FF7939]/20 border-[#FF7939] text-[#FF7939]'
                                : 'border-gray-600 text-gray-600 hover:border-[#FF7939]/50'
                                }`}
                            >
                              {documentProgress[tema.id] ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full" />}
                            </div>
                          )}
                        </div>
                        {/* Status Details for Workshop: Attendance Info */}
                        {!isDocument && (
                          <div className="flex flex-col gap-1 mt-1">
                            {/* Description Preview */}
                            {!isExpanded && temaData.descripcion && (
                              <p className="text-gray-400 text-xs line-clamp-1">{temaData.descripcion}</p>
                            )}
                            {/* Attendance Info - Prominent */}
                            {(() => {
                              const cubierto = temasCubiertos.find(t => Number(t.tema_id) === Number(tema.id))
                              if (cubierto?.asistio) {
                                return (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                                    <p className="text-green-400 text-[11px] font-semibold">Asististe el {formatDate(cubierto.fecha_seleccionada!)}</p>
                                  </div>
                                )
                              }
                              // NEW: Logic for "Ausente" / "No Asistió"
                              // If reservation passed OR no reservation but session passed
                              if (isTemaFinalizado(tema.id)) {
                                if (cubierto?.fecha_seleccionada) {
                                  // Reservó pero no tiene asistio=true y fecha pasó
                                  return (
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <X className="w-3.5 h-3.5 text-red-400" />
                                      <p className="text-red-400 text-[11px] font-semibold">No asististe ({formatDate(cubierto.fecha_seleccionada)})</p>
                                    </div>
                                  )
                                }
                                // No reservó, pero fecha pasó (si tenía horarios)
                                return (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <X className="w-3.5 h-3.5 text-gray-400" />
                                    <p className="text-gray-400 text-[11px]">Clase finalizada - Ausente</p>
                                  </div>
                                )
                              }

                              if (estado === 'reservado' && cubierto?.fecha_seleccionada) {
                                return (
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                                    <p className="text-gray-500 text-[11px] font-medium">Te inscribiste para el {formatDate(cubierto.fecha_seleccionada)}</p>
                                  </div>
                                )
                              }
                              return null
                            })()}
                          </div>
                        )}
                        {/* Document Description Preview only */}
                        {isDocument && !isExpanded && temaData.descripcion && (
                          <p className="text-gray-400 text-xs line-clamp-1 mt-1">{temaData.descripcion}</p>
                        )}
                      </div>
                      <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }} className="transition-transform duration-300 bg-white/5 p-1 rounded-full">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0">
                      {/* Simple Content: Description + PDF */}
                      <div className="px-1 text-gray-300 text-sm leading-relaxed space-y-4">
                        {temaData.descripcion && (
                          <p>{temaData.descripcion}</p>
                        )}

                        {/* WORKSHOP MODE: Reservation Controls (if not finalized) */}
                        {!isDocument && !isTemaFinalizado(tema.id) && (
                          <div className="pt-2">
                            {estado === 'reservado' ? (
                              <div className="bg-[#FF7939]/10 rounded-xl p-3 border border-[#FF7939]/30 flex justify-between items-center">
                                <div className="text-sm">
                                  <div className="font-semibold text-[#FF7939]">Tu Reserva</div>
                                  {(() => {
                                    const tc = temasCubiertos.find(t => t.tema_id === tema.id)
                                    return tc ? <span className="text-gray-200 text-xs">{formatDate(tc.fecha_seleccionada!)} • {tc.horario_seleccionado?.hora_inicio}</span> : null
                                  })()}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); editarReservacion(tema.id); }} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              estado === 'pendiente' && (
                                <div className="mt-2">
                                  {/* Horarios rendering logic kept similar but tighter */}
                                  {(() => {
                                    const temaPendiente = temasPendientes.find(t => t.tema_id === tema.id)
                                    const horarios = (temaPendiente as any)?.snapshot_originales?.fechas_horarios || []
                                    const filtered = horarios.filter((h: any) => !enrollment?.expiration_date || h.fecha <= enrollment.expiration_date.split('T')[0])

                                    if (filtered.length === 0) return null

                                    return (
                                      <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">Horarios Disponibles</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                          {filtered.map((horario: any, idx: number) => {
                                            const disponibles = horario.cupo - (cuposOcupados[`${temaData.id}-${horario.fecha}-${horario.hora_inicio}`] || 0)
                                            const isLleno = disponibles <= 0
                                            return (
                                              <div key={idx} onClick={() => !isLleno && handleSelectHorario(tema.id, temaData.nombre, horario.fecha, horario)}
                                                className={`flex justify-between items-center p-2.5 rounded-xl border cursor-pointer transition-all ${isLleno ? 'opacity-50 bg-gray-900 border-gray-800' : 'hover:border-[#FF7939] bg-white/5 border-white/5 hover:bg-[#FF7939]/5'}`}>
                                                <div className="flex flex-col">
                                                  <span className="text-white text-xs font-semibold">{formatDate(horario.fecha)}</span>
                                                  <span className="text-[10px] text-gray-500">{horario.hora_inicio} - {horario.hora_fin}</span>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isLleno ? 'bg-red-400/10 text-red-400' : 'bg-emerald-400/10 text-emerald-400'}`}>
                                                  {disponibles} cupos
                                                </span>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )
                                  })()}
                                </div>
                              )
                            )}
                          </div>
                        )}

                        {/* Resources Section - Uniform & Compact */}
                        {temaData.pdf_url && (
                          <div className="pt-2">
                            <div className="bg-white/5 rounded-xl px-3 py-2.5 border border-white/10 flex items-center justify-between hover:border-[#FF7939]/30 transition-colors group/pdf">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-4 h-4 text-red-500/80" />
                                <span className="text-xs text-gray-400 truncate group-hover/pdf:text-gray-200 transition-colors">
                                  {temaData.pdf_file_name || 'Material PDF'}
                                </span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadPdf(temaData.pdf_url!); }}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-[#FF7939] hover:text-[#FF9F70] transition-colors bg-[#FF7939]/10 px-2 py-1 rounded-lg"
                              >
                                <Download className="w-3 h-3" />
                                DESCARGAR
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {showConfirmModal && selectedHorario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={cancelConfirmacion} />
          <div className="relative bg-[#1A1A1A] rounded-3xl p-6 border border-white/10 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Confirmar Reserva</h3>
            <p className="text-gray-400 text-sm mb-6">Estás a punto de reservar turno para:</p>

            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 mb-6">
              <div className="font-semibold text-white mb-1">{selectedHorario.temaNombre}</div>
              <div className="text-[#FF7939] text-sm">{formatDate(selectedHorario.fecha)} &bull; {selectedHorario.horario.hora_inicio}</div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={cancelConfirmacion} className="flex-1 border-white/10 text-gray-300 hover:bg-white/5 hover:text-white rounded-xl h-12">Cancelar</Button>
              <Button onClick={confirmAsistencia} className="flex-1 bg-[#FF7939] hover:bg-[#E66829] text-white rounded-xl h-12 font-bold shadow-lg shadow-[#FF7939]/20">Confirmar</Button>
            </div>
          </div>
        </div>
      )}
      {/* Rating Modal */}
      <ActivitySurveyModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        activityTitle={activityTitle}
        onComplete={async (activityRating, coachRating, feedback, wouldRepeat, omniaRating, omniaComments) => {
          try {
            // Updated rating logic to use activity_surveys table to avoid schema cache issues with activity_enrollments
            const { error: surveyError } = await (supabase
              .from('activity_surveys') as any)
              .insert({
                activity_id: activityId,
                client_id: user!.id,
                enrollment_id: enrollment?.id,
                difficulty_rating: activityRating,
                coach_method_rating: coachRating,
                comments: feedback,
                would_repeat: wouldRepeat,
                calificacion_omnia: omniaRating,
                comentarios_omnia: omniaComments,
                created_at: new Date().toISOString()
              })

            if (surveyError) throw surveyError

            // Mark as finished in enrollments separately
            await (supabase
              .from('activity_enrollments') as any)
              .update({ status: 'finalizada' })
              .eq('id', enrollment.id)

            setIsRated(true)
            setIsRatingModalOpen(false)
          } catch (error) {
            console.error('Error submitting rating:', error)
            alert('Error al enviar la calificación')
          }
        }}
      />
    </div>
  )
}
