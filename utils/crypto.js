import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Ensure ENCRYPTION_KEY is a 32-byte key and IV is a 16-byte string in your .env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef'; // Default for safety, replace in .env
const IV_LENGTH = 16; // For AES, this is always 16

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) { // 32 bytes = 64 hex characters
    console.warn("Warning: ENCRYPTION_KEY is not set or not a 32-byte hex string. Using a default, less secure key. Please set it in your .env file.");
    return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex'); // 32-byte key
  }
  return Buffer.from(key, 'hex');
}

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text) {
  try {
    const parts = text.split(':');
    if (parts.length !== 2) {
      console.error("Decryption error: Invalid text format.");
      throw new Error('Invalid text format for decryption');
    }
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error("Decryption failed:", error);
    return null; // Or handle error appropriately
  }
} 