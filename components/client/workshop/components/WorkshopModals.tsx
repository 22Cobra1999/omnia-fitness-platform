import { Button } from "@/components/ui/button"
import { ActivitySurveyModal } from "@/components/shared/activities/activity-survey-modal"
import { createClient } from '@/lib/supabase/supabase-client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface WorkshopModalsProps {
    showConfirmModal: boolean
    selectedHorario: any
    cancelConfirmacion: () => void
    confirmAsistencia: () => void
    isRatingModalOpen: boolean
    setIsRatingModalOpen: (val: boolean) => void
    activityTitle: string
    activityId: number
    userId: string
    enrollmentId: number
    setIsRated: (val: boolean) => void
}

export function WorkshopModals({
    showConfirmModal,
    selectedHorario,
    cancelConfirmacion,
    confirmAsistencia,
    isRatingModalOpen,
    setIsRatingModalOpen,
    activityTitle,
    activityId,
    userId,
    enrollmentId,
    setIsRated
}: WorkshopModalsProps) {
    const supabase = createClient()

    const formatDate = (d: string) => {
        if (!d) return d
        try {
            const date = d.includes('-') ? new Date(d + 'T12:00:00') : new Date(d)
            return format(date, "dd 'de' MMMM", { locale: es })
        } catch { return d }
    }

    return (
        <>
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

            <ActivitySurveyModal
                isOpen={isRatingModalOpen}
                onClose={() => setIsRatingModalOpen(false)}
                activityTitle={activityTitle}
                onComplete={async (activityRating, coachRating, feedback, wouldRepeat, omniaRating, omniaComments) => {
                    try {
                        const { error: surveyError } = await (supabase
                            .from('activity_surveys') as any)
                            .insert({
                                activity_id: activityId,
                                client_id: userId,
                                enrollment_id: enrollmentId,
                                difficulty_rating: activityRating,
                                coach_method_rating: coachRating,
                                comments: feedback,
                                would_repeat: wouldRepeat,
                                calificacion_omnia: omniaRating,
                                comentarios_omnia: omniaComments,
                                created_at: new Date().toISOString()
                            })

                        if (surveyError) throw surveyError

                        await (supabase
                            .from('activity_enrollments') as any)
                            .update({ status: 'finalizada' })
                            .eq('id', enrollmentId)

                        setIsRated(true)
                        setIsRatingModalOpen(false)
                    } catch (error) {
                        console.error('Error submitting rating:', error)
                        alert('Error al enviar la calificación')
                    }
                }}
            />
        </>
    )
}
