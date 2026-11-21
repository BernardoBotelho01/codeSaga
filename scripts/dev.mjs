import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
if (!existsSync(`${root}/.env`)) await import('./setup.mjs');
const backend = spawn(process.execPath, ['--watch', 'server/src/index.js'], {
  cwd: root,
  stdio: 'inherit',
});
const frontend = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--config',
    'client/vite.config.js',
    'client',
    ...process.argv.slice(2),
  ],
  { cwd: root, stdio: 'inherit' },
);
const children = [backend, frontend];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
for (const child of children) {
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code) => stop(code || 0));
}
