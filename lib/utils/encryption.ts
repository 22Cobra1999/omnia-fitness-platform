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
    console.error('ENCRYPTION_KEY no está configurada');
    throw new Error('ENCRYPTION_KEY no está configurada en las variables de entorno');
  }

  try {
    // Si la clave es hexadecimal (64 caracteres = 32 bytes en hex), convertirla a Buffer
    if (key.length === 64) {
      const buffer = Buffer.from(key, 'hex');
      if (buffer.length === KEY_LENGTH) {
        return buffer;
      }
      console.warn('Clave hexadecimal no tiene el tamaño correcto, derivando con PBKDF2');
    }

    // Derivar una clave usando PBKDF2
    return crypto.pbkdf2Sync(key.trim(), 'omnia-salt', 100000, KEY_LENGTH, 'sha512');
  } catch (error: any) {
    console.error('Error procesando clave de encriptación:', error);
    throw new Error(`Error procesando clave de encriptación: ${error.message}`);
  }
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
    if (!encryptedText || typeof encryptedText !== 'string' || encryptedText.length === 0) {
      throw new Error('Texto encriptado vacío o inválido');
    }

    const key = getEncryptionKey();
    let combined: Buffer;
    
    try {
      combined = Buffer.from(encryptedText, 'base64');
    } catch (base64Error) {
      console.error('Error decodificando base64:', base64Error);
      throw new Error('Formato base64 inválido');
    }

    // Validar tamaño mínimo
    const minSize = SALT_LENGTH + IV_LENGTH + TAG_LENGTH + 1;
    if (combined.length < minSize) {
      console.error(`Tamaño insuficiente: ${combined.length} bytes, mínimo esperado: ${minSize}`);
      throw new Error(`Tamaño del token encriptado insuficiente: ${combined.length} bytes`);
    }

    // Extraer componentes
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    if (encrypted.length === 0) {
      throw new Error('Datos encriptados vacíos después de extraer componentes');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error: any) {
    console.error('Error desencriptando:', error);
    console.error('Tipo de error:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Código de error:', error.code);
    
    // Detectar errores específicos de GCM
    const isGCMAuthError = 
      error.message?.includes('unable to authenticate') ||
      error.message?.includes('Unsupported state') ||
      error.message?.includes('bad decrypt') ||
      error.code === 'ERR_OSSL_BAD_DECRYPT' ||
      error.code === 'ERR_CRYPTO_INVALID_TAG';
    
    if (isGCMAuthError) {
      throw new Error(`Error al desencriptar el token: El token fue encriptado con una clave diferente (${error.message})`);
    }
    
    throw new Error(`Error al desencriptar el token: ${error.message}`);
  }
}






