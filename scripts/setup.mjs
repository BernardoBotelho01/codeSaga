import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const target = `${root}/.env`;
if (!existsSync(target)) {
  const template = readFileSync(`${root}/.env.example`, 'utf8');
  writeFileSync(
    target,
    template.replace('APP_SECRET=', `APP_SECRET=${randomBytes(32).toString('hex')}`),
  );
  console.log('Configuração criada em .env. Banco local e e-mail de teste prontos.');
} else {
  console.log('A configuração .env já existe. Seus dados foram preservados.');
}
console.log('Agora execute npm run dev e abra http://localhost:5173.');
