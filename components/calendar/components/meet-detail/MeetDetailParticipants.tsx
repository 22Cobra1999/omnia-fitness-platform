
import React from 'react'

interface MeetDetailParticipantsProps {
    hostParticipant: any
    coachProfile: any
    coachProfiles: any[]
    guests: any[]
    selectedMeetEvent: any
    authUserId: string | null
    organizerName: string
}

export const MeetDetailParticipants: React.FC<MeetDetailParticipantsProps> = ({
    hostParticipant,
    coachProfile,
    coachProfiles,
    guests,
    selectedMeetEvent,
    authUserId,
    organizerName
}) => {
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
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${selectedMeetEvent.is_ghost ? 'bg-[#FFB366]' : 'bg-[#FF7939]'}`} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-white font-medium">{organizerName}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-[#FF7939] font-black uppercase tracking-widest">Organizador</span>
                                <span className="text-[10px] text-gray-500">•</span>
                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
                                    {coachProfiles.some((c: any) => String(c.id) === String(hostParticipant?.user_id)) ? 'Coach' : 'Cliente'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className={`text-xs font-bold ${selectedMeetEvent.is_ghost ? 'text-[#FFB366]' : 'text-[#FF7939]'}`}>
                        {selectedMeetEvent.is_ghost ? 'Pendiente' : 'Reserva'}
                    </div>
                </div>

                {/* Guests */}
                {guests.map(p => {
                    const isMe = String(p.user_id) === String(authUserId);
                    const isCoach = coachProfiles.some((c: any) => String(c.id) === String(p.user_id));
                    const statusColor = (p.rsvp_status === 'confirmed' || p.rsvp_status === 'accepted') ? 'bg-[#FF7939]' : (p.rsvp_status === 'declined' || p.rsvp_status === 'cancelled' ? 'bg-red-500' : 'bg-[#FFB366]');
                    const statusText = (p.rsvp_status === 'confirmed' || p.rsvp_status === 'accepted') ? 'Confirmado' : (p.rsvp_status === 'declined' || p.rsvp_status === 'cancelled' ? 'Rechazado' : 'Pendiente');
                    const statusTextColor = (p.rsvp_status === 'confirmed' || p.rsvp_status === 'accepted') ? 'text-[#FF7939]' : (p.rsvp_status === 'declined' || p.rsvp_status === 'cancelled' ? 'text-red-500' : 'text-[#FFB366]');

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
                                            {isCoach ? 'Coach' : 'Cliente'}
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
