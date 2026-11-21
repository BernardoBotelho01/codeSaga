import { useEffect, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  Flag,
  Globe2,
  Layers,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  X,
} from 'lucide-react';
import { api } from '../api';
import { avatarColors, LANGUAGES, missionCount, WORLDS } from '../data';
import { Achievement, EmptyState, HeroArt, LanguageMark, Robot, WorldArt } from './Art';
import { Button, Notice, ProgressBar } from './Common';

export function MapPage({ user, navigate }) {
  const completed = user.progress[user.language];
  const missions = missionCount(completed);
  const percent = Math.round((completed.length / 15) * 100);
  return (
    <>
      <section className="map-hero">
        <div>
          <p className="eyebrow">
            <Sparkles size={16} /> A CADA DESCOBERTA, UM NOVO PASSO
          </p>
          <h1>{completed.length ? 'Sua aventura continua aqui.' : 'Sua aventura começa aqui.'}</h1>
          <p className="lead">Aprenda programação, uma missão de cada vez.</p>
          <Button onClick={() => navigate('jornada')}>
            {completed.length === 15
              ? 'Rever o Mundo 1'
              : completed.length
                ? 'Continuar aventura'
                : 'Começar aventura'}
          </Button>
          <div className="hero-language">
            <LanguageMark language={user.language} small />
            <span>
              Explorando com <b>{LANGUAGES[user.language].name}</b>
            </span>
          </div>
        </div>
        <HeroArt />
      </section>
      <section className="world-section" aria-labelledby="world-heading">
        <div className="section-heading">
          <div>
            <h2 id="world-heading">Explore os mundos</h2>
            <p className="muted">Uma trilha de descobertas na programação.</p>
          </div>
          <span className="world-counter">{missions === 5 ? 1 : 0} de 4 mundos concluídos</span>
        </div>
        <div className="world-grid">
          {WORLDS.map((world, index) => (
            <article
              className={`world-card ${index === 0 ? 'available' : 'coming-soon'}`}
              key={world.name}
            >
              <WorldArt kind={world.icon} color={world.color} locked={index > 0} />
              <div className="world-card-content">
                <p className="eyebrow">MUNDO {index + 1}</p>
                <h3>{world.name}</h3>
                <p className="muted">{world.subject}</p>
                {index === 0 ? (
                  <>
                    <div className="world-mission-count">
                      <Flag size={16} /> {missions} de 5 missões
                    </div>
                    <ProgressBar value={percent} label="Progresso no Vale dos Dados" />
                    <Button onClick={() => navigate('jornada')}>
                      {completed.length === 15
                        ? 'Mundo concluído'
                        : completed.length
                          ? 'Continuar'
                          : 'Explorar mundo'}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="world-future">Sua próxima descoberta está sendo preparada.</p>
                    <span className="locked-label">
                      <LockKeyhole size={16} /> Em breve
                    </span>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="objective-strip">
        <span className="objective-icon">
          {missions === 5 ? <Trophy size={29} /> : <Flag size={29} />}
        </span>
        <div>
          <h3>{missions === 5 ? 'Você é um Guardião dos Dados!' : 'Seu primeiro objetivo'}</h3>
          <p>
            {missions === 5
              ? 'Revise sua trilha ou experimente o Mundo 1 em outra linguagem pelo perfil.'
              : 'Conclua o Vale dos Dados e domine variáveis e tipos.'}
          </p>
        </div>
        <span className="badge outline">ATÉ 300 XP</span>
      </section>
    </>
  );
}

function PlayerRows({ players, user, compact = false }) {
  return (
    <div className={`player-list ${compact ? 'compact' : ''}`}>
      {players.map((player) => (
        <div className={`player-row ${player.id === user.id ? 'you' : ''}`} key={player.id}>
          <span className={`player-place place-${player.rank}`}>
            {player.rank <= 3 ? <Trophy size={21} /> : null}
            <b>{player.rank}º</b>
          </span>
          <span className={`player-avatar ${player.avatar}`}>
            {player.name.charAt(0).toUpperCase()}
          </span>
          <strong>
            {player.name}
            {player.id === user.id && <small>Você</small>}
          </strong>
          <span className="player-xp">{player.xp} XP</span>
        </div>
      ))}
    </div>
  );
}

function useRanking(user) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    api('/ranking', { signal: controller.signal })
      .then(setData)
      .catch((error) => {
        if (error.name !== 'AbortError') setError(error.message);
      });
    return () => controller.abort();
  }, [user.xp, revision]);
  return { data, error, reload: () => setRevision((value) => value + 1) };
}

export function Ranking({ user }) {
  const { data, error, reload } = useRanking(user);
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">
          <Trophy size={16} /> CADA DESCOBERTA CONTA
        </p>
        <h1>Uma conquista de cada vez.</h1>
        <p className="lead">Veja como sua pontuação se conecta à dos outros exploradores.</p>
      </div>
      <div className="ranking-summary panel">
        <Trophy size={42} />
        <div>
          <span>SUA POSIÇÃO</span>
          <strong>{data?.me?.rank || user.rank}º lugar</strong>
        </div>
        <div>
          <span>SUA PONTUAÇÃO</span>
          <strong>{user.xp} XP</strong>
        </div>
        <div className="ranking-motto">
          O melhor próximo passo
          <br />é continuar aprendendo.
        </div>
      </div>
      <section className="panel ranking-panel">
        <div className="section-heading">
          <div>
            <h2>Ranking geral</h2>
            <p className="muted">XP total das três linguagens.</p>
          </div>
          <Button variant="secondary" onClick={reload}>
            Atualizar
          </Button>
        </div>
        {error ? (
          <Notice>{error}</Notice>
        ) : !data ? (
          <p className="muted">Carregando exploradores…</p>
        ) : (
          <PlayerRows players={data.players} user={user} />
        )}
        <p className="small muted ranking-note">
          Contas com e-mail confirmado participam do ranking. Empates em XP compartilham a posição.
          São exibidas até 50 contas.
        </p>
      </section>
    </>
  );
}

function EditProfile({ user, onClose, onSaved }) {
  const dialog = useRef(null);
  const [avatar, setAvatar] = useState(user.avatar);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      onSaved(
        await api('/me', {
          method: 'PATCH',
          body: { name: new FormData(event.currentTarget).get('name'), avatar },
        }),
      );
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <dialog
      className="profile-dialog"
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="edit-profile-title"
    >
      <div className="dialog-title">
        <h2 id="edit-profile-title">Seu jeito de explorar</h2>
        <button className="icon-button" onClick={onClose} aria-label="Fechar edição">
          <X />
        </button>
      </div>
      <form onSubmit={submit}>
        {error && <Notice>{error}</Notice>}
        <div className="edit-avatar">
          <Robot color={avatar} />
        </div>
        <fieldset className="avatar-options">
          <legend>Cor do avatar</legend>
          {Object.entries(avatarColors).map(([id, color]) => (
            <label
              style={{ '--avatar-color': color }}
              className={avatar === id ? 'chosen' : ''}
              key={id}
            >
              <input
                type="radio"
                name="avatar"
                aria-label={
                  { turquoise: 'Turquesa', lime: 'Verde', purple: 'Roxo', orange: 'Laranja' }[id]
                }
                checked={avatar === id}
                onChange={() => setAvatar(id)}
              />
              {avatar === id && <Check size={16} />}
            </label>
          ))}
        </fieldset>
        <label className="field">
          <span>Nome de jogador</span>
          <input
            name="name"
            defaultValue={user.name}
            minLength={2}
            maxLength={40}
            autoComplete="nickname"
            required
          />
        </label>
        <label className="field">
          <span>E-mail confirmado</span>
          <input type="email" value={user.email} readOnly />
        </label>
        <Button type="submit" busy={busy} className="full-width">
          Salvar perfil
        </Button>
      </form>
    </dialog>
  );
}

