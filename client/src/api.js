const configured = import.meta.env.VITE_API_URL?.trim();
export const apiBase = (configured || '/api').replace(/\/$/, '');
const key = 'codesaga.session.v1';
let token = readToken();

function readToken() {
  try {
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveSession(value, remember = false) {
  token = value;
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
    (remember ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    /* A sessão continua em memória quando o navegador bloqueia o armazenamento. */
  }
}

export function clearSession() {
  token = null;
  try {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  } catch {
    /* Sem armazenamento disponível. */
  }
}

export const hasSession = () => Boolean(token);

export class ApiError extends Error {
  constructor(message, data, status) {
    super(message);
    Object.assign(this, data, { status });
  }
}

export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      method,
      signal,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(
      'Não foi possível conectar à API. Confira se o servidor Node.js está rodando e tente novamente.',
      {},
      0,
    );
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      'A API não respondeu em JSON. Confira a URL do servidor.',
      {},
      response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(data.message || 'Não foi possível concluir a ação.', data, response.status);
  return data;
}

export function requestId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0'));
  return [hex.slice(0, 4), hex.slice(4, 6), hex.slice(6, 8), hex.slice(8, 10), hex.slice(10)]
    .map((group) => group.join(''))
    .join('-');
}
