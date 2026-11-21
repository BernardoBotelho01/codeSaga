import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../src/db.js';
import { createService } from '../src/service.js';
import { createApp } from '../src/app.js';
import { getCourse, languages } from '../src/curriculum.js';

test('fluxo HTTP completo, pontuação, repetição, vidas e recuperação de senha', async (t) => {
  const db = await createDatabase({ url: process.env.TEST_DATABASE_URL });
  const messages = [];
  const mailer = { mode: 'console', send: async (message) => messages.push(message) };
  const service = createService({
    db,
    mailer,
    secret: 'segredo-exclusivo-do-teste-com-32-caracteres',
  });
  const app = createApp({
    service,
    mailMode: 'console',
    origins: ['http://localhost:5173'],
    engine: db.engine,
  });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await db.close();
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let token;
  async function request(path, body, method = body ? 'POST' : 'GET') {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  }
  const account = {
    name: 'Explorador de teste',
    email: 'explorador@example.com',
    password: 'SenhaTeste123!',
    language: 'python',
  };
  assert.equal((await request('/auth/register', account)).status, 201);
  assert.equal(messages.length, 1);
  assert.match(messages[0].code, /^\d{6}$/);
  assert.equal((await request('/auth/login', account)).body.code, 'EMAIL_UNVERIFIED');
  const incorrect = messages[0].code === '000000' ? '111111' : '000000';
  assert.equal(
    (await request('/auth/verify', { email: account.email, code: incorrect })).status,
    400,
  );
  assert.equal((await db.query('SELECT attempts FROM email_codes')).rows[0].attempts, 1);
  const verified = await request('/auth/verify', { email: account.email, code: messages[0].code });
  assert.equal(verified.status, 200);
  token = verified.body.token;
  assert.equal(verified.body.user.verified, true);
  assert.equal(verified.body.user.lives, 5);
  assert.equal(verified.body.user.xp, 0);
  assert.equal((await request('/me/tutorial', {})).body.tutorialCompleted, true);

  assert.equal(
    (
      await request('/attempts', {
        language: 'python',
        exerciseId: 'm2-e1',
        answer: 0,
        requestId: randomUUID(),
      })
    ).body.code,
    'EXERCISE_LOCKED',
  );
  const id = randomUUID();
  const first = { language: 'python', exerciseId: 'm1-e1', answer: 0, requestId: id };
  const firstResult = await request('/attempts', first);
  assert.equal(firstResult.body.xpEarned, 20);
  assert.equal((await request('/attempts', first)).body.user.xp, 20);
  assert.equal(
    (await db.query('SELECT COUNT(*)::INTEGER AS count FROM attempts')).rows[0].count,
    1,
  );
  const practice = await request('/attempts', { ...first, answer: 2, requestId: randomUUID() });
  assert.equal(practice.body.practice, true);
  assert.equal(practice.body.user.lives, 5);
  const concurrent = await Promise.all(
    Array.from({ length: 3 }, () =>
      request('/attempts', {
        language: 'python',
        exerciseId: 'm1-e2',
        answer: '8',
        requestId: randomUUID(),
      }),
    ),
  );
  assert.equal(
    concurrent.reduce((sum, result) => sum + result.body.xpEarned, 0),
    20,
  );
  assert.equal((await request('/me')).body.xp, 40);

  for (let index = 0; index < 5; index++) {
    const wrong = await request('/attempts', {
      language: 'python',
      exerciseId: 'm1-e3',
      answer: 'moedas = 0',
      requestId: randomUUID(),
    });
    assert.equal(wrong.body.user.lives, 4 - index);
  }
  const blocked = await request('/attempts', {
    language: 'python',
    exerciseId: 'm1-e3',
    answer: 'moedas = 10',
    requestId: randomUUID(),
  });
  assert.equal(blocked.status, 423);
  await db.query("UPDATE users SET blocked_until=NOW()-INTERVAL '1 second' WHERE email=$1", [
    account.email,
  ]);
  assert.equal((await request('/me')).body.lives, 5);
  for (const language of languages) {
    const course = getCourse(language);
    for (const exercise of course.missions.flatMap((mission) => mission.exercises)) {
      const answer =
        exercise.type === 'choice'
          ? exercise.answer
          : exercise.type === 'code'
            ? exercise.sample
            : exercise.answers[0];
      const result = await request('/attempts', {
        language,
        exerciseId: exercise.id,
        answer,
        requestId: randomUUID(),
      });
      assert.equal(result.status, 200, `${language}:${exercise.id}: ${result.body.message}`);
      assert.equal(result.body.correct, true, `${language}:${exercise.id}`);
    }
  }
  const finished = (await request('/me')).body;
  assert.equal(finished.xp, 900);
  for (const language of languages) assert.equal(finished.progress[language].length, 15);
  assert.equal(finished.rank, 1);
  const updated = await request(
    '/me',
    { name: 'Nome atualizado', language: 'java', avatar: 'purple' },
    'PATCH',
  );
  assert.equal(updated.body.name, 'Nome atualizado');
  assert.equal(updated.body.language, 'java');
  assert.equal(updated.body.xp, 900);
  const ranking = (await request('/ranking')).body;
  assert.equal(ranking.players.length, 1);
  assert.equal(ranking.players[0].xp, 900);
  assert.equal(Object.hasOwn(ranking.players[0], 'email'), false);

  assert.equal((await request('/auth/forgot', { email: account.email })).status, 200);
  const reset = messages.findLast((message) => message.purpose === 'reset');
  assert.equal(
    (
      await request('/auth/reset', {
        email: account.email,
        code: reset.code,
        password: 'NovaSenha123!',
      })
    ).status,
    200,
  );
  assert.equal((await request('/me')).status, 401);
  assert.equal((await request('/auth/login', account)).status, 401);
  const login = await request('/auth/login', { email: account.email, password: 'NovaSenha123!' });
  assert.equal(login.status, 200);
  token = login.body.token;
  assert.equal((await request('/auth/logout', {})).status, 200);
  assert.equal((await request('/me')).status, 401);
});

