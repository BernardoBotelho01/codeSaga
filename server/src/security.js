import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);
const scryptOptions = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64, scryptOptions);
  return `${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password, hash) {
  const [salt, expectedHex] = hash.split(':');
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await deriveKey(password, salt, 64, scryptOptions);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export const hashToken = (token) => createHash('sha256').update(token).digest('hex');
export const makeToken = () => randomBytes(32).toString('hex');
export const hashCode = (secret, userId, purpose, code) =>
  createHmac('sha256', secret).update(`${userId}:${purpose}:${code}`).digest('hex');
export const sameHash = (a, b) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export class AppError extends Error {
  constructor(status, message, code = 'REQUEST_ERROR', details = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function requireString(value, field, min = 1, max = 254) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) {
    throw new AppError(400, `Confira o campo ${field}.`);
  }
  return value.trim();
}

export function normalizeEmail(value) {
  const email = requireString(value, 'e-mail', 5).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new AppError(400, 'Informe um e-mail válido.');
  return email;
}

export function requirePassword(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) {
    throw new AppError(400, 'A senha precisa ter entre 8 e 128 caracteres.');
  }
  return value;
}
