import { randomInt, randomUUID } from 'node:crypto';
import {
  AppError,
  hashCode,
  hashPassword,
  hashToken,
  makeToken,
  normalizeEmail,
  requirePassword,
  requireString,
  sameHash,
  verifyPassword,
} from './security.js';
import { getCourse, gradeExercise, languages, POINTS } from './curriculum.js';

const avatars = ['turquoise', 'lime', 'purple', 'orange'];
const errorResult = (status, message, code, details) => ({
  error: new AppError(status, message, code, details),
});
function unwrap(result) {
  if (result.error) throw result.error;
  return result;
}
function languageOf(value) {
  if (!languages.includes(value)) throw new AppError(400, 'Escolha Python, Java ou JavaScript.');
  return value;
}

export function createService({ db, mailer, secret, cooldownSeconds = 3600 }) {
  async function sendCode(tx, user, purpose) {
    const previous = (
      await tx.query('SELECT * FROM email_codes WHERE user_id=$1 AND purpose=$2', [
        user.id,
        purpose,
      ])
    ).rows[0];
    const seconds = previous
      ? Math.ceil((new Date(previous.sent_at).getTime() + 45000 - Date.now()) / 1000)
      : 0;
    if (seconds > 0)
      throw new AppError(
        429,
        `Aguarde ${seconds} segundos para pedir outro código.`,
        'RESEND_COOLDOWN',
        { retryAfter: seconds },
      );
    const code = String(randomInt(0, 1000000)).padStart(6, '0');
    await tx.query(
      `INSERT INTO email_codes (user_id,purpose,code_hash,expires_at,sent_at,attempts)
      VALUES ($1,$2,$3,$4,NOW(),0) ON CONFLICT (user_id,purpose) DO UPDATE
      SET code_hash=EXCLUDED.code_hash,expires_at=EXCLUDED.expires_at,sent_at=NOW(),attempts=0`,
      [user.id, purpose, hashCode(secret, user.id, purpose, code), new Date(Date.now() + 600000)],
    );
    await mailer.send({ email: user.email, code, purpose });
  }

  async function checkCode(tx, user, purpose, code) {
    const record = (
      await tx.query('SELECT * FROM email_codes WHERE user_id=$1 AND purpose=$2 FOR UPDATE', [
        user.id,
        purpose,
      ])
    ).rows[0];
    if (!record || new Date(record.expires_at).getTime() <= Date.now())
      return errorResult(400, 'O código expirou. Solicite um novo.', 'CODE_EXPIRED');
    if (record.attempts >= 5)
      return errorResult(
        429,
        'Limite de tentativas atingido. Solicite outro código.',
        'CODE_LOCKED',
      );
    if (!sameHash(record.code_hash, hashCode(secret, user.id, purpose, code))) {
      await tx.query('UPDATE email_codes SET attempts=attempts+1 WHERE user_id=$1 AND purpose=$2', [
        user.id,
        purpose,
      ]);
      return errorResult(400, 'Código incorreto. Confira os seis dígitos.', 'WRONG_CODE');
    }
    await tx.query('DELETE FROM email_codes WHERE user_id=$1 AND purpose=$2', [user.id, purpose]);
    return { ok: true };
  }

  async function newSession(tx, userId, remember = false) {
    const token = makeToken();
    const duration = remember ? 30 : 1;
    await tx.query('DELETE FROM sessions WHERE user_id=$1 AND expires_at<NOW()', [userId]);
    await tx.query('INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)', [
      hashToken(token),
      userId,
      new Date(Date.now() + duration * 86400000),
    ]);
    return token;
  }

  async function profile(userId) {
    await db.query(
      'UPDATE users SET lives=5,blocked_until=NULL WHERE id=$1 AND lives=0 AND blocked_until<=NOW()',
      [userId],
    );
    const user = (
      await db.query(
        'SELECT id,name,email,verified,language,avatar,tutorial_completed,lives,blocked_until,created_at FROM users WHERE id=$1',
        [userId],
      )
    ).rows[0];
    if (!user) throw new AppError(401, 'Entre novamente na sua conta.', 'UNAUTHORIZED');
    const completions = (
      await db.query(
        'SELECT language,exercise_id,points FROM completions WHERE user_id=$1 ORDER BY completed_at',
        [userId],
      )
    ).rows;
    const scores = await leaderboard(100, userId);
    const stats = (
      await db.query(
        'SELECT COUNT(*) AS total,COUNT(*) FILTER (WHERE correct) AS correct FROM attempts WHERE user_id=$1',
        [userId],
      )
    ).rows[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      verified: user.verified,
      language: user.language,
      avatar: user.avatar,
      tutorialCompleted: user.tutorial_completed,
      lives: user.lives,
      blockedUntil: user.blocked_until,
      createdAt: user.created_at,
      xp: completions.reduce((sum, completion) => sum + completion.points, 0),
      rank: scores.me?.rank || 1,
      progress: Object.fromEntries(
        languages.map((language) => [
          language,
          completions.filter((item) => item.language === language).map((item) => item.exercise_id),
        ]),
      ),
      attempts: Number(stats.total),
      correctAttempts: Number(stats.correct),
    };
  }

  async function leaderboard(limit = 50, userId) {
    const result = await db.query(
      `WITH scores AS (
      SELECT u.id,u.name,u.avatar,u.created_at,COALESCE(SUM(c.points),0)::INTEGER AS xp
      FROM users u LEFT JOIN completions c ON c.user_id=u.id WHERE u.verified=TRUE
      GROUP BY u.id,u.name,u.avatar,u.created_at
    ), ranked AS (SELECT *,DENSE_RANK() OVER (ORDER BY xp DESC)::INTEGER AS rank FROM scores)
    SELECT id,name,avatar,xp,rank FROM ranked ORDER BY xp DESC,created_at ASC,id ASC LIMIT $1`,
      [limit],
    );
    let me = result.rows.find((row) => row.id === userId);
    if (userId && !me) {
      const total = (
        await db.query(
          'SELECT COALESCE(SUM(points),0)::INTEGER AS xp FROM completions WHERE user_id=$1',
          [userId],
        )
      ).rows[0].xp;
      const rank = (
        await db.query(
          `SELECT COUNT(DISTINCT xp)::INTEGER+1 AS rank FROM (
        SELECT COALESCE(SUM(c.points),0)::INTEGER AS xp FROM users u LEFT JOIN completions c ON u.id=c.user_id WHERE u.verified GROUP BY u.id
      ) scores WHERE xp>$1`,
          [total],
        )
      ).rows[0].rank;
      me = { rank, xp: total };
    }
    return { players: result.rows, me };
  }

  return {
    profile,
    leaderboard,
    async register(input) {
      const name = requireString(input.name, 'nome', 2, 40);
      const email = normalizeEmail(input.email);
      const password = requirePassword(input.password);
      const language = languageOf(input.language);
      const passwordHash = await hashPassword(password);
      await db.transaction(async (tx) => {
        const user = { id: randomUUID(), name, email };
        const inserted = await tx.query(
          `INSERT INTO users (id,name,email,password_hash,language) VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (email) DO NOTHING RETURNING id`,
          [user.id, name, email, passwordHash, language],
        );
        if (!inserted.rows.length)
          throw new AppError(
            409,
            'Este e-mail já tem uma conta. Entre ou use o reenvio de código.',
            'EMAIL_EXISTS',
          );
        await sendCode(tx, user, 'verify');
      });
      return { email, delivery: mailer.mode, message: 'Confirme o e-mail para ativar sua conta.' };
    },
    async verify(input) {
      const email = normalizeEmail(input.email);
      const code = requireString(input.code, 'código', 6, 6);
      if (!/^\d{6}$/.test(code)) throw new AppError(400, 'Digite os seis números do código.');
      const result = await db.transaction(async (tx) => {
        const user = (await tx.query('SELECT * FROM users WHERE email=$1 FOR UPDATE', [email]))
          .rows[0];
        if (!user) return errorResult(400, 'Código ou e-mail inválido.');
        if (user.verified)
          return errorResult(
            409,
            'Sua conta já foi confirmada. Entre com a senha.',
            'ALREADY_VERIFIED',
          );
        const checked = await checkCode(tx, user, 'verify', code);
        if (checked.error) return checked;
        await tx.query('UPDATE users SET verified=TRUE WHERE id=$1', [user.id]);
        return { token: await newSession(tx, user.id), userId: user.id };
      });
      unwrap(result);
      return { token: result.token, user: await profile(result.userId) };
    },
    async resend(input) {
      const email = normalizeEmail(input.email);
      await db.transaction(async (tx) => {
        const user = (await tx.query('SELECT * FROM users WHERE email=$1 FOR UPDATE', [email]))
          .rows[0];
        if (user && !user.verified) await sendCode(tx, user, 'verify');
      });
      return {
        delivery: mailer.mode,
        message: 'Se houver uma conta pendente, um novo código será enviado.',
      };
    },
    async login(input) {
      const email = normalizeEmail(input.email);
      const password = requirePassword(input.password);
      const user = (await db.query('SELECT * FROM users WHERE email=$1', [email])).rows[0];
      if (!user || !(await verifyPassword(password, user.password_hash)))
        throw new AppError(401, 'E-mail ou senha incorretos.', 'INVALID_LOGIN');
      if (!user.verified)
        throw new AppError(403, 'Confirme seu e-mail para entrar.', 'EMAIL_UNVERIFIED', { email });
      const result = await db.transaction(async (tx) => {
        const current = (
          await tx.query('SELECT password_hash,verified FROM users WHERE id=$1 FOR UPDATE', [
            user.id,
          ])
        ).rows[0];
        if (current.password_hash !== user.password_hash || !current.verified)
          throw new AppError(401, 'Seus dados de acesso mudaram. Entre novamente.');
        return newSession(tx, user.id, input.remember === true);
      });
      return { token: result, user: await profile(user.id) };
    },
    async authenticate(token) {
      if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token))
        throw new AppError(401, 'Entre para continuar.', 'UNAUTHORIZED');
      const session = (
        await db.query(
          `SELECT s.user_id FROM sessions s JOIN users u ON u.id=s.user_id
        WHERE s.token_hash=$1 AND s.expires_at>NOW() AND u.verified=TRUE`,
          [hashToken(token)],
        )
      ).rows[0];
      if (!session) throw new AppError(401, 'Sua sessão expirou. Entre novamente.', 'UNAUTHORIZED');
      return session.user_id;
    },
    async logout(token) {
      await db.query('DELETE FROM sessions WHERE token_hash=$1', [hashToken(token)]);
    },
    async forgot(input) {
      const email = normalizeEmail(input.email);
      await db.transaction(async (tx) => {
        const user = (await tx.query('SELECT * FROM users WHERE email=$1 FOR UPDATE', [email]))
          .rows[0];
        if (user?.verified) await sendCode(tx, user, 'reset');
      });
      return {
        delivery: mailer.mode,
        message:
          'Se o e-mail estiver cadastrado e confirmado, você receberá um código de recuperação.',
      };
    },
    async resetPassword(input) {
      const email = normalizeEmail(input.email);
      const code = requireString(input.code, 'código', 6, 6);
      const passwordHash = await hashPassword(requirePassword(input.password));
      const result = await db.transaction(async (tx) => {
        const user = (await tx.query('SELECT * FROM users WHERE email=$1 FOR UPDATE', [email]))
          .rows[0];
        if (!user?.verified) return errorResult(400, 'Código ou e-mail inválido.');
        const checked = await checkCode(tx, user, 'reset', code);
        if (checked.error) return checked;
        await tx.query('UPDATE users SET password_hash=$1 WHERE id=$2', [passwordHash, user.id]);
        await tx.query('DELETE FROM sessions WHERE user_id=$1', [user.id]);
        return { message: 'Senha atualizada. Entre com a nova senha.' };
      });
      return unwrap(result);
    },
    async updateProfile(userId, input) {
      const name = input.name === undefined ? null : requireString(input.name, 'nome', 2, 40);
      const language = input.language === undefined ? null : languageOf(input.language);
      const avatar = input.avatar === undefined ? null : input.avatar;
      if (avatar !== null && !avatars.includes(avatar))
        throw new AppError(400, 'Escolha um dos avatares disponíveis.');
      await db.query(
        'UPDATE users SET name=COALESCE($1,name),language=COALESCE($2,language),avatar=COALESCE($3,avatar) WHERE id=$4',
        [name, language, avatar, userId],
      );
      return profile(userId);
    },
    async completeTutorial(userId) {
      await db.query('UPDATE users SET tutorial_completed=TRUE WHERE id=$1', [userId]);
      return profile(userId);
    },
    async attempt(userId, input) {
      const language = languageOf(input.language);
      const course = getCourse(language);
      const exercises = course.missions.flatMap((mission) => mission.exercises);
      const exerciseIndex = exercises.findIndex((exercise) => exercise.id === input.exerciseId);
      if (exerciseIndex < 0) throw new AppError(404, 'Atividade indisponível.');
      const requestId = requireString(input.requestId, 'identificador da tentativa', 36, 36);
      if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(requestId))
        throw new AppError(400, 'Identificador de tentativa inválido.');
      const exercise = exercises[exerciseIndex];
      if (
        exercise.type === 'choice' &&
        (!Number.isInteger(input.answer) ||
          input.answer < 0 ||
          input.answer >= exercise.options.length)
      )
        throw new AppError(400, 'Escolha uma alternativa.');
      if (exercise.type !== 'choice') requireString(input.answer, 'resposta', 1, 2000);
      const result = await db.transaction(async (tx) => {
        const user = (
          await tx.query('SELECT lives,blocked_until FROM users WHERE id=$1 FOR UPDATE', [userId])
        ).rows[0];
        const previous = (
          await tx.query(
            'SELECT language,exercise_id,result FROM attempts WHERE user_id=$1 AND request_id=$2',
            [userId, requestId],
          )
        ).rows[0];
        if (previous) {
          if (previous.language !== language || previous.exercise_id !== exercise.id)
            throw new AppError(409, 'Esta tentativa já pertence a outra atividade.');
          return previous.result;
        }
        const completed = (
          await tx.query('SELECT exercise_id FROM completions WHERE user_id=$1 AND language=$2', [
            userId,
            language,
          ])
        ).rows.map((row) => row.exercise_id);
        if (exercises.slice(0, exerciseIndex).some((item) => !completed.includes(item.id)))
          throw new AppError(
            409,
            'Conclua as atividades anteriores para liberar esta missão.',
            'EXERCISE_LOCKED',
          );
        const practice = completed.includes(exercise.id);
        let lives = user.lives;
        if (lives === 0 && new Date(user.blocked_until).getTime() <= Date.now()) {
          lives = 5;
          await tx.query('UPDATE users SET lives=5,blocked_until=NULL WHERE id=$1', [userId]);
        }
        if (!practice && lives === 0)
          throw new AppError(
            423,
            'Suas vidas estão se recuperando. Volte após a pausa.',
            'LIVES_EMPTY',
            { blockedUntil: user.blocked_until },
          );
        const graded = gradeExercise(exercise, language, input.answer);
        let xpEarned = 0;
        if (graded.correct && !practice) {
          await tx.query(
            'INSERT INTO completions (user_id,language,exercise_id,points) VALUES ($1,$2,$3,$4)',
            [userId, language, exercise.id, POINTS],
          );
          xpEarned = POINTS;
        }
        if (!graded.correct && !practice) {
          const remaining = lives - 1;
          const blockedUntil =
            remaining === 0 ? new Date(Date.now() + cooldownSeconds * 1000) : null;
          await tx.query('UPDATE users SET lives=$1,blocked_until=$2 WHERE id=$3', [
            remaining,
            blockedUntil,
            userId,
          ]);
        }
        const feedback = { ...graded, xpEarned, practice, exerciseId: exercise.id };
        await tx.query(
          'INSERT INTO attempts (id,user_id,request_id,language,exercise_id,correct,result) VALUES ($1,$2,$3,$4,$5,$6,$7)',
          [
            randomUUID(),
            userId,
            requestId,
            language,
            exercise.id,
            graded.correct,
            JSON.stringify(feedback),
          ],
        );
        return feedback;
      });
      return { ...result, user: await profile(userId) };
    },
    async history(userId) {
      return (
        await db.query(
          'SELECT language,exercise_id,correct,created_at FROM attempts WHERE user_id=$1 ORDER BY created_at DESC LIMIT 15',
          [userId],
        )
      ).rows;
    },
  };
}
