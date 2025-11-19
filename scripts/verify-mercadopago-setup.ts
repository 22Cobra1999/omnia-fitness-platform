/**
 * Script de verificación completa de configuración de Mercado Pago
 * Verifica migraciones SQL y variables de entorno necesarias
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ ERROR: Variables de Supabase no configuradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VerificationResult {
  check: string;
  status: '✅' | '❌' | '⚠️';
  message: string;
  details?: any;
}

const results: VerificationResult[] = [];

async function verifyDatabaseStructure() {
  console.log('\n📊 Verificando estructura de base de datos...\n');

  // 1. Verificar tabla banco
  try {
    const { data, error } = await supabase
      .from('banco')
      .select('id')
      .limit(1);

    if (error) {
      results.push({
        check: 'Tabla banco existe',
        status: '❌',
        message: `Error: ${error.message}`
      });
    } else {
      results.push({
        check: 'Tabla banco existe',
        status: '✅',
        message: 'Tabla banco encontrada'
      });
    }
  } catch (error: any) {
    results.push({
      check: 'Tabla banco existe',
      status: '❌',
      message: `Error: ${error.message}`
    });
  }

  // 2. Verificar columnas en banco
  const requiredBancoColumns = [
    'enrollment_id',
    'activity_id',
    'client_id',
    'mercadopago_payment_id',
    'mercadopago_preference_id',
    'mercadopago_status',
    'marketplace_fee',
    'seller_amount',
    'coach_mercadopago_user_id',
    'coach_access_token_encrypted',
    'payment_status'
  ];

  for (const column of requiredBancoColumns) {
    try {
      const { data, error } = await supabase
        .from('banco')
        .select(column)
        .limit(1);

      if (error && error.message.includes('column')) {
        results.push({
          check: `Columna banco.${column}`,
          status: '❌',
          message: `Columna no existe: ${error.message}`
        });
      } else {
        results.push({
          check: `Columna banco.${column}`,
          status: '✅',
          message: 'Columna existe'
        });
      }
    } catch (error: any) {
      results.push({
        check: `Columna banco.${column}`,
        status: '❌',
        message: `Error: ${error.message}`
      });
    }
  }

  // 3. Verificar que enrollment_id es nullable
  try {
    const { data, error } = await supabase
      .from('banco')
      .insert({
        activity_id: null,
        client_id: null,
        enrollment_id: null,
        amount_paid: 0,
        payment_status: 'pending'
      })
      .select();

    if (error) {
      if (error.message.includes('null value in column "enrollment_id"')) {
        results.push({
          check: 'enrollment_id es nullable',
          status: '❌',
          message: 'enrollment_id NO es nullable - ejecutar make-enrollment-optional-in-banco.sql'
        });
      } else {
        results.push({
          check: 'enrollment_id es nullable',
          status: '⚠️',
          message: `Error al verificar: ${error.message}`
        });
      }
    } else {
      // Eliminar el registro de prueba
      if (data && data[0]) {
        await supabase.from('banco').delete().eq('id', data[0].id);
      }
      results.push({
        check: 'enrollment_id es nullable',
        status: '✅',
        message: 'enrollment_id es nullable correctamente'
      });
    }
  } catch (error: any) {
    results.push({
      check: 'enrollment_id es nullable',
      status: '⚠️',
      message: `Error: ${error.message}`
    });
  }

  // 4. Verificar tabla coach_mercadopago_credentials
  try {
    const { data, error } = await supabase
      .from('coach_mercadopago_credentials')
      .select('id')
      .limit(1);

    if (error) {
      results.push({
        check: 'Tabla coach_mercadopago_credentials existe',
        status: '❌',
        message: `Error: ${error.message} - ejecutar add-split-payment-tables.sql`
      });
    } else {
      results.push({
        check: 'Tabla coach_mercadopago_credentials existe',
        status: '✅',
        message: 'Tabla encontrada'
      });
    }
  } catch (error: any) {
    results.push({
      check: 'Tabla coach_mercadopago_credentials existe',
      status: '❌',
      message: `Error: ${error.message}`
    });
  }

  // 5. Verificar coaches conectados
  try {
    const { data, error } = await supabase
      .from('coach_mercadopago_credentials')
      .select('id, coach_id, oauth_authorized')
      .eq('oauth_authorized', true);

    if (error) {
      results.push({
        check: 'Coaches conectados',
        status: '⚠️',
        message: `Error: ${error.message}`
      });
    } else {
      results.push({
        check: 'Coaches conectados',
        status: data && data.length > 0 ? '✅' : '⚠️',
        message: `${data?.length || 0} coach(es) con Mercado Pago conectado`
      });
    }
  } catch (error: any) {
    results.push({
      check: 'Coaches conectados',
      status: '⚠️',
      message: `Error: ${error.message}`
    });
  }
}

function verifyEnvironmentVariables() {
  console.log('\n🔐 Verificando variables de entorno...\n');

  const requiredVars = [
    {
      name: 'MERCADOPAGO_CLIENT_ID',
      description: 'Client ID de Mercado Pago (producción)',
      required: true
    },
    {
      name: 'MERCADOPAGO_CLIENT_SECRET',
      description: 'Client Secret de Mercado Pago (producción)',
      required: true
    },
    {
      name: 'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY',
      description: 'Public Key de Mercado Pago (producción)',
      required: true,
      startsWith: 'APP_USR-'
    },
    {
      name: 'MERCADOPAGO_ACCESS_TOKEN',
      description: 'Access Token de Mercado Pago (producción)',
      required: true,
      startsWith: 'APP_USR-'
    },
    {
      name: 'NEXT_PUBLIC_APP_URL',
      description: 'URL de la aplicación (producción)',
      required: true,
      mustBeHttps: true
    },
    {
      name: 'NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI',
      description: 'Redirect URI para OAuth',
      required: true
    },
    {
      name: 'ENCRYPTION_KEY',
      description: 'Clave de encriptación para tokens OAuth',
      required: true
    }
  ];

  for (const varConfig of requiredVars) {
    const value = process.env[varConfig.name];
    
    if (!value) {
      results.push({
        check: varConfig.name,
        status: '❌',
        message: `NO CONFIGURADA - ${varConfig.description}`
      });
      continue;
    }

    const trimmedValue = value.trim();
    let status: '✅' | '⚠️' = '✅';
    let message = 'Configurada';

    // Verificar prefijo si es necesario
    if (varConfig.startsWith && !trimmedValue.startsWith(varConfig.startsWith)) {
      status = '⚠️';
      message = `⚠️ Debe empezar con ${varConfig.startsWith} (actualmente: ${trimmedValue.substring(0, 10)}...)`;
    }

    // Verificar HTTPS si es necesario
    if (varConfig.mustBeHttps && !trimmedValue.startsWith('https://')) {
      status = '⚠️';
      message = `⚠️ Debe usar HTTPS (actualmente: ${trimmedValue.substring(0, 10)}...)`;
    }

    // Verificar que no tenga espacios/newlines
    if (value !== trimmedValue) {
      status = '⚠️';
      message = '⚠️ Tiene espacios o newlines al inicio/final';
    }

    results.push({
      check: varConfig.name,
      status,
      message,
      details: varConfig.description
    });
  }
}

function verifyMigrationFiles() {
  console.log('\n📁 Verificando archivos de migración...\n');

  const requiredMigrations = [
    'db/migrations/make-enrollment-optional-in-banco.sql',
    'db/migrations/add-mercadopago-fields-to-banco.sql',
    'db/migrations/add-split-payment-tables.sql'
  ];

  for (const migrationPath of requiredMigrations) {
    const fullPath = path.join(process.cwd(), migrationPath);
    if (fs.existsSync(fullPath)) {
      results.push({
        check: `Migración: ${path.basename(migrationPath)}`,
        status: '✅',
        message: 'Archivo existe'
      });
    } else {
      results.push({
        check: `Migración: ${path.basename(migrationPath)}`,
        status: '❌',
        message: 'Archivo NO existe'
      });
    }
  }
}

function printResults() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 RESUMEN DE VERIFICACIÓN');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter(r => r.status === '✅').length;
  const warnings = results.filter(r => r.status === '⚠️').length;
  const failed = results.filter(r => r.status === '❌').length;

  console.log(`✅ Correcto: ${passed}`);
  console.log(`⚠️  Advertencias: ${warnings}`);
  console.log(`❌ Errores: ${failed}\n`);

  console.log('='.repeat(80));
  console.log('DETALLES:');
  console.log('='.repeat(80) + '\n');

  for (const result of results) {
    console.log(`${result.status} ${result.check}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  
  if (failed > 0) {
    console.log('\n❌ HAY ERRORES CRÍTICOS - Revisa los errores arriba');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  HAY ADVERTENCIAS - Revisa las advertencias arriba');
    process.exit(0);
  } else {
    console.log('\n✅ TODO ESTÁ CORRECTO - Listo para producción');
    process.exit(0);
  }
}

async function main() {
  console.log('🔍 Verificando configuración de Mercado Pago...\n');

  await verifyDatabaseStructure();
  verifyEnvironmentVariables();
  verifyMigrationFiles();
  printResults();
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});

