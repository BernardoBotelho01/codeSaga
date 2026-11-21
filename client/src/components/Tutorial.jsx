import { useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  Clock3,
  Flag,
  Heart,
  Lightbulb,
  ShieldCheck,
  Star,
  Trophy,
} from 'lucide-react';
import { LANGUAGES, TUTORIAL_LABELS, WORLDS } from '../data';
import { Brand, HeroArt, LanguageMark, Robot, WorldArt } from './Art';
import { Button, Lives, Notice, ProgressBar } from './Common';

export default function Tutorial({ language, onFinish, returning = false }) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lang = LANGUAGES[language];
  const stringType = { python: 'str', java: 'String', javascript: 'string' }[language];
  const example = {
    python: 'nome = "Luna"',
    java: 'String nome = "Luna";',
    javascript: 'const nome = "Luna";',
  }[language];
  async function finish() {
    setBusy(true);
    setError('');
    try {
      await onFinish();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  const headings = [
    ['Bem-vindo ao CodeSaga!', 'Antes da primeira missão, conheça sua aventura.'],
    [
      'Sua linguagem, seu jeito de aprender.',
      'Os conceitos são os mesmos. A forma de escrever muda.',
    ],
    ['Um mundo de cada vez.', 'Comece no Vale dos Dados e acompanhe o que vem depois.'],
    ['Entenda como resolver um desafio.', 'Leia a dica, responda e aprenda com o resultado.'],
    ['Cada descoberta conta.', 'Entenda como sua pontuação aparece no ranking.'],
    ['Uma pausa também faz parte.', 'Suas vidas ajudam a dar ritmo à aventura.'],
    ['Seu progresso tem um lugar.', 'Tudo o que você conclui fica guardado no seu perfil.'],
  ];
  return (
    <div className="tutorial-page">
      <header className="welcome-header">
        <Brand />
        <span className="badge outline">{returning ? 'COMO JOGAR' : 'PRIMEIRO ACESSO'}</span>
        <button className="text-button" onClick={finish} disabled={busy}>
          {returning ? 'Fechar tutorial' : 'Pular tutorial'}
        </button>
      </header>
      <main className="tutorial-main">
        <div className="page-intro center">
          <h1>{headings[step][0]}</h1>
          <p className="lead">{headings[step][1]}</p>
        </div>
        {error && <Notice>{error}</Notice>}
        {step === 0 && (
          <section className="tutorial-hero panel">
            <HeroArt />
            <div>
              <p className="eyebrow">APRENDA, PRATIQUE E CONQUISTE</p>
              <h2>
                Programar começa
                <br />
                com uma descoberta.
              </h2>
              <p>
                Você resolve missões curtas, conhece um conceito e coloca em prática. Nosso guia
                explica cada tentativa para você continuar aprendendo.
              </p>
              <ul className="feature-list">
                <li>
                  <BookOpen /> Escolha Python, Java ou JavaScript.
                </li>
                <li>
                  <Flag /> Comece pelo Vale dos Dados.
                </li>
                <li>
                  <Star /> Ganhe XP e acompanhe sua evolução.
                </li>
              </ul>
            </div>
          </section>
        )}
        {step === 1 && (
          <section className="tutorial-section">
            <div className="tutorial-language-grid">
              {Object.entries(LANGUAGES).map(([id, item]) => (
                <article
                  key={id}
                  className={`panel tutorial-language ${id === language ? 'active-panel' : ''}`}
                >
                  <LanguageMark language={id} />
                  <h2>{item.name}</h2>
                  <p>{item.subtitle}</p>
                  <code>{item.sample}</code>
                  {id === language && <span className="badge">SUA LINGUAGEM ATUAL</span>}
                </article>
              ))}
            </div>
            <div className="info-strip">
              <Lightbulb />{' '}
              <p>
                Os acertos de cada linguagem ficam salvos em sua própria trilha. Você pode trocar no
                perfil e continuar de onde parou em cada uma.
              </p>
            </div>
          </section>
        )}
        {step === 2 && (
          <section className="tutorial-section">
            <div className="tutorial-world-grid">
              {WORLDS.map((world, index) => (
                <article key={world.name} className="panel">
                  <WorldArt {...world} kind={world.icon} locked={index > 0} />
                  <p className="eyebrow">MUNDO {index + 1}</p>
                  <h3>{world.name}</h3>
                  <p className="muted">{world.subject}</p>
                  <span className={`badge ${index ? 'muted-badge' : ''}`}>
                    {index ? 'EM BREVE' : 'DISPONÍVEL'}
                  </span>
                </article>
              ))}
            </div>
            <div className="info-strip">
              <Flag />
              <p>
                O Mundo 1 tem cinco missões, com três atividades em cada uma. Conclua as atividades
                na ordem para abrir a próxima missão.
              </p>
            </div>
          </section>
        )}
        {step === 3 && (
          <section className="tutorial-practice">
            <div className="panel tutorial-instructions">
              <p className="eyebrow">PASSO A PASSO</p>
              {[
                'Leia a dica.',
                'Observe o código.',
                'Escolha ou digite sua resposta.',
                'Confira a explicação.',
              ].map((text, index) => (
                <p className="instruction" key={text}>
                  <b>{index + 1}</b>
                  {text}
                </p>
              ))}
              <Robot />
              <p className="small muted">
                Este treino é livre. Sua pontuação e suas vidas são preservadas.
              </p>
            </div>
            <div className="panel practice-exercise">
              <div className="exercise-meta">
                <span className="eyebrow">EXEMPLO DO TUTORIAL</span>
                <span className="badge outline">{lang.name}</span>
              </div>
              <div className="tip">
                <Lightbulb />
                <p>Textos ficam entre aspas.</p>
              </div>
              <h2>Qual é o tipo de “Luna”?</h2>
              <pre className="code-block">
                <code>{example}</code>
              </pre>
              <div className="answer-grid">
                {[`${stringType} · texto`, 'número', 'valor lógico', 'nenhum tipo'].map(
                  (text, index) => (
                    <label
                      className={`answer-option ${answer === index ? 'selected' : ''}`}
                      key={text}
                    >
                      <input
                        type="radio"
                        name="tutorial-answer"
                        checked={answer === index}
                        onChange={() => {
                          setAnswer(index);
                          setChecked(false);
                        }}
                      />
                      <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                      {text}
                    </label>
                  ),
                )}
              </div>
              {checked && (
                <Notice tone={answer === 0 ? 'success' : 'info'}>
                  {answer === 0
                    ? `Isso mesmo! “Luna” é um texto do tipo ${stringType}.`
                    : 'Observe as aspas. Elas indicam que o valor é um texto. Tente outra vez.'}
                </Notice>
              )}
              <Button disabled={answer === null} onClick={() => setChecked(true)}>
                Testar resposta
              </Button>
            </div>
          </section>
        )}
        {step === 4 && (
          <section className="panel tutorial-points">
            <div className="giant-icon">
              <Trophy size={70} />
            </div>
            <div>
              <p className="eyebrow">APRENDER TEM RECOMPENSA</p>
              <h2>Um acerto, 20 XP.</h2>
              <p>
                Cada atividade concluída pela primeira vez vale 20 pontos de experiência. São 60 XP
                por missão e 300 XP por trilha do Mundo 1.
              </p>
              <div className="point-stats">
                <span>
                  <b>20 XP</b> por atividade
                </span>
                <span>
                  <b>300 XP</b> por linguagem
                </span>
              </div>
              <p>
                O ranking compara o XP total das contas confirmadas. Em caso de empate, os jogadores
                compartilham a mesma posição. Você pode rever as atividades concluídas para
                praticar.
              </p>
              <p className="small muted">
                A revisão mantém sua pontuação. Cada atividade concede XP uma vez por linguagem.
              </p>
            </div>
          </section>
        )}
        {step === 5 && (
          <section className="panel tutorial-lives">
            <div>
              <p className="eyebrow">SUAS VIDAS NA AVENTURA</p>
              <h2>Você começa com cinco vidas.</h2>
              <Lives lives={5} />
              <p>
                Cada resposta incorreta em uma atividade nova consome uma vida. A explicação ajuda
                você a entender o erro e tentar de novo.
              </p>
              <div className="info-strip">
                <Clock3 />
                <p>
                  Quando as cinco vidas acabam, as novas atividades ficam pausadas por uma hora.
                  Depois disso, as cinco vidas são recuperadas.
                </p>
              </div>
              <p className="small muted">
                Atividades já concluídas podem ser revistas sem consumir vidas.
              </p>
            </div>
            <div className="life-illustration">
              <Heart size={100} fill="currentColor" />
              <span>5 VIDAS</span>
              <Clock3 size={36} />
              <strong>Pausa de 1 hora</strong>
            </div>
          </section>
        )}
        {step === 6 && (
          <section className="panel tutorial-profile">
            <Robot />
            <div>
              <p className="eyebrow">PRONTO PARA COMEÇAR?</p>
              <h2>Seu perfil acompanha a aventura.</h2>
              <ul className="feature-list">
                <li>
                  <Star /> Confira seu XP total.
                </li>
                <li>
                  <Trophy /> Veja sua posição no ranking.
                </li>
                <li>
                  <Award /> Acompanhe missões e conquistas.
                </li>
                <li>
                  <ShieldCheck /> Retome seu progresso em outro dispositivo entrando na mesma conta.
                </li>
                <li>
                  <BookOpen /> Troque de linguagem e continue sua trilha.
                </li>
              </ul>
              <p className="muted">Você também encontra este tutorial no menu Como jogar.</p>
            </div>
          </section>
        )}
        <nav className="tutorial-steps" aria-label="Etapas do tutorial">
          {TUTORIAL_LABELS.map((label, index) => (
            <button
              key={label}
              className={index === step ? 'current' : index < step ? 'finished' : ''}
              onClick={() => setStep(index)}
              aria-current={index === step ? 'step' : undefined}
            >
              <span>{index < step ? <Check size={15} /> : index + 1}</span>
              <b>{label}</b>
            </button>
          ))}
        </nav>
        <footer className="tutorial-footer">
          <span>Etapa {step + 1} de 7</span>
          <div>
            <Button
              variant="secondary"
              disabled={step === 0 || busy}
              onClick={() => setStep(step - 1)}
            >
              Voltar
            </Button>
            {step < 6 ? (
              <Button onClick={() => setStep(step + 1)}>
                {step === 0 ? 'Conhecer o jogo' : 'Próxima explicação'}
              </Button>
            ) : (
              <Button onClick={finish} busy={busy}>
                {returning ? 'Voltar ao jogo' : 'Começar aventura'}
              </Button>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}
