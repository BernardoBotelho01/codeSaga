import { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  Clock3,
  Code2,
  Flag,
  Lightbulb,
  LockKeyhole,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { api, requestId } from '../api';
import { LANGUAGES, missionCount } from '../data';
import { HeroArt, Robot } from './Art';
import { Button, Notice, ProgressBar } from './Common';

function Cooldown({ user, onUser }) {
  const [now, setNow] = useState(Date.now());
  const refreshing = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.ceil((new Date(user.blockedUntil).getTime() - now) / 1000));
  useEffect(() => {
    if (seconds > 0 || refreshing.current) return;
    refreshing.current = true;
    api('/me')
      .then(onUser)
      .catch(() => {})
      .finally(() => {
        refreshing.current = false;
      });
  }, [seconds]);
  return (
    <div className="cooldown-panel">
      <Clock3 size={29} />
      <div>
        <h3>Uma pausa para recarregar.</h3>
        <p>
          Suas cinco vidas voltam em{' '}
          <strong>
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:
            {String(seconds % 60).padStart(2, '0')}
          </strong>
          . Enquanto isso, você pode rever as atividades concluídas.
        </p>
      </div>
    </div>
  );
}

function CodeEditor({ value, onChange, disabled, language, onSubmit }) {
  const area = useRef(null);
  function keyDown(event) {
    if (event.key === 'Tab') {
      event.preventDefault();
      const { selectionStart, selectionEnd } = event.target;
      onChange(value.slice(0, selectionStart) + '  ' + value.slice(selectionEnd));
      requestAnimationFrame(() => {
        if (area.current)
          area.current.selectionStart = area.current.selectionEnd = selectionStart + 2;
      });
    }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      onSubmit();
    }
  }
  return (
    <div className="editor">
      <div className="editor-header">
        <span>
          <Code2 size={16} /> sua-solucao.
          {language === 'python' ? 'py' : language === 'java' ? 'java' : 'js'}
        </span>
        <span>{LANGUAGES[language].name}</span>
      </div>
      <textarea
        ref={area}
        aria-label="Editor da sua solução"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={keyDown}
        maxLength={2000}
        rows={6}
        autoCapitalize="off"
        autoComplete="off"
        spellCheck="false"
        disabled={disabled}
      />
      <div className="editor-footer">
        <span>Tab insere espaços · Ctrl + Enter verifica</span>
        <span>{value.length} / 2000</span>
      </div>
    </div>
  );
}

