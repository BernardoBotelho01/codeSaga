import nodemailer from 'nodemailer';
import { AppError } from './security.js';

export function createMailer({ mode, production = false }) {
  if (mode === 'console' && !production) {
    return {
      mode: 'console',
      async send({ email, code, purpose }) {
        console.log(
          `\n[CODESAGA - E-MAIL LOCAL]\nPara: ${email}\nUso: ${purpose === 'verify' ? 'confirmar conta' : 'recuperar senha'}\nCódigo: ${code}\nValidade: 10 minutos\n`,
        );
      },
    };
  }
  if (mode !== 'smtp' || !process.env.SMTP_HOST)
    throw new Error('Configure SMTP_HOST e MAIL_MODE=smtp.');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: production && process.env.SMTP_SECURE !== 'true',
    auth: process.env.SMTP_USER
      ? {
          user:
            process.env.SMTP_HOST === 'smtp.gmail.com'
              ? process.env.SMTP_USER.trim()
              : process.env.SMTP_USER,
          pass:
            process.env.SMTP_HOST === 'smtp.gmail.com'
              ? process.env.SMTP_PASS?.replace(/\s+/g, '')
              : process.env.SMTP_PASS,
        }
      : undefined,
    connectionTimeout: 10000,
    socketTimeout: 15000,
  });
  return {
    mode: 'smtp',
    verify: () => transport.verify(),
    async send({ email, code, purpose }) {
      const action = purpose === 'verify' ? 'confirme sua conta' : 'redefina sua senha';
      const intent = purpose === 'verify' ? 'confirmar sua conta' : 'redefinir sua senha';
      try {
        await transport.sendMail({
          from: process.env.MAIL_FROM,
          to: email,
          subject: `CodeSaga - ${action}`,
          text: `Use o código ${code} para ${intent}. Ele vale por 10 minutos. Se você não solicitou, ignore esta mensagem.`,
          html: `<div style="font-family:Arial,sans-serif;background:#081323;color:#f3f8ff;padding:36px;border-radius:16px"><h1 style="color:#b7f143">CodeSaga</h1><h2>Seu código de verificação</h2><p>Use o código abaixo para ${intent}.</p><p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#30d8cf">${code}</p><p>Válido por 10 minutos.</p><p>Se você não solicitou, ignore esta mensagem.</p></div>`,
        });
      } catch {
        throw new AppError(
          503,
          'O e-mail não pôde ser enviado. Confira a configuração SMTP e tente novamente.',
          'MAIL_UNAVAILABLE',
        );
      }
    },
  };
}
