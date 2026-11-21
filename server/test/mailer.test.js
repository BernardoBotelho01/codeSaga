import test from 'node:test';
import assert from 'node:assert/strict';
import { SMTPServer } from 'smtp-server';
import { createMailer } from '../src/mailer.js';

test('o transporte SMTP entrega o código e o destinatário ao servidor de e-mail', async (t) => {
  let message;
  const server = new SMTPServer({
    authOptional: true,
    disabledCommands: ['AUTH', 'STARTTLS'],
    onData(stream, session, done) {
      let body = '';
      stream.on('data', (chunk) => {
        body += chunk;
      });
      stream.on('end', () => {
        message = { body, to: session.envelope.rcptTo.map((recipient) => recipient.address) };
        done();
      });
    },
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const environment = { ...process.env };
  t.after(async () => {
    process.env = environment;
    await new Promise((resolve) => server.close(resolve));
  });
  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = String(server.server.address().port);
  process.env.SMTP_SECURE = 'false';
  process.env.SMTP_USER = '';
  process.env.MAIL_FROM = 'CodeSaga <codesaga@example.com>';
  const mailer = createMailer({ mode: 'smtp' });
  await mailer.verify();
  assert.equal(message, undefined);
  await mailer.send({ email: 'explorador@example.com', code: '381725', purpose: 'verify' });
  assert.deepEqual(message.to, ['explorador@example.com']);
  assert.match(message.body, /381725/);
  assert.match(message.body, /CodeSaga/);
});
