import { GoogleOAuth } from './oauth';

interface MeetConferenceRecord {
    name: string; // "conferenceRecords/{conferenceRecordId}"
    startTime: string;
    endTime: string;
    space: string; // "spaces/{meetingCode}"
}

interface MeetParticipant {
    name: string; // "conferenceRecords/{id}/participants/{participantId}"
    signedinUser: {
        user: string; // "users/{userId}"
        displayName: string;
    };
    earliestStartTime: string;
    latestEndTime: string;
}

interface MeetParticipantSession {
    name: string;
    startTime: string;
    endTime: string;
}

export class GoogleMeet {
    private static readonly MEET_API_BASE = 'https://meet.googleapis.com/v2';

    /**
     * Obtiene la duración de asistencia y el email para una conferencia dada
     */
    static async getAttendanceStats(accessToken: string, meetingUri: string): Promise<Map<string, { minutes: number, email?: string }>> {
        const statsMap = new Map<string, { minutes: number, email?: string }>();

        try {
            const meetingCode = this.extractMeetingCode(meetingUri);
            if (!meetingCode) return statsMap;

            // 1. Resolver el código de la reunión al Space Name canónico
            // (Necesario porque la API v2 requiere el ID interno en el filtro de conferenceRecords)
            const spaceResponse = await fetch(
                `${this.MEET_API_BASE}/spaces/${meetingCode}`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );
            
            let spaceName = `spaces/${meetingCode}`;
            if (spaceResponse.ok) {
                const spaceData = await spaceResponse.json();
                spaceName = spaceData.name;
            }

            console.log(`📡 Usando Space Name: ${spaceName} para buscar asistencia.`);

            const recordsResponse = await fetch(
                `${this.MEET_API_BASE}/conferenceRecords?filter=space.name%3D%22${spaceName}%22`,
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );

            if (!recordsResponse.ok) return statsMap;

            const recordsData = await recordsResponse.json();
            const records: MeetConferenceRecord[] = recordsData.conferenceRecords || [];

            for (const record of records) {
                const participantsResponse = await fetch(
                    `${this.MEET_API_BASE}/${record.name}/participants`,
                    { headers: { 'Authorization': `Bearer ${accessToken}` } }
                );

                if (!participantsResponse.ok) continue;

                const participantsData = await participantsResponse.json();
                const participants: MeetParticipant[] = participantsData.participants || [];

                for (const participant of participants) {
                    let email: string | undefined = undefined;

                    // Si es un signedinUser, intentamos obtener el email mediante People API
                    if (participant.signedinUser?.user) {
                        const userId = participant.signedinUser.user.split('/').pop();
                        try {
                            const peopleResponse = await fetch(
                                `https://people.googleapis.com/v1/people/${userId}?personFields=emailAddresses`,
                                { headers: { 'Authorization': `Bearer ${accessToken}` } }
                            );
                            if (peopleResponse.ok) {
                                const personData = await peopleResponse.json();
                                email = personData.emailAddresses?.[0]?.value;
                            }
                        } catch (e) {
                            console.error('Error fetching email from People API:', e);
                        }
                    }

                    // Calcular sesiones
                    const sessionsResponse = await fetch(
                        `${this.MEET_API_BASE}/${participant.name}/participantSessions`,
                        { headers: { 'Authorization': `Bearer ${accessToken}` } }
                    );

                    if (!sessionsResponse.ok) continue;

                    const sessionsData = await sessionsResponse.json();
                    const sessions: MeetParticipantSession[] = sessionsData.participantSessions || [];

                    let totalMinutes = 0;
                    sessions.forEach(session => {
                        const start = new Date(session.startTime);
                        const end = session.endTime ? new Date(session.endTime) : new Date(); // Si no tiene endTime, sigue en la reunión
                        const diff = (end.getTime() - start.getTime()) / 1000 / 60;
                        totalMinutes += diff;
                    });

                    const displayName = participant.signedinUser?.displayName || 'Unknown';
                    const key = email || displayName; // Prioridad al email para el match
                    
                    const existing = statsMap.get(key) || { minutes: 0, email };
                    statsMap.set(key, { 
                        minutes: existing.minutes + Math.round(totalMinutes), 
                        email: email || existing.email 
                    });
                }
            }
        } catch (error) {
            console.error('Error in Meet integration:', error);
        }

        return statsMap;
    }

    private static extractMeetingCode(uri: string): string | null {
        const match = uri?.match(/[a-z]{3}-[a-z]{4}-[a-z]{3}/);
        return match ? match[0] : null;
    }
}
