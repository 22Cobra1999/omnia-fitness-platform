/**
 * Script para verificar la configuración de Mercado Pago
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envPaths = ['.env.local', '.env'];
for (const envPath of envPaths) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '..', envPath), 'utf8');
    envFile.split('\n').forEach(line => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const [, key, value] = match;
          process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
        }
      }
    });
  } catch (e) {
    // Ignorar si no existe
  }
}

console.log('🔍 Verificando configuración de Mercado Pago...\n');

const requiredVars = [
  'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY',
  'MERCADOPAGO_ACCESS_TOKEN',
  'MERCADOPAGO_CLIENT_ID',
  'MERCADOPAGO_CLIENT_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI',
  'ENCRYPTION_KEY'
];

let allOk = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const hasValue = value && value.trim().length > 0;
  
  if (hasValue) {
    // Ocultar valores sensibles
    let displayValue = value;
    if (varName.includes('SECRET') || varName.includes('TOKEN') || varName === 'ENCRYPTION_KEY') {
      displayValue = value.substring(0, 10) + '...' + value.substring(value.length - 5);
    }
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: NO CONFIGURADA`);
    allOk = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allOk) {
  console.log('✅ Todas las variables están configuradas correctamente');
  
  // Verificar formato de credenciales
  const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  
  if (publicKey && !publicKey.startsWith('TEST-') && !publicKey.startsWith('APP_USR-')) {
    console.log('⚠️  ADVERTENCIA: Public Key no tiene formato esperado (debería empezar con TEST- o APP_USR-)');
  }
  
  if (accessToken && !accessToken.startsWith('TEST-') && !accessToken.startsWith('APP_USR-')) {
    console.log('⚠️  ADVERTENCIA: Access Token no tiene formato esperado (debería empezar con TEST- o APP_USR-)');
  }
  
  if (publicKey && publicKey.startsWith('TEST-') && accessToken && accessToken.startsWith('TEST-')) {
    console.log('✅ Credenciales de PRUEBA detectadas (correcto para desarrollo)');
  }
  
  if (process.env.MERCADOPAGO_CLIENT_ID && process.env.MERCADOPAGO_CLIENT_SECRET) {
    console.log('✅ Credenciales de PRODUCCIÓN para OAuth configuradas');
  }
  
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey && encryptionKey.length === 64) {
    console.log('✅ ENCRYPTION_KEY tiene formato correcto (64 caracteres hexadecimales)');
  } else if (encryptionKey) {
    console.log('⚠️  ADVERTENCIA: ENCRYPTION_KEY debería tener 64 caracteres hexadecimales');
  }
  
} else {
  console.log('❌ Faltan variables de entorno. Revisa tu .env.local');
  process.exit(1);
}

console.log('\n✅ Configuración verificada correctamente');








