/**
 * Script para probar los endpoints de Mercado Pago
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

async function testEndpoints() {
  console.log('🧪 Probando endpoints de Mercado Pago...\n');

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Test 1: Verificar que el servidor esté corriendo
  console.log('1️⃣ Verificando servidor...');
  try {
    const response = await fetch(baseUrl);
    if (response.ok) {
      console.log('   ✅ Servidor respondiendo correctamente\n');
    } else {
      console.log('   ⚠️  Servidor respondió con status:', response.status, '\n');
    }
  } catch (error) {
    console.log('   ❌ Error conectando al servidor:', error.message, '\n');
    console.log('   💡 Asegúrate de que el servidor esté corriendo: npm run dev\n');
    return;
  }

  // Test 2: Verificar función de encriptación (simulada)
  console.log('2️⃣ Verificando función de encriptación...');
  try {
    const crypto = require('crypto');
    const encryptionKey = process.env.ENCRYPTION_KEY;
    
    if (!encryptionKey) {
      console.log('   ❌ ENCRYPTION_KEY no encontrada\n');
    } else if (encryptionKey.length === 64) {
      // Intentar convertir a Buffer
      const keyBuffer = Buffer.from(encryptionKey, 'hex');
      if (keyBuffer.length === 32) {
        console.log('   ✅ ENCRYPTION_KEY tiene formato correcto (32 bytes)\n');
      } else {
        console.log('   ⚠️  ENCRYPTION_KEY no se puede convertir a 32 bytes\n');
      }
    } else {
      console.log('   ⚠️  ENCRYPTION_KEY no tiene 64 caracteres\n');
    }
  } catch (error) {
    console.log('   ❌ Error verificando encriptación:', error.message, '\n');
  }

  // Test 3: Verificar endpoint OAuth authorize (debe requerir autenticación)
  console.log('3️⃣ Verificando endpoint OAuth authorize...');
  try {
    const response = await fetch(`${baseUrl}/api/mercadopago/oauth/authorize?coach_id=test`);
    if (response.status === 401 || response.status === 400) {
      console.log('   ✅ Endpoint existe y valida autenticación (status:', response.status, ')\n');
    } else {
      console.log('   ⚠️  Endpoint respondió con status:', response.status, '\n');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
  }

  // Test 4: Verificar endpoint de crear preferencia (debe requerir autenticación)
  console.log('4️⃣ Verificando endpoint create-preference...');
  try {
    const response = await fetch(`${baseUrl}/api/payments/create-preference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollmentId: 1, activityId: 1 })
    });
    
    if (response.status === 401 || response.status === 400) {
      console.log('   ✅ Endpoint existe y valida autenticación (status:', response.status, ')\n');
    } else {
      const text = await response.text();
      console.log('   ⚠️  Endpoint respondió con status:', response.status);
      if (text.length < 200) {
        console.log('   Respuesta:', text, '\n');
      } else {
        console.log('   Respuesta: (muy larga)\n');
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
  }

  // Test 5: Verificar webhook (debe aceptar POST)
  console.log('5️⃣ Verificando endpoint webhook...');
  try {
    const response = await fetch(`${baseUrl}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'test', data: {} })
    });
    
    if (response.status === 400 || response.status === 404) {
      console.log('   ✅ Endpoint existe (status:', response.status, ')\n');
    } else {
      console.log('   ⚠️  Endpoint respondió con status:', response.status, '\n');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message, '\n');
  }

  console.log('='.repeat(50));
  console.log('✅ Verificación de endpoints completada');
  console.log('\n💡 Próximos pasos:');
  console.log('   1. Login como coach y autoriza Mercado Pago');
  console.log('   2. Login como cliente y compra una actividad');
  console.log('   3. Verifica el split payment en la tabla banco');
}

testEndpoints().catch(console.error);








