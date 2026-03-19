import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
const envPaths = ['.env.local', '.env'];
for (const envPath of envPaths) {
  try {
    const envFile = readFileSync(join(process.cwd(), envPath), 'utf8');
    envFile.split('\n').forEach(line => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
      }
    });
  } catch (e) {}
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables de entorno de Supabase faltantes');
  process.exit(1);
}

import { decrypt } from '../lib/utils/encryption';

async function debugAttendance(meetingCode: string, coachEmail: string) {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
  
  console.log(`🔍 Buscando tokens para: ${coachEmail}`);
  const { data: profile } = await supabase.from('user_profiles').select('id').eq('email', coachEmail).single();
  if (!profile) {
    console.error('❌ No se encontró el perfil del coach');
    return;
  }

  const { data: tokens } = await supabase.from('google_oauth_tokens').select('*').eq('coach_id', profile.id).single();
  if (!tokens) {
    console.error('❌ No se encontraron tokens de Google para este coach');
    return;
  }

  let accessToken = decrypt(tokens.access_token);
  console.log('✅ Token obtenido y desencriptado.');

  async function callMeet(token: string) {
    console.log(`📡 Consultando Google Meet API para listar conferenceRecords recientes...`);
    return await fetch(`https://meet.googleapis.com/v2/conferenceRecords`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  try {
    let recordsResponse = await callMeet(accessToken);

    if (recordsResponse.status === 401) {
      console.log('🔄 Token expirado o inválido (401). Intentando refrescar...');
      const refreshToken = decrypt(tokens.refresh_token);
      
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (refreshResponse.ok) {
        const refreshedData = await refreshResponse.json();
        accessToken = refreshedData.access_token;
        console.log('✅ Token refrescado exitosamente.');
        recordsResponse = await callMeet(accessToken);
      } else {
        const errText = await refreshResponse.text();
        console.error('❌ Falló el refresco del token:', errText);
        console.error('💡 SUGERENCIA: Desconecta y vuelve a conectar tu cuenta de Google en OMNIA.');
        return;
      }
    }

    if (!recordsResponse.ok) {
      const errText = await recordsResponse.text();
      console.error(`❌ Error en Meet API (${recordsResponse.status}):`, errText);
      return;
    }

    const recordsData = await recordsResponse.json();
    const records = recordsData.conferenceRecords || [];
    console.log(`📊 Se encontraron ${records.length} registros de conferencias para este código.`);

    for (const record of records) {
      console.log(`\n--- Conferencia: ${record.name} ---`);
      console.log(`Inicio: ${record.startTime}, Fin: ${record.endTime || 'En curso'}`);

      const participantsResponse = await fetch(
        `https://meet.googleapis.com/v2/${record.name}/participants`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!participantsResponse.ok) continue;
      const participantsData = await participantsResponse.json();
      const participants = participantsData.participants || [];

      for (const participant of participants) {
        console.log(`  👤 Participante: ${participant.name}`);
        if (participant.signedinUser) {
            console.log(`     User: ${participant.signedinUser.displayName}`);
        }

        const sessionsResponse = await fetch(
          `https://meet.googleapis.com/v2/${participant.name}/participantSessions`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (!sessionsResponse.ok) continue;
        const sessionsData = await sessionsResponse.json();
        const sessions = sessionsData.participantSessions || [];

        let totalMinutes = 0;
        sessions.forEach((s: any) => {
          const start = new Date(s.startTime);
          const end = s.endTime ? new Date(s.endTime) : new Date();
          const diff = (end.getTime() - start.getTime()) / 1000 / 60;
          totalMinutes += diff;
          console.log(`     - Sesión: ${s.startTime} -> ${s.endTime || '...'} (${Math.round(diff)} min)`);
        });
        console.log(`     => TOTAL: ${Math.round(totalMinutes)} minutos`);
      }
    }
  } catch (err) {
    console.error('❌ Error de red:', err);
  }
}

const code = process.argv[2];
const email = process.argv[3];

if (!code || !email) {
  console.log('Uso: npx tsx scripts/debug-meet-attendance.ts <meeting-code> <coach-email>');
  console.log('Ejemplo: npx tsx scripts/debug-meet-attendance.ts gnt-pwbq-mnq f.pomati@usal.edu.ar');
} else {
  debugAttendance(code, email);
}
