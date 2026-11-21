import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  envDir: fileURLToPath(new URL('..', import.meta.url)),
  base: './',
  server: {
    host: '127.0.0.1',
    port: Number(process.env.PORT) || 5173,
    proxy: { '/api': 'http://127.0.0.1:4000' },
    allowedHosts: ['localhost', '.chatgpt-team.site', '.openai.org'],
  },
});
