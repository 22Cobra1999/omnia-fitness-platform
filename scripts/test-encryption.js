/**
 * Script para probar la función de encriptación
 */

const crypto = require('crypto');
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

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY no está configurada');
  }

  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }

  return crypto.pbkdf2Sync(key, 'omnia-salt', 100000, KEY_LENGTH, 'sha512');
}

function encrypt(text) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();

  const combined = Buffer.concat([
    salt,
    iv,
    tag,
    Buffer.from(encrypted, 'hex')
  ]);

  return combined.toString('base64');
}

function decrypt(encryptedText) {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedText, 'base64');

  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

console.log('🔐 Probando función de encriptación...\n');

try {
  const testToken = 'TEST_TOKEN_123456789';
  console.log('Texto original:', testToken);
  
  const encrypted = encrypt(testToken);
  console.log('Texto encriptado:', encrypted.substring(0, 50) + '...');
  
  const decrypted = decrypt(encrypted);
  console.log('Texto desencriptado:', decrypted);
  
  if (decrypted === testToken) {
    console.log('\n✅ Encriptación/Desencriptación funciona correctamente');
  } else {
    console.log('\n❌ Error: El texto desencriptado no coincide');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}








