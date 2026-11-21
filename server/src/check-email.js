import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { createMailer } from './mailer.js';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

async function checkEmail() {
  if (process.env.MAIL_MODE !== 'smtp') {
    throw new Error('Execute npm run setup:gmail para preparar o envio real.');
  }
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];
  const pending = required.filter((key) => {
    const value = process.env[key];
    return !value?.trim() || /SEU_GMAIL|COLE_A_SENHA|noreply@exemplo\.com/.test(value);
  });
  if (pending.length) throw new Error(`Preencha no .env os campos ${pending.join(', ')}.`);
  const mailer = createMailer({ mode: 'smtp', production: process.env.NODE_ENV === 'production' });
  console.log('Verificando a conexão e a autenticação SMTP…');
  await mailer.verify();
  console.log('Conexão SMTP autenticada.');
  console.log(
    'Execute npm run dev e cadastre uma conta para testar a chegada do código à caixa de e-mail.',
  );
}

try {
  await checkEmail();
} catch (error) {
  if (error.code === 'EAUTH') {
    console.error(
      'O Gmail recusou a autenticação. Confira o endereço e gere uma senha de app na Conta Google.',
    );
  } else if (error.code) {
    console.error(
      `A conexão SMTP falhou (${error.code}). Confira o host, a porta e o acesso à internet.`,
    );
  } else console.error(error.message);
  process.exitCode = 1;
}
