export interface ConferenceRecord {
  name: string // resource name
  startTime?: string
  endTime?: string
}

export interface Participant {
  name: string
  user?: { displayName?: string; email?: string }
}

export interface ParticipantSession {
  startTime?: string
  endTime?: string
}

const MEET_API = 'https://meet.googleapis.com/v2'

export async function getConferenceRecordByCode(accessToken: string, meetCode: string) {
  const url = `${MEET_API}/conferenceRecords:search?meeting_code=${encodeURIComponent(meetCode)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error(`search conferenceRecords failed: ${res.status}`)
  const data = await res.json()
  const record = (data.conferenceRecords?.[0] || null) as ConferenceRecord | null
  return record
}

export async function listParticipants(accessToken: string, conferenceRecordName: string): Promise<Participant[]> {
  const url = `${MEET_API}/${conferenceRecordName}/participants`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error(`participants.list failed: ${res.status}`)
  const data = await res.json()
  return data.participants || []
}

export async function listParticipantSessions(accessToken: string, participantName: string): Promise<ParticipantSession[]> {
  const url = `${MEET_API}/${participantName}/sessions`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error(`participant.sessions.list failed: ${res.status}`)
  const data = await res.json()
  return data.sessions || []
}































