
import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface MeetDetailConfirmationsProps {
    showCancelConfirm: boolean
    setShowCancelConfirm: (show: boolean) => void
    confirmCancel: () => void
    selectedMeetRsvpLoading: boolean
    showWorkshopRescheduleWarning: boolean
    setShowWorkshopRescheduleWarning: (show: boolean) => void
    onReschedule: any
    selectedMeetEvent: any
}

export const MeetDetailConfirmations: React.FC<MeetDetailConfirmationsProps> = ({
    showCancelConfirm,
    setShowCancelConfirm,
    confirmCancel,
    selectedMeetRsvpLoading,
    showWorkshopRescheduleWarning,
    setShowWorkshopRescheduleWarning,
    onReschedule,
    selectedMeetEvent
}) => {
    return (
        <>
            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-2">¿Cancelar asistencia?</h3>
                        <p className="text-white/60 text-sm mb-6">
                            Esta acción no se puede deshacer. <br /><br />
                            <span className="text-red-400 font-medium">⚠️ Atención:</span> Si cancelas con menos de 24hs de anticipación, perderás el crédito de esta sesión.
                            <br /><br />
                            Si el horario no te conviene, te sugerimos cerrar esto y elegir "Reprogramar" o "Sugerir otro horario".
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCancelConfirm(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm font-semibold hover:bg-zinc-700 transition-colors"
                            >
                                Volver
                            </button>
                            <button
                                type="button"
                                onClick={confirmCancel}
                                disabled={selectedMeetRsvpLoading}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-60"
                            >
                                {selectedMeetRsvpLoading ? 'Cancelando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Workshop Reschedule Warning */}
            {showWorkshopRescheduleWarning && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-zinc-950 border border-[#FFB366]/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                        <div className="w-16 h-16 rounded-full bg-[#FFB366]/10 flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-[#FFB366]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">Aviso de Reputación</h3>
                        <p className="text-sm text-white/60 leading-relaxed mb-8">
                            Reprogramar un taller grupal puede afectar negativamente tu reputación como coach. Asegurate de que el cambio sea estrictamente necesario ya que impacta en múltiples participantes.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setShowWorkshopRescheduleWarning(false)
                                    if (onReschedule) onReschedule(selectedMeetEvent)
                                }}
                                className="w-full py-4 rounded-2xl bg-[#FFB366] text-black font-bold text-sm hover:opacity-90 transition-opacity"
                            >
                                Entendido, Reprogramar
                            </button>
                            <button
                                onClick={() => setShowWorkshopRescheduleWarning(false)}
                                className="w-full py-4 rounded-2xl bg-white/5 text-white/60 font-medium text-sm hover:bg-white/10 transition-colors"
                            >
                                Volver atrás
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
