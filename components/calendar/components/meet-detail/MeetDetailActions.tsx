
import React from 'react'
import { Globe, RotateCcw, Video } from 'lucide-react'
import { isToday } from 'date-fns'

interface MeetDetailActionsProps {
    isMyRsvpConfirmed: boolean
    isCancelled: boolean
    isPast: boolean
    selectedMeetEvent: any
    pendingReschedule: any
    authUserId: string | null
    selectedMeetRsvpLoading: boolean
    canEditRsvp: boolean
    onAcceptReschedule: () => void
    onDeclineReschedule: () => void
    onRescheduleClick: () => void
    onCancelRescheduleRequest: () => void
    onAcceptInvitation: () => void
    onDeclineInvitation: () => void
    onSuggestNewTime: () => void
    onCancelParticipation: () => void
    isSentByMe: boolean
    myRsvp: string
    isMyRsvpDeclined: boolean
    onReschedule: any
    isCoachAccepted: boolean
}

export const MeetDetailActions: React.FC<MeetDetailActionsProps> = ({
    isMyRsvpConfirmed,
    isCancelled,
    isPast,
    selectedMeetEvent,
    pendingReschedule,
    authUserId,
    selectedMeetRsvpLoading,
    canEditRsvp,
    onAcceptReschedule,
    onDeclineReschedule,
    onRescheduleClick,
    onCancelRescheduleRequest,
    onAcceptInvitation,
    onDeclineInvitation,
    onSuggestNewTime,
    onCancelParticipation,
    isSentByMe,
    myRsvp,
    isMyRsvpDeclined,
    onReschedule,
    isCoachAccepted
}) => {
    const start = new Date(selectedMeetEvent.start_time)

    return (
        <div className="pt-2 flex flex-col gap-2">

            {pendingReschedule && pendingReschedule.status === 'pending' ? (
                <div className="flex flex-col gap-2 mt-2 p-4 rounded-2xl bg-[#FF7939]/5 border border-[#FF7939]/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-[10px] font-extrabold text-[#FFB366] uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
                        {pendingReschedule.requested_by_user_id === authUserId ? 'Tu solicitud de cambio' : 'Propuesta de cambio recibida'}
                    </div>

                    {pendingReschedule.requested_by_user_id !== authUserId ? (
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                disabled={selectedMeetRsvpLoading}
                                onClick={onAcceptReschedule}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-bold hover:brightness-110 transition-all disabled:opacity-60"
                            >
                                Aceptar Cambio
                            </button>
                            <button
                                type="button"
                                disabled={selectedMeetRsvpLoading}
                                onClick={onDeclineReschedule}
                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-medium border border-white/10 hover:bg-zinc-800 transition-colors disabled:opacity-60 text-center"
                            >
                                Rechazar este cambio
                            </button>
                            <div className="text-[10px] text-gray-500 text-center mt-1">
                                Si rechazás, la meet se mantiene en el horario original.
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="text-[10px] text-white/40 text-center uppercase tracking-widest font-bold">
                                Solicitud de cambio enviada
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    disabled={selectedMeetRsvpLoading}
                                    onClick={onRescheduleClick}
                                    className="px-3 py-2 rounded-xl bg-zinc-800 text-white text-[11px] font-bold border border-white/5 hover:bg-zinc-700 transition-colors"
                                >
                                    Modificar
                                </button>
                                <button
                                    type="button"
                                    disabled={selectedMeetRsvpLoading}
                                    onClick={onCancelRescheduleRequest}
                                    className="px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-[11px] font-bold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                                >
                                    Cancelar reprogramación
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {/* Branch 1: Pending Request (I sent it, coach hasn't accepted yet) */}
                    {isSentByMe && !isCoachAccepted && !isCancelled && !isPast && (
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                onClick={onSuggestNewTime}
                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60"
                            >
                                Modificar
                            </button>
                            <button
                                type="button"
                                disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                onClick={onCancelParticipation}
                                className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            >
                                Cancelar solicitud
                            </button>
                        </div>
                    )}

                    {/* Branch 2: Pending Invitation (I received it, I haven't confirmed yet) */}
                    {!isSentByMe && !isMyRsvpConfirmed && !isCancelled && !isMyRsvpDeclined && !isPast && (
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                onClick={onAcceptInvitation}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-60"
                            >
                                Aceptar invitación
                            </button>
                            <button
                                type="button"
                                disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                onClick={onSuggestNewTime}
                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60"
                            >
                                Sugerir nuevo horario
                            </button>
                            <button
                                type="button"
                                disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                onClick={onDeclineInvitation}
                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-sm border border-white/15 hover:bg-zinc-800 transition-colors disabled:opacity-60 text-center"
                            >
                                Rechazar
                            </button>
                        </div>
                    )}

                    {/* Branch 3: Confirmed Meet (Everyone confirmed - or coach confirmed if I invited) */}
                    {isMyRsvpConfirmed && isCoachAccepted && !isCancelled && !isPast && (
                        <div className="flex flex-col gap-2">
                            {(() => {
                                const meetLink = selectedMeetEvent.meet_link || selectedMeetEvent.google_meet_data?.meet_link;
                                if (!meetLink) return null;

                                if (isToday(start)) {
                                    return (
                                        <button
                                            type="button"
                                            onClick={() => window.open(String(meetLink), '_blank')}
                                            className="w-full px-4 py-2.5 rounded-xl bg-[#FF7939] text-black text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                        >
                                            <Video size={16} />
                                            Unirse a la Meet
                                        </button>
                                    );
                                }

                                if (!isPast) {
                                    return (
                                        <div className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/40 text-center font-medium">
                                            Link disponible el día de la meet
                                        </div>
                                    );
                                }

                                return null;
                            })()}
                            <button
                                type="button"
                                disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                onClick={onReschedule ? onRescheduleClick : onSuggestNewTime}
                                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition-colors disabled:opacity-60"
                            >
                                Reprogramar
                            </button>
                            <button
                                type="button"
                                disabled={selectedMeetRsvpLoading || !canEditRsvp}
                                onClick={onCancelParticipation}
                                className="w-full px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 text-sm font-semibold border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            >
                                {isSentByMe ? 'Cancelar solicitud' : 'Cancelar mi asistencia'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
