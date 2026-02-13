"use client"

import { useState } from 'react'
import { Calendar, Clock, CheckCircle, AlignLeft } from "lucide-react"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { WorkshopClientViewProps } from './types'
import { useWorkshopLogic } from './hooks/useWorkshopLogic'
import { WorkshopHeader } from './components/WorkshopHeader'
import { WorkshopTopicItem } from './components/WorkshopTopicItem'
import { WorkshopModals } from './components/WorkshopModals'
import { useAuth } from '@/contexts/auth-context'

export function WorkshopClientView({
    activityId,
    activityTitle,
    activityDescription,
    activityImageUrl,
    isDocument = false
}: WorkshopClientViewProps) {
    const { user } = useAuth()
    const {
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
    } = useWorkshopLogic(activityId, isDocument)

    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
    const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)

    const formatDate = (d: string) => {
        if (!d) return d
        try {
            const date = d.includes('-') ? new Date(d + 'T12:00:00') : new Date(d)
            return format(date, "dd 'de' MMMM", { locale: es })
        } catch { return d }
    }

    const isTemaFinalizado = (temaId: number) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const cubierto = temasCubiertos.find(t => t.tema_id === temaId)
        if (cubierto?.fecha_seleccionada) {
            const selectedDate = new Date(cubierto.fecha_seleccionada + 'T00:00:00')
            return selectedDate < today
        }
        const pendiente = temasPendientes.find(t => t.tema_id === temaId)
        const snapshot = (pendiente as any)?.snapshot_originales
        const horarios = snapshot?.fechas_horarios || []
        if (horarios.length > 0) {
            const hasFutureDates = horarios.some((h: any) => new Date(h.fecha) >= today)
            return !hasFutureDates
        }
        return false
    }

    const isWorkshopExpired = () => {
        if (!enrollment?.expiration_date) return false
        return new Date(enrollment.expiration_date) < new Date()
    }

    const getAttendanceSummary = () => {
        return {
            totalTopics: temas.length,
            attendedTopics: temasCubiertos.filter(t => t.asistio).length
        }
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
                    <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/80 to-black/95 backdrop-blur-[30px]" />
                </div>
            )}

            <div className="relative z-10 pt-20 px-4 pb-32 max-w-4xl mx-auto">
                <WorkshopHeader
                    activityTitle={activityTitle}
                    activityDescription={activityDescription}
                    isDescriptionExpanded={isDescriptionExpanded}
                    setIsDescriptionExpanded={setIsDescriptionExpanded}
                    isDocument={isDocument}
                    isWorkshopExpired={isWorkshopExpired()}
                    attendanceSummary={getAttendanceSummary()}
                    isRated={isRated}
                    setIsRatingModalOpen={setIsRatingModalOpen}
                />

                {!isDocument && temasCubiertos.filter(tema => {
                    if (tema.asistio || !tema.fecha_seleccionada) return false
                    const date = new Date(tema.fecha_seleccionada)
                    date.setHours(23, 59, 59)
                    return date >= new Date()
                }).length > 0 && (
                        <>
                            <h2 className="text-lg font-bold text-white mb-4 px-2">Próximas Sesiones</h2>
                            <div className="space-y-3 mb-8">
                                {temasCubiertos.filter(tema => {
                                    if (tema.asistio || !tema.fecha_seleccionada) return false
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

                <div>
                    <div className="flex items-center justify-between mb-5 px-2">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {isDocument ? <AlignLeft className="w-5 h-5 text-[#FF7939]" /> : null}
                            {isDocument ? 'Contenido' : 'Temas del Taller'}
                        </h2>
                        <div className="flex items-center gap-3 bg-black/30 px-3 py-1 rounded-full border border-white/5">
                            <span className="text-xs font-bold text-[#FF7939]">
                                {isDocument
                                    ? `${Object.values(documentProgress).filter(Boolean).length} / ${temas.length}`
                                    : `${temasCubiertos.filter(t => t.asistio).length} / ${temas.length}`}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {temas.map((tema) => (
                            <WorkshopTopicItem
                                key={tema.id}
                                tema={tema}
                                isExpanded={expandedTema === tema.id}
                                setExpanded={(val) => setExpandedTema(val ? tema.id : null)}
                                isDocument={isDocument}
                                documentProgress={documentProgress[tema.id] || false}
                                toggleDocumentTopic={() => toggleDocumentTopic(tema.id)}
                                temaEstado={temasCubiertos.find(t => t.tema_id === tema.id)?.asistio ? 'completado' : (temasCubiertos.find(t => t.tema_id === tema.id) ? 'reservado' : 'pendiente')}
                                isTemaFinalizado={isTemaFinalizado(tema.id)}
                                temaCubierto={temasCubiertos.find(t => t.tema_id === tema.id)}
                                temaPendiente={temasPendientes.find(t => t.tema_id === tema.id)}
                                handleSelectHorario={handleSelectHorario}
                                editarReservacion={editarReservacion}
                                cuposOcupados={cuposOcupados}
                                expirationDate={enrollment?.expiration_date}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {user && enrollment && (
                <WorkshopModals
                    showConfirmModal={showConfirmModal}
                    selectedHorario={selectedHorario}
                    cancelConfirmacion={() => { setShowConfirmModal(false); setSelectedHorario(null); }}
                    confirmAsistencia={confirmAsistencia}
                    isRatingModalOpen={isRatingModalOpen}
                    setIsRatingModalOpen={setIsRatingModalOpen}
                    activityTitle={activityTitle}
                    activityId={activityId}
                    userId={user.id}
                    enrollmentId={enrollment.id}
                    setIsRated={setIsRated}
                />
            )}
        </div>
    )
}
