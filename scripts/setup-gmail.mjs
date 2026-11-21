import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const target = `${root}/.env`;
if (!existsSync(target)) await import('./setup.mjs');
let content = readFileSync(target, 'utf8');

function setValue(key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  if (pattern.test(content)) content = content.replace(pattern, () => line);
  else content = `${content.trimEnd()}\n${line}\n`;
}

setValue('MAIL_MODE', 'smtp');
setValue('SMTP_HOST', 'smtp.gmail.com');
setValue('SMTP_PORT', '465');
setValue('SMTP_SECURE', 'true');
// Estes valores permanecem locais. Uma configuração anterior pode ser reutilizada.
for (const [key, placeholder] of [
  ['SMTP_USER', 'SEU_GMAIL@gmail.com'],
  ['SMTP_PASS', 'COLE_A_SENHA_DE_APP_DO_GOOGLE'],
  ['MAIL_FROM', 'CodeSaga <SEU_GMAIL@gmail.com>'],
]) {
  const current = content.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim();
  if (!current || current.includes('noreply@exemplo.com')) setValue(key, placeholder);
}
writeFileSync(target, content, { mode: 0o600 });
console.log('Configuração do Gmail preparada no arquivo .env.');
console.log('Abra .env no VS Code e preencha SMTP_USER, SMTP_PASS e MAIL_FROM.');
console.log('Em SMTP_PASS, use a senha de app gerada pelo Google.');
console.log('Depois execute npm run email:check e npm run dev.');
