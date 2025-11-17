/**
 * Utilidades para encriptar/desencriptar tokens de Mercado Pago
 * Usa AES-256-GCM para encriptación segura
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes para AES
const SALT_LENGTH = 64; // 64 bytes para salt
const TAG_LENGTH = 16; // 16 bytes para GCM tag
const KEY_LENGTH = 32; // 32 bytes para AES-256

/**
 * Obtiene la clave de encriptación desde las variables de entorno
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY no está configurada en las variables de entorno');
  }

  // Si la clave es hexadecimal, convertirla a Buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex');
  }

  // Si no, derivar una clave usando PBKDF2
  return crypto.pbkdf2Sync(key, 'omnia-salt', 100000, KEY_LENGTH, 'sha512');
}

/**
 * Encripta un texto usando AES-256-GCM
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    // Combinar: salt + iv + tag + encrypted
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Error encriptando:', error);
    throw new Error('Error al encriptar el token');
  }
}

/**
 * Desencripta un texto encriptado con AES-256-GCM
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedText, 'base64');

    // Extraer componentes
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error desencriptando:', error);
    throw new Error('Error al desencriptar el token');
  }
}






