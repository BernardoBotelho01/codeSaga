import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AppError } from './security.js';
import { publicCourse } from './curriculum.js';

export function createApp({ service, mailMode, production = false, origins = [], engine }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"] },
      },
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        callback(null, !origin || origins.includes(origin));
      },
    }),
  );
  app.use(express.json({ limit: '16kb' }));
  app.use((req, res, next) => {
    if (
      ['POST', 'PATCH'].includes(req.method) &&
      (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
    )
      throw new AppError(400, 'Envie os campos do formulário em formato JSON.');
    next();
  });
  const generalLimiter = rateLimit({
    windowMs: 600000,
    limit: 400,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Muitas solicitações. Aguarde alguns minutos.' },
  });
  const authLimiter = rateLimit({
    windowMs: 900000,
    limit: 50,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Muitas tentativas de acesso. Aguarde alguns minutos.' },
  });
  app.use('/api', generalLimiter);
  app.get('/api/health', (_, res) => res.json({ status: 'ok', database: engine }));
  app.get('/api/config', (_, res) =>
    res.json({ mailMode, production, codeLength: 6, codeExpiryMinutes: 10, resendSeconds: 45 }),
  );
  app.get('/api/course/:language', (req, res) => {
    const course = publicCourse(req.params.language);
    if (!course) throw new AppError(404, 'Linguagem indisponível.');
    res.json(course);
  });
  app.use('/api/auth', authLimiter);
  app.post('/api/auth/register', async (req, res) =>
    res.status(201).json(await service.register(req.body)),
  );
  app.post('/api/auth/verify', async (req, res) => res.json(await service.verify(req.body)));
  app.post('/api/auth/resend', async (req, res) => res.json(await service.resend(req.body)));
  app.post('/api/auth/login', async (req, res) => res.json(await service.login(req.body)));
  app.post('/api/auth/forgot', async (req, res) => res.json(await service.forgot(req.body)));
  app.post('/api/auth/reset', async (req, res) => res.json(await service.resetPassword(req.body)));
  app.use('/api', async (req, res, next) => {
    req.token = req.get('Authorization')?.replace(/^Bearer /, '');
    req.userId = await service.authenticate(req.token);
    next();
  });
  app.get('/api/me', async (req, res) => res.json(await service.profile(req.userId)));
  app.patch('/api/me', async (req, res) =>
    res.json(await service.updateProfile(req.userId, req.body)),
  );
  app.post('/api/me/password/code', authLimiter, async (req, res) => {
    const user = await service.profile(req.userId);
    res.json(await service.forgot({ email: user.email }));
  });
  app.post('/api/me/password', authLimiter, async (req, res) => {
    const user = await service.profile(req.userId);
    res.json(await service.resetPassword({ ...req.body, email: user.email }));
  });
  app.post('/api/me/tutorial', async (req, res) =>
    res.json(await service.completeTutorial(req.userId)),
  );
  app.get('/api/me/history', async (req, res) => res.json(await service.history(req.userId)));
  app.get('/api/ranking', async (req, res) => res.json(await service.leaderboard(50, req.userId)));
  app.post('/api/attempts', async (req, res) =>
    res.json(await service.attempt(req.userId, req.body)),
  );
  app.post('/api/auth/logout', async (req, res) => {
    await service.logout(req.token);
    res.json({ ok: true });
  });
  app.use('/api', () => {
    throw new AppError(404, 'Recurso não encontrado.');
  });

  const builtClient = fileURLToPath(new URL('../../client/dist', import.meta.url));
  if (production && existsSync(`${builtClient}/index.html`)) app.use(express.static(builtClient));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || 500;
    if (status >= 500) console.error(`[API] ${error.code || 'erro'}: ${error.message}`);
    res.status(status).json({
      message:
        status >= 500 && !(error instanceof AppError)
          ? 'O servidor encontrou um problema. Tente novamente.'
          : error.message,
      code: error.code || 'SERVER_ERROR',
      ...error.details,
    });
  });
  return app;
}
