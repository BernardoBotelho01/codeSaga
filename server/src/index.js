import { mkdir } from 'node:fs/promises';
import { config, root } from './config.js';
import { createDatabase } from './db.js';
import { createMailer } from './mailer.js';
import { createService } from './service.js';
import { createApp } from './app.js';

if (!config.databaseUrl) await mkdir(`${root}/.local`, { recursive: true });
const db = await createDatabase({
  url: config.databaseUrl,
  ssl: config.databaseSsl,
  directory: `${root}/.local/database`,
});
const mailer = createMailer({ mode: config.mailMode, production: config.production });
const service = createService({
  db,
  mailer,
  secret: config.secret,
  cooldownSeconds: config.cooldownSeconds,
});
const app = createApp({
  service,
  mailMode: mailer.mode,
  production: config.production,
  origins: config.origins,
  engine: db.engine,
});
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`CodeSaga API em http://localhost:${config.port} | ${db.engine}`);
  if (mailer.mode === 'console')
    console.log(
      'E-mails locais: os códigos de confirmação aparecem neste terminal. Para enviar ao e-mail real, configure SMTP no .env.',
    );
});
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
