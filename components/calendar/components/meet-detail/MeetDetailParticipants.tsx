import React from 'react'
import { RotateCcw } from 'lucide-react'

interface MeetDetailParticipantsProps {
    hostParticipant: any
    coachProfile: any
    coachProfiles: any[]
    guests: any[]
    selectedMeetEvent: any
    authUserId: string | null
    organizerName: string
    eventStatus?: string
    onRefreshAttendance?: () => void
    isRefreshing?: boolean
}

export const MeetDetailParticipants: React.FC<MeetDetailParticipantsProps> = ({
    hostParticipant,
    coachProfile,
    coachProfiles,
    guests,
    selectedMeetEvent,
    authUserId,
    organizerName,
    eventStatus,
    onRefreshAttendance,
    isRefreshing
}) => {
    const isEventCancelled = eventStatus === 'cancelled' || selectedMeetEvent.status === 'cancelled'

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Participantes</div>
            </div>
            <div className="grid grid-cols-1 gap-4 text-sm">
                {/* Organizer */}
                <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {hostParticipant?.avatar_url || coachProfile?.avatar_url ? (
                                <img
                                    src={hostParticipant?.avatar_url || coachProfile?.avatar_url || ''}
                                    className="w-8 h-8 rounded-full object-cover bg-zinc-800"
                                    alt="Organizador"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                    {organizerName.substring(0, 2)}
                                </div>
                            )}
                            {(() => {
                                // Show organizer's individual RSVP status, not event-level status
                                const organizerRsvp = hostParticipant?.rsvp_status || 'pending';
                                const statusColor = (organizerRsvp === 'confirmed' || organizerRsvp === 'accepted')
                                    ? 'bg-[#FF7939]'
                                    : (organizerRsvp === 'declined' || organizerRsvp === 'cancelled'
                                        ? 'bg-red-500'
                                        : 'bg-[#FFB366]');
                                return <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${statusColor}`} />;
                            })()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-medium">{organizerName}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-[#FF7939] font-black uppercase tracking-widest">Organizador</span>
                                <span className="text-[10px] text-gray-500">•</span>
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                                    {hostParticipant?.role === 'coach' ? 'Coach' : 'Cliente'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {(() => {
                        // Show organizer's individual RSVP or Attendance status
                        const organizerRsvp = hostParticipant?.rsvp_status || 'pending';
                        const organizerAttendance = hostParticipant?.attendance_status;
                        const isFinalizada = eventStatus === 'past';
                        const isConfirmed = organizerRsvp === 'confirmed' || organizerRsvp === 'accepted';

                        let statusText = isConfirmed ? 'Confirmado' : (organizerRsvp === 'declined' || organizerRsvp === 'cancelled' ? 'Cancelado' : 'Pendiente');
                        let statusColor = isConfirmed ? 'text-[#FF7939]' : (organizerRsvp === 'declined' || organizerRsvp === 'cancelled' ? 'text-red-500' : 'text-[#FFB366]');

                        if (isFinalizada && isConfirmed && organizerAttendance) {
                            const attendanceText = organizerAttendance === 'present' ? 'Asistió' : 'No asistió';
                            const attendanceColor = organizerAttendance === 'present' ? 'text-green-400' : 'text-red-400';
                            
                            return (
                                <div className="flex flex-col items-end">
                                    <div className={`text-xs font-bold ${attendanceColor}`}>{attendanceText}</div>
                                    <div className={`text-[9px] font-bold text-gray-500 uppercase tracking-tight`}>Confirmado</div>
                                </div>
                            );
                        }

                        if (organizerAttendance === 'present') {
                            statusText = 'Asistió';
                            statusColor = 'text-green-400';
                        } else if (organizerAttendance === 'absent') {
                            statusText = 'No asistió';
                            statusColor = 'text-red-400';
                        }

                        if (isEventCancelled) {
                            if (organizerRsvp !== 'declined' && organizerRsvp !== 'cancelled') {
                                statusText = 'Confirmado';
                                statusColor = 'text-gray-600';
                            }
                        }

                        return <div className={`text-xs font-bold ${statusColor}`}>{statusText}</div>;
                    })()}
                </div>

                {/* Guests */}
                {guests.map(p => {
                    const isMe = String(p.user_id) === String(authUserId);
                    const isCoach = coachProfiles.some((c: any) => String(c.id) === String(p.user_id));

                    // Show attendance or RSVP status
                    const pRsvp = p.rsvp_status;
                    const pAttendance = p.attendance_status;
                    const isFinalizada = eventStatus === 'past';
                    const isConfirmed = pRsvp === 'confirmed' || pRsvp === 'accepted';

                    let statusColorBadge = isConfirmed ? 'bg-[#FF7939]' : (pRsvp === 'declined' || pRsvp === 'cancelled' ? 'bg-red-500' : 'bg-[#FFB366]');
                    let statusText = isConfirmed ? 'Confirmado' : (pRsvp === 'declined' || pRsvp === 'cancelled' ? 'Cancelado' : 'Pendiente');
                    let statusTextColor = isConfirmed ? 'text-[#FF7939]' : (pRsvp === 'declined' || pRsvp === 'cancelled' ? 'text-red-500' : 'text-[#FFB366]');

                    if (isFinalizada && isConfirmed && pAttendance) {
                        const attendanceText = pAttendance === 'present' ? 'Asistió' : 'No asistió';
                        const attendanceColor = pAttendance === 'present' ? 'text-green-400' : 'text-red-400';
                        statusColorBadge = pAttendance === 'present' ? 'bg-green-500' : 'bg-red-500';

                        return (
                            <div key={p.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        {p.avatar_url ? (
                                            <img src={p.avatar_url} className="w-8 h-8 rounded-full object-cover bg-zinc-800" alt={p.name} />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                                {p.name.substring(0, 2)}
                                            </div>
                                        )}
                                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${statusColorBadge}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{p.name} {isMe ? '(Tú)' : ''}</span>
                                        <div className="flex items-center gap-1.5 text-zinc-500">
                                            <span className="text-[9px] font-black uppercase tracking-widest">Invitado</span>
                                            {p.attendance_minutes > 0 && (
                                                <>
                                                    <span className="text-[10px]">•</span>
                                                    <span className="text-[9px] text-zinc-400 font-bold uppercase">{p.attendance_minutes}m conectado</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className={`text-xs font-bold ${attendanceColor}`}>{attendanceText}</div>
                                    <div className={`text-[9px] font-bold text-gray-500 uppercase tracking-tight`}>Confirmado</div>
                                </div>
                            </div>
                        );
                    }

                    if (pAttendance === 'present') {
                        statusText = 'Asistió';
                        statusTextColor = 'text-green-400';
                        statusColorBadge = 'bg-green-500';
                    } else if (pAttendance === 'absent') {
                        statusText = 'No asistió';
                        statusTextColor = 'text-red-400';
                        statusColorBadge = 'bg-red-500';
                    }

                    if (isEventCancelled) {
                        if (pRsvp !== 'declined' && pRsvp !== 'cancelled') {
                            statusTextColor = 'text-gray-600';
                            statusColorBadge = 'bg-gray-600';
                        }
                    }

                    return (
                        <div key={p.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    {p.avatar_url ? (
                                        <img src={p.avatar_url} className="w-8 h-8 rounded-full object-cover bg-zinc-800" alt={p.name} />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                            {p.name.substring(0, 2)}
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${statusColorBadge}`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-medium">{p.name} {isMe ? '(Tú)' : ''}</span>
                                    <div className="flex items-center gap-1.5 text-zinc-500">
                                        <span className="text-[9px] font-black uppercase tracking-widest">Invitado</span>
                                        {p.attendance_minutes > 0 && (
                                            <>
                                                <span className="text-[10px]">•</span>
                                                <span className="text-[9px] text-zinc-400 font-bold uppercase">{p.attendance_minutes}m conectado</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className={`text-xs font-bold ${statusTextColor}`}>{statusText}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
