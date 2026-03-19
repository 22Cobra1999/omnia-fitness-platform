import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Cargar variables de entorno
const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
envFile.split('\n').forEach(line => {
  if (line.trim() && !line.trim().startsWith('#')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// LA CLAVE CON COMILLAS (La que causó el problema)
const QUOTED_KEY = '"1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4"';

function getLegacyKey(): Buffer {
  // Simular la lógica de derivación para claves != 64 chars
  return crypto.pbkdf2Sync(QUOTED_KEY, 'omnia-salt', 100000, 32, 'sha512');
}

function legacyDecrypt(encryptedText: string): string {
  const key = getLegacyKey();
  const combined = Buffer.from(encryptedText, 'base64');
  const salt = combined.slice(0, 64);
  const iv = combined.slice(64, 80);
  const tag = combined.slice(80, 96);
  const encrypted = combined.slice(96);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function run() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
  const meetingCode = 'imq-wbvc-uah';
  const coachEmail = 'f.pomati@usal.edu.ar';

  console.log(`📡 Intentando recuperar datos para ${meetingCode} usando el coach ${coachEmail}...`);

  const { data: coach } = await supabase.from('user_profiles').select('id').eq('email', coachEmail).single();
  const { data: tokens } = await supabase.from('google_oauth_tokens').select('*').eq('coach_id', coach!.id).single();

  if (!tokens) {
    console.error('❌ No se encontraron tokens.');
    return;
  }

  let accessToken = '';
  try {
    accessToken = legacyDecrypt(tokens.access_token);
    console.log('✅ Token desencriptado exitosamente usando la clave corregida (con comillas).');
  } catch (e: any) {
    console.error('❌ No se pudo desencriptar ni con el workaround:', e.message);
    return;
  }

  const spaceName = `spaces/${meetingCode}`;
  console.log(`📡 Consultando Google Meet API para: ${spaceName}...`);

  const response = await fetch(`https://meet.googleapis.com/v2/conferenceRecords?filter=space.name%3D'${spaceName}'`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`❌ Error en Meet API (${response.status}):`, err);
    return;
  }

  const data = await response.json();
  const records = data.conferenceRecords || [];
  console.log(`📊 Se encontraron ${records.length} registros de conferencias.`);

  for (const record of records) {
    console.log(`\n🔹 Sesión: ${record.name} (${record.startTime} a ${record.endTime || 'en curso'})`);
    
    const pRes = await fetch(`https://meet.googleapis.com/v2/${record.name}/participants`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const pData = await pRes.json();
    const participants = pData.participants || [];

    for (const p of participants) {
        console.log(`   👤 ${p.name}`);
        const sRes = await fetch(`https://meet.googleapis.com/v2/${p.name}/participantSessions`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const sData = await sRes.json();
        const sessions = sData.participantSessions || [];
        
        let total = 0;
        sessions.forEach((s: any) => {
            const start = new Date(s.startTime);
            const end = s.endTime ? new Date(s.endTime) : new Date();
            const min = (end.getTime() - start.getTime()) / 60000;
            total += min;
            console.log(`      - [${Math.round(min)} min] ${s.startTime}`);
        });
        console.log(`      => TOTAL: ${Math.round(total)} minutos`);
    }
  }
}

run();
