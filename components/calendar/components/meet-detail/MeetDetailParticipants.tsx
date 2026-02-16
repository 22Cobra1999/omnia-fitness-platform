
import React from 'react'

interface MeetDetailParticipantsProps {
    hostParticipant: any
    coachProfile: any
    coachProfiles: any[]
    guests: any[]
    selectedMeetEvent: any
    authUserId: string | null
    organizerName: string
    eventStatus?: string
}

export const MeetDetailParticipants: React.FC<MeetDetailParticipantsProps> = ({
    hostParticipant,
    coachProfile,
    coachProfiles,
    guests,
    selectedMeetEvent,
    authUserId,
    organizerName,
    eventStatus
}) => {
    const isEventCancelled = eventStatus === 'cancelled' || selectedMeetEvent.status === 'cancelled'

    return (
        <div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Participantes</div>
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
                        // Show organizer's individual RSVP status text
                        const organizerRsvp = hostParticipant?.rsvp_status || 'pending';
                        const statusText = (organizerRsvp === 'confirmed' || organizerRsvp === 'accepted')
                            ? 'Confirmado'
                            : (organizerRsvp === 'declined' || organizerRsvp === 'cancelled'
                                ? 'Cancelado'
                                : 'Pendiente');
                        const statusColor = (organizerRsvp === 'confirmed' || organizerRsvp === 'accepted')
                            ? 'text-[#FF7939]'
                            : (organizerRsvp === 'declined' || organizerRsvp === 'cancelled'
                                ? 'text-red-500'
                                : 'text-[#FFB366]');
                        return <div className={`text-xs font-bold ${statusColor}`}>{statusText}</div>;
                    })()}
                </div>

                {/* Guests */}
                {guests.map(p => {
                    const isMe = String(p.user_id) === String(authUserId);
                    const isCoach = coachProfiles.some((c: any) => String(c.id) === String(p.user_id));

                    // Show individual RSVP status, not event-level status
                    const pRsvp = p.rsvp_status;

                    const statusColor = (pRsvp === 'confirmed' || pRsvp === 'accepted') ? 'bg-[#FF7939]' : (pRsvp === 'declined' || pRsvp === 'cancelled' ? 'bg-red-500' : 'bg-[#FFB366]');
                    const statusText = (pRsvp === 'confirmed' || pRsvp === 'accepted') ? 'Confirmado' : (pRsvp === 'declined' || pRsvp === 'cancelled' ? 'Cancelado' : 'Pendiente');
                    const statusTextColor = (pRsvp === 'confirmed' || pRsvp === 'accepted') ? 'text-[#FF7939]' : (pRsvp === 'declined' || pRsvp === 'cancelled' ? 'text-red-500' : 'text-[#FFB366]');

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
                                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${statusColor}`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-medium">{p.name} {isMe ? '(Tú)' : ''}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Invitado</span>
                                        <span className="text-[10px] text-gray-600">•</span>
                                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                                            {p.role === 'coach' ? 'Coach' : 'Cliente'}
                                        </span>
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