test('limite persistente de códigos, reenvio e rollback quando o e-mail falha', async (t) => {
  const db = await createDatabase({ url: process.env.TEST_DATABASE_URL });
  t.after(() => db.close());
  const messages = [];
  const service = createService({
    db,
    mailer: { mode: 'console', send: async (message) => messages.push(message) },
    secret: 'segredo-do-teste-com-mais-de-32-caracteres',
  });
  const account = {
    name: 'Teste',
    email: 'teste@example.com',
    password: 'SenhaTeste123',
    language: 'java',
  };
  await service.register(account);
  await assert.rejects(
    () => service.resend(account),
    (error) => error.code === 'RESEND_COOLDOWN',
  );
  const code = messages[0].code === '000000' ? '999999' : '000000';
  for (let index = 0; index < 5; index++)
    await assert.rejects(
      () => service.verify({ email: account.email, code }),
      (error) => error.code === 'WRONG_CODE',
    );
  await assert.rejects(
    () => service.verify({ email: account.email, code: messages[0].code }),
    (error) => error.code === 'CODE_LOCKED',
  );
  assert.equal((await db.query('SELECT attempts FROM email_codes')).rows[0].attempts, 5);
  await db.query("UPDATE email_codes SET sent_at=NOW()-INTERVAL '1 minute'");
  await service.resend(account);
  assert.equal(
    (await service.verify({ email: account.email, code: messages[1].code })).user.verified,
    true,
  );
  const broken = createService({
    db,
    mailer: {
      mode: 'smtp',
      send: async () => {
        throw new Error('SMTP indisponível');
      },
    },
    secret: 'segredo-do-teste-com-mais-de-32-caracteres',
  });
  await assert.rejects(() => broken.register({ ...account, email: 'falha@example.com' }));
  assert.equal(
    (await db.query('SELECT id FROM users WHERE email=$1', ['falha@example.com'])).rows.length,
    0,
  );
});
