import 'dotenv/config';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

export const root = fileURLToPath(new URL('../..', import.meta.url));
dotenv.config({ path: `${root}/.env`, quiet: true });
const production = process.env.NODE_ENV === 'production';

async function getSecret() {
  if (process.env.APP_SECRET?.length >= 32) return process.env.APP_SECRET;
  if (production) throw new Error('Configure APP_SECRET com pelo menos 32 caracteres.');
  await mkdir(`${root}/.local`, { recursive: true });
  const path = `${root}/.local/secret`;
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const secret = randomBytes(32).toString('hex');
    await writeFile(path, secret, { mode: 0o600 });
    return secret;
  }
}

export const config = {
  production,
  port: Number(process.env.API_PORT || process.env.PORT || 4000),
  secret: await getSecret(),
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  origins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  mailMode: process.env.MAIL_MODE || 'console',
  cooldownSeconds: production
    ? 3600
    : Math.max(1, Number(process.env.LIFE_COOLDOWN_SECONDS) || 3600),
};

if (production && !config.databaseUrl)
  throw new Error('Configure DATABASE_URL para o PostgreSQL de produção.');
if (production && config.mailMode !== 'smtp')
  throw new Error('Configure MAIL_MODE=smtp e o servidor de e-mail em produção.');