export function Profile({ user, onUser, onLanguage, navigate }) {
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState([]);
  const { data } = useRanking(user);
  const completed = user.progress[user.language];
  const missions = missionCount(completed);
  useEffect(() => {
    api('/me/history')
      .then(setHistory)
      .catch(() => {});
  }, [user.xp, user.attempts]);
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">MEU PERFIL</p>
        <h1>Sua evolução tem uma história.</h1>
      </div>
      <section className="panel profile-hero">
        <div className="profile-avatar">
          <Robot color={user.avatar} />
        </div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <span className="verified">
            <ShieldCheck size={17} /> E-mail confirmado
          </span>
          <p>
            {missions === 5
              ? 'Guardião dos Dados'
              : completed.length
                ? 'Explorador de dados'
                : 'Uma nova aventura está começando'}
          </p>
          <div className="profile-language">
            <LanguageMark language={user.language} small />
            <span>
              Linguagem atual · <b>{LANGUAGES[user.language].name}</b>
            </span>
            <button className="text-button" onClick={onLanguage}>
              Trocar linguagem
            </button>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Editar perfil
        </Button>
      </section>
      <section className="panel profile-security">
        <ShieldCheck size={29} />
        <div>
          <h3>Senha da conta</h3>
          <p>Confirme a alteração com um código enviado ao seu e-mail.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('alterar-senha')}>
          Alterar senha
        </Button>
      </section>
      <div className="stats-grid">
        <article className="panel stat-card">
          <Star size={37} />
          <div>
            <span>Pontuação total</span>
            <strong>{user.xp} XP</strong>
          </div>
        </article>
        <article className="panel stat-card">
          <Trophy size={37} />
          <div>
            <span>Posição no ranking</span>
            <strong>{user.rank}º lugar</strong>
          </div>
        </article>
        <article className="panel stat-card">
          <Flag size={37} />
          <div>
            <span>Missões nesta linguagem</span>
            <strong>{missions} de 5</strong>
          </div>
        </article>
      </div>
      <div className="profile-columns">
        <section className="panel profile-progress">
          <p className="eyebrow">SUA TRILHA EM {LANGUAGES[user.language].name.toUpperCase()}</p>
          <h2>Vale dos Dados</h2>
          <div className="progress-with-number">
            <ProgressBar
              value={Math.round((completed.length / 15) * 100)}
              label="Progresso nesta linguagem"
            />
            <strong>{Math.round((completed.length / 15) * 100)}%</strong>
          </div>
          <p className="muted">{completed.length} de 15 atividades concluídas</p>
          <Button onClick={() => navigate('jornada')}>
            {missions === 5 ? 'Rever missões' : 'Continuar aventura'}
          </Button>
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Ranking geral</h2>
            <button className="text-button" onClick={() => navigate('ranking')}>
              Ver todos
            </button>
          </div>
          {data ? (
            <PlayerRows players={data.players.slice(0, 3)} user={user} compact />
          ) : (
            <p className="muted">Carregando ranking…</p>
          )}
        </section>
      </div>
      <section className="panel achievements-panel">
        <h2>
          <Award size={24} /> Conquistas nesta linguagem
        </h2>
        <div className="achievements">
          <Achievement unlocked={completed.length >= 1} title="Primeiro passo" icon={Flag} />
          <Achievement
            unlocked={missionCount(completed) >= 2}
            title="Tipos dominados"
            icon={Layers}
          />
          <Achievement unlocked={missions === 5} title="Guardião dos dados" icon={Trophy} />
        </div>
      </section>
      <section className="panel language-progress-panel">
        <h2>Suas três trilhas</h2>
        <div className="all-language-progress">
          {Object.entries(LANGUAGES).map(([id, language]) => (
            <div key={id}>
              <LanguageMark language={id} small />
              <strong>{language.name}</strong>
              <span>{user.progress[id].length * 20} / 300 XP</span>
              <ProgressBar
                value={(user.progress[id].length / 15) * 100}
                label={`Progresso em ${language.name}`}
              />
            </div>
          ))}
        </div>
      </section>
      {history.length > 0 && (
        <section className="panel history-panel">
          <h2>Últimas tentativas</h2>
          <ul>
            {history.slice(0, 5).map((item, index) => (
              <li key={`${item.created_at}-${index}`}>
                <span className={`history-result ${item.correct ? 'correct' : ''}`}>
                  {item.correct ? <Check size={17} /> : <BookOpen size={17} />}
                </span>
                <span>
                  <strong>
                    Missão {item.exercise_id[1]} · Atividade {item.exercise_id[4]}
                  </strong>
                  <small>
                    {LANGUAGES[item.language].name} ·{' '}
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                  </small>
                </span>
                <span>{item.correct ? 'Acerto' : 'Aprendizado'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {editing && <EditProfile user={user} onClose={() => setEditing(false)} onSaved={onUser} />}
    </>
  );
}

export function About() {
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">SOBRE O PROJETO</p>
        <h1>Além de aprender. Descobrir.</h1>
        <p className="lead">Um RPG educacional para os primeiros passos na programação.</p>
      </div>
      <section className="panel about-hero">
        <HeroArt />
        <div>
          <h2>Conhecimento vira aventura.</h2>
          <p>
            O CodeSaga aproxima a lógica de programação de situações concretas. Você aprende em
            missões curtas, pratica com quizzes e código e recebe uma explicação a cada tentativa.
          </p>
          <p>
            O Vale dos Dados é o primeiro mundo. A Cidade das Escolhas, as Rotas em Ciclo e o Campus
            dos Objetos fazem parte da expansão planejada.
          </p>
          <span className="badge outline">MVP · MUNDO 1</span>
        </div>
      </section>
      <section className="panel team-panel">
        <h2>Quem está nessa jornada</h2>
        <div className="team-grid">
          {['Wilson Cabral', 'Bernardo Botelho', 'Lucas Reis', 'Marlon Gabriel'].map((name) => (
            <div key={name}>
              <span>
                {name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
              </span>
              <strong>{name}</strong>
            </div>
          ))}
        </div>
        <div className="project-info">
          <p>Engenharia de Software</p>
          <p>Tópico de Engenharia de Software I</p>
          <p>Professora Dianne Dias Silva</p>
        </div>
      </section>
      <section className="panel about-principles">
        <h2>Aprender com propósito</h2>
        <div>
          <article>
            <BookOpen />
            <h3>Fundamentos primeiro</h3>
            <p>Variáveis, tipos e atribuições antes de avançar para novos conceitos.</p>
          </article>
          <article>
            <Globe2 />
            <h3>Uma conta, sua jornada</h3>
            <p>Seu progresso é salvo para continuar aprendendo em qualquer dispositivo.</p>
          </article>
          <article>
            <Sparkles />
            <h3>Seu ritmo importa</h3>
            <p>Reveja missões, leia as explicações e volte ao tutorial quando precisar.</p>
          </article>
        </div>
      </section>
    </>
  );
}
