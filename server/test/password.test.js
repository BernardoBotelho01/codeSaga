import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase } from '../src/db.js';
import { createService } from '../src/service.js';
import { createApp } from '../src/app.js';

test('troca pelo perfil envia ao dono da sessão, exige código e encerra as sessões', async (t) => {
  const db = await createDatabase();
  const messages = [];
  const service = createService({
    db,
    mailer: { mode: 'smtp', send: async (message) => messages.push(message) },
    secret: 'segredo-do-teste-de-senha-com-32-caracteres',
  });
  const app = createApp({ service, mailMode: 'smtp', engine: db.engine });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  async function request(path, body, token) {
    const response = await fetch(`${base}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  }
  const account = {
    name: 'Conta do teste',
    email: 'dono@example.com',
    password: 'SenhaAntiga123',
    language: 'python',
  };
  await request('/auth/register', account);
  const verified = await request('/auth/verify', { email: account.email, code: messages[0].code });
  const firstToken = verified.body.token;
  const secondToken = (await request('/auth/login', account)).body.token;

  assert.equal((await request('/me/password/code', {})).status, 401);
  assert.equal(
    (await request('/me/password/code', { email: 'outra@example.com' }, firstToken)).status,
    200,
  );
  let reset = messages.findLast((message) => message.purpose === 'reset');
  assert.equal(reset.email, account.email);
  assert.match(reset.code, /^\d{6}$/);
  assert.equal((await request('/me/password/code', {}, firstToken)).body.code, 'RESEND_COOLDOWN');
  const wrong = reset.code === '000000' ? '111111' : '000000';
  assert.equal(
    (await request('/me/password', { code: wrong, password: 'SenhaNova123' }, firstToken)).body
      .code,
    'WRONG_CODE',
  );
  assert.equal((await request('/me', undefined, secondToken)).status, 200);
  await db.query(
    "UPDATE email_codes SET expires_at=NOW()-INTERVAL '1 second' WHERE purpose='reset'",
  );
  assert.equal(
    (await request('/me/password', { code: reset.code, password: 'SenhaNova123' }, firstToken)).body
      .code,
    'CODE_EXPIRED',
  );
  await db.query("UPDATE email_codes SET sent_at=NOW()-INTERVAL '1 minute' WHERE purpose='reset'");
  await request('/me/password/code', {}, firstToken);
  reset = messages.findLast((message) => message.purpose === 'reset');
  const changed = await request(
    '/me/password',
    { email: 'outra@example.com', code: reset.code, password: 'SenhaNova123' },
    firstToken,
  );
  assert.equal(changed.status, 200);
  assert.equal((await request('/me', undefined, firstToken)).status, 401);
  assert.equal((await request('/me', undefined, secondToken)).status, 401);
  assert.equal((await request('/auth/login', account)).status, 401);
  assert.equal(
    (await request('/auth/login', { ...account, password: 'SenhaNova123' })).status,
    200,
  );
  assert.equal(
    (
      await request('/auth/reset', {
        email: account.email,
        code: reset.code,
        password: 'SenhaReutilizada123',
      })
    ).status,
    400,
  );

  const count = messages.length;
  assert.equal((await request('/auth/forgot', { email: 'semconta@example.com' })).status, 200);
  assert.equal(messages.length, count);
});
