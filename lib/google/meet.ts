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
     * Obtiene la duración de asistencia por email para una conferencia dada (meetingCode)
     * Nota: El meetingCode es el código de 10 letras (ej: "abc-defg-hij") 
     * o el nombre del espacio ("spaces/...")
     */
    static async getAttendanceStats(accessToken: string, meetingUri: string): Promise<Map<string, number>> {
        const attendanceMap = new Map<string, number>();

        try {
            // 1. Extraer meeting code
            // El meetingUri suele ser "https://meet.google.com/abc-defg-hij"
            const meetingCode = this.extractMeetingCode(meetingUri);
            if (!meetingCode) {
                console.log('No valid meeting code found in URI:', meetingUri);
                return attendanceMap;
            }

            // 2. Buscar records de conferencia para este espacio
            // La API permite filtrar por espacio. Formato: spaces/CODE
            const spaceName = `spaces/${meetingCode}`;

            // Listar conferenceRecords para este espacio
            // Docs: https://developers.google.com/meet/api/reference/rest/v2/conferenceRecords/list
            // filter: "space.name = 'spaces/XYZ'"
            const recordsResponse = await fetch(
                `${this.MEET_API_BASE}/conferenceRecords?filter=space.name%3D'${spaceName}'`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );

            if (!recordsResponse.ok) {
                console.error('Error fetching conference records:', await recordsResponse.text());
                return attendanceMap;
            }

            const recordsData = await recordsResponse.json();
            const records: MeetConferenceRecord[] = recordsData.conferenceRecords || [];

            if (records.length === 0) {
                console.log('No conference records found for space:', spaceName);
                return attendanceMap;
            }

            // 3. Para cada record (puede haber varias sesiones para el mismo link), sumar tiempos
            for (const record of records) {
                // Listar participantes
                const participantsResponse = await fetch(
                    `${this.MEET_API_BASE}/${record.name}/participants`,
                    { headers: { 'Authorization': `Bearer ${accessToken}` } }
                );

                if (!participantsResponse.ok) continue;

                const participantsData = await participantsResponse.json();
                const participants: MeetParticipant[] = participantsData.participants || [];

                for (const participant of participants) {
                    // Necesitamos el email. El objeto 'signedinUser' tiene 'user' (resource name).
                    // La API de Meet devuelve resource names, no siempre emails directos.
                    // Sin embargo, si es signedInUser, podríamos intentar obtener info.
                    // A veces displayName ayuda.

                    // CRÍTICO: La API v2 de Meet no expone email directamente en 'participant' por privacidad,
                    // salvo que tengamos scopes delegados de dominio o crucemos con Directory API.
                    // PERO: Si el user es externo, es difícil.
                    // Si es interno (client), quizas podamos machear por 'displayName' o asumir identidad si hay RSVP.

                    // Workaround: Intentar machear por nombre si el email no está disponible, 
                    // o ver si la API de Calendar nos dio el match entre Email y UserID.

                    // Para este MVP: Acumulamos por 'displayName' y luego intentamos conciliar?
                    // Ojo: signedinUser.user devuelve "users/123...".

                    // Vamos a simplificar: Iterar sesiones para calcular tiempo real
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
                        const end = new Date(session.endTime);
                        const diff = (end.getTime() - start.getTime()) / 1000 / 60; // minutos
                        totalMinutes += diff;
                    });

                    // Key for mapping: Intentemos displayName por ahora, o ID único.
                    // En producción ideal esto se cruza con People API.
                    const key = participant.signedinUser?.displayName || 'Unknown';
                    const current = attendanceMap.get(key) || 0;
                    attendanceMap.set(key, current + Math.round(totalMinutes));
                }
            }

        } catch (error) {
            console.error('Error in Meet integration:', error);
        }

        return attendanceMap;
    }

    private static extractMeetingCode(uri: string): string | null {
        const match = uri?.match(/[a-z]{3}-[a-z]{4}-[a-z]{3}/);
        return match ? match[0] : null;
    }
}
