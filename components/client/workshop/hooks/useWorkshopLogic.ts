import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/supabase-client'
import { useAuth } from '@/contexts/auth-context'
import { TallerDetalle, TemaEstado, TopicProgressMap, CuposMap } from '../types'

export function useWorkshopLogic(activityId: number, isDocument: boolean) {
    const { user } = useAuth()
    const supabase = createClient()

    const [temas, setTemas] = useState<TallerDetalle[]>([])
    const [ejecucionId, setEjecucionId] = useState<number | null>(null)
    const [temasCubiertos, setTemasCubiertos] = useState<TemaEstado[]>([])
    const [temasPendientes, setTemasPendientes] = useState<TemaEstado[]>([])
    const [expandedTema, setExpandedTema] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [cuposOcupados, setCuposOcupados] = useState<CuposMap>({})
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [selectedHorario, setSelectedHorario] = useState<any>(null)
    const [isOnCurrentWorkshopVersion, setIsOnCurrentWorkshopVersion] = useState(true)
    const [documentProgress, setDocumentProgress] = useState<TopicProgressMap>({})
    const [enrollment, setEnrollment] = useState<any>(null)
    const [isRated, setIsRated] = useState(false)

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

    const loadEnrollment = async () => {
        if (!user?.id) return null
        const { data } = await supabase
            .from('activity_enrollments')
            .select('*')
            .eq('client_id', user.id)
            .eq('activity_id', activityId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (data) {
            setEnrollment(data)
            setIsRated((data as any).status === 'finalizada' && (((data as any).rating_activity !== null && (data as any).rating_activity !== undefined) || ((data as any).feedback !== null && (data as any).feedback !== undefined)))
        }
        return data
    }

    const loadCuposOcupados = async () => {
        try {
            const { data: progress } = await supabase
                .from('taller_progreso_temas')
                .select('*')
                .eq('actividad_id', activityId)
                .or('confirmo_asistencia.eq.true,asistio.eq.true')

            const cupos: CuposMap = {}
            progress?.forEach((row: any) => {
                if (row.fecha_seleccionada && row.horario_seleccionado) {
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

    const loadWorkshopData = async (enrollmentId?: number) => {
        if (!user?.id) return
        try {
            setLoading(true)
            let temasData: any[] = []

            if (isDocument) {
                const { data: topicsData } = await supabase
                    .from('document_topics')
                    .select('*')
                    .eq('activity_id', activityId)
                    .order('id')

                temasData = (topicsData || []).map((topic: any) => ({
                    id: topic.id,
                    nombre: topic.title,
                    descripcion: topic.description,
                    pdf_url: topic.pdf_url,
                    pdf_file_name: topic.pdf_filename,
                    originales: { fechas_horarios: [] }
                }))

                let progressQuery = supabase
                    .from('client_document_progress')
                    .select('topic_id, completed')
                    .eq('client_id', user.id)
                    .eq('activity_id', activityId)

                if (enrollmentId) progressQuery = progressQuery.eq('enrollment_id', enrollmentId)

                const { data: progressData } = await progressQuery
                if (progressData) {
                    const progressMap: TopicProgressMap = {}
                    progressData.forEach((p: any) => {
                        progressMap[p.topic_id] = p.completed
                    })
                    setDocumentProgress(progressMap)
                }
            } else {
                const { data: workshopTemas } = await supabase
                    .from('taller_detalles')
                    .select('*')
                    .eq('actividad_id', activityId)
                    .order('id')
                temasData = workshopTemas || []
            }

            setTemas(temasData)

            let existingProgress: any = null
            let ejId: number | null = null

            if (isDocument) {
                setEjecucionId(0)
            } else {
                let progressQuery = supabase
                    .from('taller_progreso_temas')
                    .select('ejecucion_id, created_at')
                    .eq('cliente_id', user.id)
                    .eq('actividad_id', activityId)

                if (enrollmentId) progressQuery = progressQuery.eq('enrollment_id', enrollmentId)

                const { data: progressData } = await progressQuery.limit(1)
                existingProgress = progressData

                if (existingProgress && existingProgress.length > 0) {
                    ejId = existingProgress[0].ejecucion_id
                } else {
                    const { data: maxEjecucion } = await supabase
                        .from('taller_progreso_temas')
                        .select('ejecucion_id')
                        .order('ejecucion_id', { ascending: false })
                        .limit(1)

                    ejId = maxEjecucion && maxEjecucion.length > 0 ? (maxEjecucion[0] as any).ejecucion_id + 1 : 1

                    if (temasData.length > 0) {
                        const progressRecords = temasData.map((t: any) => ({
                            ejecucion_id: ejId,
                            cliente_id: user.id,
                            actividad_id: activityId,
                            enrollment_id: enrollmentId,
                            tema_id: t.id,
                            snapshot_originales: t.originales || null,
                            estado: 'pendiente'
                        }))
                        await (supabase.from('taller_progreso_temas') as any).insert(progressRecords)
                    }
                }
            }
            setEjecucionId(ejId)

            let topicProgress: any[] = []
            if (ejId !== null) {
                const { data } = await supabase
                    .from('taller_progreso_temas')
                    .select('*')
                    .eq('ejecucion_id', ejId)
                topicProgress = data || []
            }

            let tallerDetallesMap: Record<number, any> = {}
            if (topicProgress.length > 0) {
                const temaIds = topicProgress.map((p: any) => p.tema_id)
                const { data: detalles } = await supabase
                    .from('taller_detalles')
                    .select('*')
                    .in('id', temaIds)

                detalles?.forEach((d: any) => { tallerDetallesMap[d.id] = d })
            }

            const cubiertos: TemaEstado[] = []
            const pendientes: TemaEstado[] = []

            topicProgress.forEach((row: any) => {
                const temaDetails = tallerDetallesMap[row.tema_id]
                const item: TemaEstado = {
                    tema_id: row.tema_id,
                    tema_nombre: temaDetails?.nombre || 'Sin nombre',
                    fecha_seleccionada: row.fecha_seleccionada,
                    horario_seleccionado: row.horario_seleccionado,
                    confirmo_asistencia: row.confirmo_asistencia === true || row.confirmo_asistencia === 'true',
                    asistio: row.asistio === true || row.asistio === 'true',
                    pdf_url: temaDetails?.pdf_url,
                    pdf_file_name: temaDetails?.pdf_file_name,
                    snapshot_originales: row.snapshot_originales
                }
                if (item.confirmo_asistencia || item.asistio) cubiertos.push(item)
                else pendientes.push(item)
            })

            setTemasCubiertos(cubiertos)
            setTemasPendientes(pendientes)

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
                        const progressCreatedAt = existingProgress && existingProgress.length > 0 ? (existingProgress[0] as any).created_at : null
                        const progressDate = progressCreatedAt ? new Date(progressCreatedAt) : null
                        if (lastVersionStart && progressDate) {
                            setIsOnCurrentWorkshopVersion(progressDate >= lastVersionStart)
                        }
                    }
                } catch (e) { console.error(e) }
                await loadCuposOcupados()
            }
        } catch (error) {
            console.error('❌ Error general:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user?.id) {
            const init = async () => {
                const enr = await loadEnrollment()
                if (enr) loadWorkshopData(enr.id)
            }
            init()
        }
    }, [user?.id, activityId])

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
        if (!selectedHorario || !ejecucionId) return
        try {
            const { temaId, fecha, horario } = selectedHorario
            const { error } = await (supabase.from('taller_progreso_temas') as any)
                .update({
                    confirmo_asistencia: true,
                    estado: 'reservado',
                    fecha_seleccionada: fecha,
                    horario_seleccionado: { hora_inicio: horario.hora_inicio, hora_fin: horario.hora_fin }
                })
                .eq('ejecucion_id', ejecucionId)
                .eq('tema_id', temaId)

            if (error) { alert('Error al confirmar'); return; }
            await loadWorkshopData(enrollment?.id)
            setShowConfirmModal(false)
            setSelectedHorario(null)
            alert('¡Asistencia confirmada!')
        } catch (e) { alert('Error confirmando') }
    }

    const editarReservacion = async (temaId: number) => {
        const temaCubierto = temasCubiertos.find(t => t.tema_id === temaId)
        if (!temaCubierto || !ejecucionId) return

        const eventDate = new Date(`${temaCubierto.fecha_seleccionada}T${temaCubierto.horario_seleccionado?.hora_inicio}`)
        if ((eventDate.getTime() - new Date().getTime()) / (1000 * 3600) < 48) {
            alert('❌ Los cambios solo son posibles con 48 horas o más de antelación al evento.')
            return
        }

        const { error } = await (supabase.from('taller_progreso_temas') as any)
            .update({
                fecha_seleccionada: null,
                horario_seleccionado: null,
                confirmo_asistencia: false,
                estado: 'pendiente'
            })
            .eq('ejecucion_id', ejecucionId)
            .eq('tema_id', temaId)

        if (!error) {
            loadWorkshopData(enrollment?.id)
            setExpandedTema(temaId)
        }
    }

    const toggleDocumentTopic = async (topicId: number) => {
        if (!user) return
        const current = documentProgress[topicId] || false
        const newValue = !current

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
            setDocumentProgress(prev => ({ ...prev, [topicId]: current }))
        }
    }

    return {
        loading,
        temas,
        temasCubiertos,
        temasPendientes,
        expandedTema,
        setExpandedTema,
        cuposOcupados,
        showConfirmModal,
        setShowConfirmModal,
        selectedHorario,
        setSelectedHorario,
        isOnCurrentWorkshopVersion,
        documentProgress,
        enrollment,
        isRated,
        setIsRated,
        handleSelectHorario,
        confirmAsistencia,
        editarReservacion,
        toggleDocumentTopic,
        loadWorkshopData
    }
}