function Exercise({ user, exercise, mission, onUser, onNext, final, lessonComplete }) {
  const [answer, setAnswer] = useState(exercise.type === 'choice' ? null : exercise.starter || '');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [showExample, setShowExample] = useState(false);
  const attempt = useRef(null);
  const feedbackRef = useRef(null);
  const solved = user.progress[user.language].includes(exercise.id);
  const hasAnswer = exercise.type === 'choice' ? answer !== null : answer.trim().length > 0;
  const blocked = user.lives === 0 && !solved;
  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);
  async function submit(event) {
    event?.preventDefault();
    if (busy || !hasAnswer || feedback || blocked) return;
    setError('');
    setBusy(true);
    const fingerprint = JSON.stringify([user.language, exercise.id, answer]);
    if (attempt.current?.fingerprint !== fingerprint)
      attempt.current = { fingerprint, id: requestId() };
    try {
      const result = await api('/attempts', {
        method: 'POST',
        body: {
          language: user.language,
          exerciseId: exercise.id,
          answer,
          requestId: attempt.current.id,
        },
      });
      setFeedback(result);
      onUser(result.user);
      attempt.current = null;
    } catch (error) {
      setError(error.message);
      if (error.code === 'LIVES_EMPTY') {
        try {
          onUser(await api('/me'));
        } catch {}
      }
    } finally {
      setBusy(false);
    }
  }
  const optionsDisabled = busy || Boolean(feedback);
  return (
    <section className="exercise-panel panel">
      <div className="exercise-meta">
        <span className="eyebrow">
          MISSÃO {mission.id.slice(1)} · {mission.title.toUpperCase()}
        </span>
        <span>{exercise.id.slice(-1)} de 3</span>
      </div>
      <ProgressBar value={(Number(exercise.id.slice(-1)) / 3) * 100} label="Etapa da missão" />
      {solved && !feedback && (
        <span className="review-badge">
          <RotateCcw size={14} /> REVISÃO · XP JÁ CONQUISTADO
        </span>
      )}
      <details className="lesson">
        <summary>
          <BookIcon /> Conheça o conceito da missão
        </summary>
        <p>{mission.lesson}</p>
        <pre className="code-block">
          <code>{mission.example}</code>
        </pre>
        {user.language === 'java' && (
          <p className="small muted">
            Escreva só as instruções do desafio. O laboratório do Mundo 1 representa o corpo do
            método main.
          </p>
        )}
      </details>
      <div className="tip">
        <Lightbulb size={24} />
        <div>
          <strong>Uma dica para começar</strong>
          <p>{exercise.hint}</p>
        </div>
      </div>
      <h2 className="exercise-question">{exercise.question}</h2>
      {exercise.code && (
        <pre className="code-block">
          <code>{exercise.code}</code>
        </pre>
      )}
      <form onSubmit={submit}>
        {exercise.type === 'choice' ? (
          <fieldset className="answer-grid">
            <legend className="sr-only">Escolha uma alternativa</legend>
            {exercise.options.map((option, index) => (
              <label
                key={option}
                className={`answer-option ${answer === index ? 'selected' : ''} ${feedback && answer === index ? (feedback.correct ? 'answer-correct' : 'answer-wrong') : ''}`}
              >
                <input
                  type="radio"
                  name="answer"
                  value={index}
                  checked={answer === index}
                  disabled={optionsDisabled}
                  onChange={() => setAnswer(index)}
                />
                <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                <span>{option}</span>
                {answer === index && <Check size={18} />}
              </label>
            ))}
          </fieldset>
        ) : exercise.type === 'text' ? (
          <label className="field text-answer">
            <span>Sua resposta</span>
            <input
              name="answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              maxLength={2000}
              placeholder={exercise.placeholder}
              autoComplete="off"
              disabled={optionsDisabled}
              required
            />
          </label>
        ) : (
          <>
            <CodeEditor
              value={answer}
              onChange={setAnswer}
              disabled={optionsDisabled}
              language={user.language}
              onSubmit={submit}
            />
            <div className="editor-help">
              <button
                type="button"
                className="text-button small"
                onClick={() => setShowExample(!showExample)}
              >
                {showExample ? 'Ocultar exemplo' : 'Preciso de um exemplo'}
              </button>
              <span className="small muted">Laboratório de variáveis e tipos</span>
            </div>
            {showExample && (
              <pre className="code-block">
                <code>{exercise.sample}</code>
              </pre>
            )}
          </>
        )}
        {error && <Notice>{error}</Notice>}
        {feedback && (
          <div
            ref={feedbackRef}
            tabIndex={-1}
            className={`feedback ${feedback.correct ? 'success' : 'try-again'}`}
            role="status"
          >
            <div className="feedback-title">
              {feedback.correct ? <CheckCheck size={26} /> : <Lightbulb size={26} />}
              <strong>
                {feedback.correct
                  ? feedback.practice
                    ? 'Muito bem, conceito revisado!'
                    : 'Boa! Mais uma descoberta.'
                  : 'Vamos aprender com essa tentativa.'}
              </strong>
              {feedback.xpEarned > 0 && <span>+{feedback.xpEarned} XP</span>}
            </div>
            <p>{feedback.explanation}</p>
            {feedback.checks?.length > 0 && (
              <ul className="test-checks">
                {feedback.checks.map((check) => (
                  <li className={check.passed ? 'passed' : ''} key={check.label}>
                    {check.passed ? <Check size={15} /> : <X size={15} />}
                    {check.label}
                  </li>
                ))}
              </ul>
            )}
            {feedback.output?.length > 0 && (
              <div className="program-output">
                <span>SAÍDA</span>
                <pre>{feedback.output.join('\n')}</pre>
              </div>
            )}
            {!feedback.correct && !feedback.practice && (
              <small>Uma vida foi usada. Leia a dica antes de tentar novamente.</small>
            )}
            {feedback.correct && lessonComplete && (
              <p className="mission-complete-note">
                <Flag size={16} /> Missão concluída!
              </p>
            )}
          </div>
        )}
        <div className="exercise-actions">
          {feedback ? (
            feedback.correct ? (
              <Button type="button" onClick={onNext}>
                {final
                  ? 'Ver minha conquista'
                  : lessonComplete
                    ? 'Próxima missão'
                    : 'Próxima atividade'}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={blocked}
                onClick={() => {
                  setFeedback(null);
                  setError('');
                  if (exercise.type === 'choice') setAnswer(null);
                }}
              >
                {blocked ? 'Aguardando suas vidas' : 'Tentar novamente'}
              </Button>
            )
          ) : (
            <Button busy={busy} type="submit" disabled={!hasAnswer || blocked}>
              {blocked
                ? 'Suas vidas estão recarregando'
                : exercise.type === 'code'
                  ? 'Verificar meu código'
                  : 'Verificar resposta'}
            </Button>
          )}
        </div>
      </form>
      <p className="small muted exercise-bottom">
        Cada acerto ensina. Cada tentativa é um passo na sua jornada.
      </p>
    </section>
  );
}

