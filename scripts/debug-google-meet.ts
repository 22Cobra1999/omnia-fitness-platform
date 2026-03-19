import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de entorno manualmente para estar seguro
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log('📝 Cargando .env.local...');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach((line: string) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const index = trimmed.indexOf('=');
            if (index > 0) {
                const key = trimmed.substring(0, index).trim();
                const value = trimmed.substring(index + 1).trim()
                    .replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        }
    });
}

const COACH_ID = 'b16c4f8c-f47b-4df0-ad2b-13dcbd76263f';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(keyStr: string): Buffer {
    if (keyStr.length === 64) {
        return Buffer.from(keyStr, 'hex');
    }
    return crypto.pbkdf2Sync(keyStr.trim(), 'omnia-salt', 100000, KEY_LENGTH, 'sha512');
}

function decryptGCM(encryptedBase64: string, keyStr: string): string {
    const key = getEncryptionKey(keyStr);
    const combined = Buffer.from(encryptedBase64, 'base64');
    
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined as any, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function decryptCBC(encryptedBase64: string, keyStr: string): string {
    const key = getEncryptionKey(keyStr);
    const combined = Buffer.from(encryptedBase64, 'base64');
    
    // Suponiendo iv (16) + datos
    const iv = combined.slice(0, 16);
    const encrypted = combined.slice(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, undefined as any, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

async function debug() {
    console.log('🚀 Iniciando diagnóstico de Google Meet...\n');

    if (!ENCRYPTION_KEY) {
        console.error('❌ ENCRYPTION_KEY no está configurada en el entorno.');
        return;
    }
    console.log('✅ ENCRYPTION_KEY encontrada (longitud:', ENCRYPTION_KEY.length, ')');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        console.error('❌ Credenciales de Supabase incompletas.');
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log(`🔍 Buscando tokens para coach: ${COACH_ID}...`);
    const { data: tokens, error } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('coach_id', COACH_ID)
        .maybeSingle();

    if (error) {
        console.error('❌ Error al consultar Supabase:', error.message);
        return;
    }

    if (!tokens) {
        console.error('❌ No se encontraron tokens para este coach.');
        return;
    }

    console.log('✅ Tokens encontrados en la base de datos.');
    
    const encryptedAccessToken = tokens.access_token;
    const encryptedRefreshToken = tokens.refresh_token;

    console.log('\n--- Pruebas de Desencriptación ---');
    
    // 1. ¿Es texto plano?
    if (encryptedAccessToken.startsWith('ya29.')) {
        console.log('⚠️ ¡ATENCION! El token parece ser TEXTO PLANO (comienza con ya29.)');
        console.log('👉 Error detectado: Los tokens en la DB no están encriptados, pero el código espera que lo estén.');
    } else {
        console.log('✅ El token NO parece ser texto plano (no comienza con ya29.)');
    }

    const attempts = [
        { name: 'AES-256-GCM (Actual)', fn: decryptGCM },
        { name: 'AES-256-CBC (Documentación antigua)', fn: decryptCBC },
    ];

    for (const attempt of attempts) {
        try {
            console.log(`\n försöker ${attempt.name}...`);
            const decrypted = attempt.fn(encryptedAccessToken, ENCRYPTION_KEY);
            console.log(`✅ ¡EXITO con ${attempt.name}!`);
            console.log('Comienza con:', decrypted.substring(0, 5), '...');
            break; 
        } catch (err: any) {
            console.error(`❌ Falló ${attempt.name}:`, err.message);
        }
    }

    // Análisis estructural
    try {
        const buf = Buffer.from(encryptedAccessToken, 'base64');
        console.log('\n--- Análisis Estructural ---');
        console.log('Longitud total (bytes):', buf.length);
        console.log('¿Tiene salt (64 bytes)?', buf.length > 64);
        console.log('¿Tiene iv (16 bytes) + tag (16 bytes)?', buf.length > 96);
    } catch (e) {
        console.log('❌ No es base64 válido.');
    }

    // Intento con clave alternativa de la documentación
    const altKey = '1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4';
    if (ENCRYPTION_KEY !== altKey) {
        console.log(`\n\n🔄 Probando con clave alternativa (de la documentación)...`);
        for (const attempt of attempts) {
            try {
                console.log(`\n försöker ${attempt.name} con Clave Alternativa...`);
                const decrypted = attempt.fn(encryptedAccessToken, altKey);
                console.log(`✅ ¡EXITO TOTAL con ${attempt.name} y Clave Alternativa!`);
                console.log('👉 Recomendación: Actualiza ENCRYPTION_KEY en .env.local a:', altKey);
                break;
            } catch (err: any) {
                console.error(`❌ Falló ${attempt.name} con Clave Alternativa:`, err.message);
            }
        }
    }

    console.log('\n--- Información de Google OAuth ---');
    console.log('token updated_at:', tokens.updated_at);
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Configurado' : 'MISSING');
}

debug().catch(console.error);


debug().catch(console.error);
