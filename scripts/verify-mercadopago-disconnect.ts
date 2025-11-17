/**
 * Script temporal para verificar el estado de desconexión de Mercado Pago en la BD
 * Ejecutar con: npx tsx scripts/verify-mercadopago-disconnect.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno desde .env.local y .env manualmente
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  
  for (const envFile of envFiles) {
    try {
      const envPath = resolve(process.cwd(), envFile);
      const envContent = readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            const value = trimmedLine.substring(equalIndex + 1).trim();
            // Remover comillas si existen
            const cleanValue = value.replace(/^["']|["']$/g, '');
            // Solo establecer si no existe ya (prioridad: .env.local > .env)
            if (!process.env[key]) {
              process.env[key] = cleanValue;
            }
          }
        }
      }
      console.log(`✓ Variables cargadas desde ${envFile}`);
    } catch (error: any) {
      // Ignorar si el archivo no existe
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDisconnectStatus() {
  try {
    console.log('🔍 Verificando estado de desconexión de Mercado Pago...\n');

    // Obtener todas las credenciales (últimas 10 para ver el estado general)
    const { data: credentials, error } = await supabase
      .from('coach_mercadopago_credentials')
      .select('id, coach_id, mercadopago_user_id, oauth_authorized, oauth_authorized_at, token_expires_at, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error consultando credenciales:', error);
      return;
    }

    if (!credentials || credentials.length === 0) {
      console.log('ℹ️  No hay credenciales en la base de datos');
      return;
    }

    console.log(`📊 Encontradas ${credentials.length} credencial(es):\n`);

    credentials.forEach((cred, index) => {
      console.log(`--- Credencial ${index + 1} ---`);
      console.log(`ID: ${cred.id}`);
      console.log(`Coach ID: ${cred.coach_id}`);
      console.log(`Mercado Pago User ID: ${cred.mercadopago_user_id || 'N/A'}`);
      console.log(`OAuth Autorizado: ${cred.oauth_authorized ? '✅ SÍ' : '❌ NO'}`);
      console.log(`Fecha de Autorización: ${cred.oauth_authorized_at || 'N/A'}`);
      console.log(`Token Expira: ${cred.token_expires_at || 'N/A'}`);
      console.log(`Creado: ${cred.created_at}`);
      console.log(`Actualizado: ${cred.updated_at}`);
      console.log(`Estado: ${cred.oauth_authorized ? '🟢 CONECTADO' : '🔴 DESVINCULADO'}`);
      console.log('');
    });

    // Resumen
    const connected = credentials.filter(c => c.oauth_authorized === true).length;
    const disconnected = credentials.filter(c => c.oauth_authorized === false).length;

    console.log('📈 Resumen:');
    console.log(`   🟢 Conectadas: ${connected}`);
    console.log(`   🔴 Desvinculadas: ${disconnected}`);
    console.log(`   📊 Total: ${credentials.length}`);

    // Verificar la más reciente
    const mostRecent = credentials[0];
    console.log('\n🔎 Credencial más reciente:');
    if (mostRecent.oauth_authorized) {
      console.log('   ⚠️  Estado: CONECTADA');
      console.log('   ℹ️  Si intentaste desvincular, verifica que el proceso se completó correctamente.');
    } else {
      console.log('   ✅ Estado: DESVINCULADA');
      console.log('   ✅ La desconexión se completó correctamente en la base de datos.');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

verifyDisconnectStatus()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

