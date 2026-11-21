import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const project = fileURLToPath(new URL('../..', import.meta.url));

test('o preparo do Gmail preserva o banco, o segredo e credenciais locais existentes', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'codesaga-gmail-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, 'scripts'));
  await copyFile(
    join(project, 'scripts/setup-gmail.mjs'),
    join(directory, 'scripts/setup-gmail.mjs'),
  );
  const path = join(directory, '.env');
  await writeFile(
    path,
    'APP_SECRET=chave-do-teste\nDATABASE_URL=postgresql://teste\nMAIL_MODE=console\nSMTP_USER=\nSMTP_PASS=\nMAIL_FROM=CodeSaga <noreply@exemplo.com>\n',
  );
  await run(process.execPath, [join(directory, 'scripts/setup-gmail.mjs')]);
  let content = await readFile(path, 'utf8');
  assert.match(content, /APP_SECRET=chave-do-teste/);
  assert.match(content, /DATABASE_URL=postgresql:\/\/teste/);
  assert.match(content, /MAIL_MODE=smtp/);
  assert.match(content, /SMTP_HOST=smtp.gmail.com/);
  assert.match(content, /SMTP_PORT=465/);
  assert.match(content, /SMTP_SECURE=true/);
  content = content
    .replaceAll('SEU_GMAIL@gmail.com', 'teste@gmail.com')
    .replace('COLE_A_SENHA_DE_APP_DO_GOOGLE', 'abcd efgh ijkl mnop');
  await writeFile(path, content);
  const result = await run(process.execPath, [join(directory, 'scripts/setup-gmail.mjs')]);
  assert.equal(await readFile(path, 'utf8'), content);
  assert.equal(result.stdout.includes('abcd efgh ijkl mnop'), false);

  await rm(path);
  await copyFile(join(project, 'scripts/setup.mjs'), join(directory, 'scripts/setup.mjs'));
  await copyFile(join(project, '.env.example'), join(directory, '.env.example'));
  await run(process.execPath, [join(directory, 'scripts/setup-gmail.mjs')]);
  const fresh = await readFile(path, 'utf8');
  assert.match(fresh, /APP_SECRET=[a-f0-9]{64}/);
  assert.match(fresh, /MAIL_MODE=smtp/);
  assert.match(fresh, /SMTP_HOST=smtp.gmail.com/);
});