function BookIcon() {
  return <Code2 size={18} />;
}

export default function Journey({ user, onUser, exerciseId, navigate }) {
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setCourse(null);
    setError('');
    setCelebrating(false);
    api(`/course/${user.language}`, { signal: controller.signal })
      .then(setCourse)
      .catch((error) => {
        if (error.name !== 'AbortError') setError(error.message);
      });
    return () => controller.abort();
  }, [user.language, revision]);
  useEffect(() => {
    if (!course) return;
    const exercises = course.missions.flatMap((mission) => mission.exercises);
    const solved = user.progress[user.language];
    const index = exercises.findIndex((item) => item.id === exerciseId);
    const allowed =
      index >= 0 && exercises.slice(0, index).every((item) => solved.includes(item.id));
    if (allowed) return;
    const firstOpen = exercises.find((item) => !solved.includes(item.id));
    if (firstOpen) navigate(`jornada/${firstOpen.id}`);
  }, [course, exerciseId]);
  if (error)
    return (
      <>
        <Notice>{error}</Notice>
        <Button onClick={() => setRevision((value) => value + 1)}>Carregar novamente</Button>
      </>
    );
  if (!course)
    return (
      <div className="loading-section">
        <Robot />
        <p>Preparando as missões de {LANGUAGES[user.language].name}…</p>
      </div>
    );
  const completed = user.progress[user.language];
  const all = course.missions.flatMap((mission) => mission.exercises);
  const next = all.find((item) => !completed.includes(item.id));
  const requested = all.find((item) => item.id === exerciseId);
  const requestedIndex = requested ? all.indexOf(requested) : -1;
  const requestedUnlocked =
    requested && all.slice(0, requestedIndex).every((item) => completed.includes(item.id));
  const active = requestedUnlocked ? requested : next || all[0];
  const activeMission = course.missions.find((mission) =>
    mission.exercises.some((item) => item.id === active.id),
  );
  const done = completed.length === all.length;
  function nextExercise() {
    const index = all.indexOf(active);
    if (index === all.length - 1) {
      setCelebrating(true);
      navigate('jornada');
      return;
    }
    navigate(`jornada/${all[index + 1].id}`);
  }
  return (
    <>
      <div className="journey-heading">
        <div>
          <p className="eyebrow">
            <span className="tiny-dot" /> MUNDO 1 · {LANGUAGES[user.language].name.toUpperCase()}
          </p>
          <h1>
            Vale dos Dados <span className="badge">{done ? 'CONCLUÍDO' : 'EM JOGO'}</span>
          </h1>
          <p className="lead">Descubra como guardar e reconhecer informações.</p>
        </div>
        <div className="journey-mini-art">
          <HeroArt alt="" />
        </div>
      </div>
      {user.lives === 0 && <Cooldown user={user} onUser={onUser} />}
      {celebrating || (done && !exerciseId) ? (
        <section className="panel completion-screen">
          <span className="completion-trophy">
            <Trophy size={76} />
          </span>
          <p className="eyebrow">UMA NOVA CONQUISTA É SUA</p>
          <h2>Guardião dos Dados!</h2>
          <p>
            Você concluiu as cinco missões de {LANGUAGES[user.language].name} e conquistou{' '}
            <strong>300 XP</strong>.
          </p>
          <p className="muted">
            Variáveis, tipos, atribuições e operações agora fazem parte do seu inventário.
          </p>
          <div className="completion-actions">
            <Button onClick={() => navigate('perfil')}>Ver meu perfil</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setCelebrating(false);
                navigate('jornada/m1-e1');
              }}
            >
              Rever as missões
            </Button>
          </div>
          <p className="small muted">Os Mundos 2, 3 e 4 continuam em desenvolvimento.</p>
        </section>
      ) : (
        <div className="journey-layout">
          <aside className="mission-sidebar panel">
            <h2>Sua trilha</h2>
            <p className="small muted">{missionCount(completed)} de 5 missões concluídas</p>
            <div className="mission-list">
              {course.missions.map((mission, index) => {
                const finished = mission.exercises.every((item) => completed.includes(item.id));
                const unlocked =
                  index === 0 ||
                  course.missions[index - 1].exercises.every((item) => completed.includes(item.id));
                const selected = activeMission.id === mission.id;
                return (
                  <div
                    className={`mission-node ${selected ? 'active' : ''} ${finished ? 'finished' : ''}`}
                    key={mission.id}
                  >
                    <button
                      onClick={() =>
                        navigate(
                          `jornada/${(mission.exercises.find((item) => !completed.includes(item.id)) || mission.exercises[0]).id}`,
                        )
                      }
                      disabled={!unlocked}
                      aria-current={selected ? 'step' : undefined}
                    >
                      <span className="mission-dot">
                        {finished ? (
                          <Check size={19} />
                        ) : unlocked ? (
                          index + 1
                        ) : (
                          <LockKeyhole size={17} />
                        )}
                      </span>
                      <span>
                        {mission.title}
                        <small>
                          {mission.exercises.filter((item) => completed.includes(item.id)).length}{' '}
                          de 3 atividades
                        </small>
                      </span>
                    </button>
                    {selected && (
                      <div className="exercise-dots">
                        {mission.exercises.map((item, i) => {
                          const itemIndex = all.indexOf(item);
                          const available = all
                            .slice(0, itemIndex)
                            .every((previous) => completed.includes(previous.id));
                          return (
                            <button
                              key={item.id}
                              disabled={!available}
                              className={
                                item.id === active.id
                                  ? 'current'
                                  : completed.includes(item.id)
                                    ? 'done'
                                    : ''
                              }
                              onClick={() => navigate(`jornada/${item.id}`)}
                              aria-label={`Atividade ${i + 1}${completed.includes(item.id) ? ', concluída' : ''}`}
                            >
                              {completed.includes(item.id) ? <Check size={12} /> : i + 1}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mission-guide">
              <Robot small />
              <p>
                Leia, experimente e descubra.
                <br />
                <strong>Você consegue!</strong>
              </p>
            </div>
          </aside>
          <Exercise
            key={`${user.language}-${active.id}`}
            user={user}
            onUser={onUser}
            exercise={active}
            mission={activeMission}
            final={active === all[all.length - 1]}
            lessonComplete={active.id.endsWith('e3')}
            onNext={nextExercise}
          />
        </div>
      )}
    </>
  );
}
