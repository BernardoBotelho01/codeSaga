import { useEffect, useRef, useState } from 'react';
import { BookOpen, CircleHelp, Info, LogOut, Map, Menu, Trophy, UserRound, X } from 'lucide-react';
import { api, clearSession, hasSession, saveSession } from './api';
import { LANGUAGES } from './data';
import { Brand, Robot } from './components/Art';
import { Button, Lives, Notice, Xp } from './components/Common';
import {
  ChangePassword,
  LanguageSelection,
  Login,
  Recovery,
  Register,
  Verify,
} from './components/Auth';
import Tutorial from './components/Tutorial';
import { About, MapPage, Profile, Ranking } from './components/Dashboard';
import Journey from './components/Journey';

function useRoute() {
  const [route, setRoute] = useState(() => location.hash.slice(1) || 'linguagens');
  useEffect(() => {
    const update = () => setRoute(location.hash.slice(1) || 'linguagens');
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const navigate = (value) => {
    location.hash = value;
  };
  return [route, navigate];
}

const links = [
  ['mapa', 'Mapa de mundos', Map],
  ['jornada', 'Minha jornada', BookOpen],
  ['ranking', 'Ranking', Trophy],
  ['perfil', 'Meu perfil', UserRound],
  ['tutorial', 'Como jogar', CircleHelp],
  ['sobre', 'Sobre o projeto', Info],
];

export default function App() {
  const [route, navigate] = useRoute();
  const view = route.split('/')[0];
  const [language, setLanguage] = useState('python');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasSession());
  const [sessionError, setSessionError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [delivery, setDelivery] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const main = useRef(null);

  async function restore() {
    if (!hasSession()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setSessionError('');
    try {
      const current = await api('/me');
      setUser(current);
      setLanguage(current.language);
      if (!current.tutorialCompleted) navigate('tutorial');
      else if (
        ![
          'mapa',
          'jornada',
          'ranking',
          'perfil',
          'alterar-senha',
          'tutorial',
          'sobre',
          'linguagens',
        ].includes(view)
      )
        navigate('mapa');
      else if (view === 'linguagens') navigate('mapa');
    } catch (error) {
      if (error.status === 401) {
        clearSession();
        setUser(null);
        navigate('login');
      } else setSessionError(error.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    restore();
    api('/config')
      .then((data) => setDelivery(data.mailMode))
      .catch(() => {});
  }, []);
  useEffect(() => {
    setMenuOpen(false);
    setGlobalError('');
    main.current?.focus();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route]);
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      api('/me')
        .then((profile) => setUser((current) => (current?.id === profile.id ? profile : current)))
        .catch((error) => {
          if (error.status === 401) {
            clearSession();
            setUser(null);
            setLoginMessage('Sua sessão expirou. Entre novamente.');
            navigate('login');
          }
        });
    }, 30000);
    return () => clearInterval(timer);
  }, [user?.id]);

  function signedIn(result, remember) {
    saveSession(result.token, remember);
    setUser(result.user);
    setLanguage(result.user.language);
    setLoginMessage('');
    navigate(result.user.tutorialCompleted ? 'mapa' : 'tutorial');
  }
  function passwordChanged() {
    clearSession();
    setUser(null);
    setLoginMessage('Senha atualizada. Entre novamente com sua nova senha.');
    navigate('login');
  }
  async function finishTutorial() {
    setUser(await api('/me/tutorial', { method: 'POST', body: {} }));
    navigate('mapa');
  }
  async function switchLanguage() {
    if (!user) {
      navigate('cadastro');
      return;
    }
    try {
      setUser(await api('/me', { method: 'PATCH', body: { language } }));
      navigate('mapa');
    } catch (error) {
      setGlobalError(error.message);
    }
  }
  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST', body: {} });
      clearSession();
      setUser(null);
      navigate('login');
    } catch (error) {
      setGlobalError(error.message);
    }
  }

  if (loading)
    return (
      <div className="loading-page">
        <Robot />
        <h1>Preparando sua aventura…</h1>
      </div>
    );
  if (sessionError)
    return (
      <div className="loading-page">
        <Robot />
        <h1>Vamos reconectar?</h1>
        <Notice>{sessionError}</Notice>
        <Button onClick={restore}>Tentar novamente</Button>
      </div>
    );
  if (view === 'linguagens')
    return (
      <>
        {globalError && (
          <div className="global-notice">
            <Notice>{globalError}</Notice>
          </div>
        )}
        <LanguageSelection
          language={language}
          onChoose={setLanguage}
          onContinue={switchLanguage}
          onLogin={() => navigate('login')}
          loggedIn={Boolean(user)}
        />
      </>
    );
  if (!user) {
    const common = {
      language,
      onHome: () => navigate('linguagens'),
      onLanguage: () => navigate('linguagens'),
      onLogin: (message) => {
        setLoginMessage(message || '');
        navigate('login');
      },
    };
    if (view === 'cadastro')
      return (
        <Register
          {...common}
          onRegistered={(result) => {
            setPendingEmail(result.email);
            setDelivery(result.delivery);
            navigate('verificar');
          }}
        />
      );
    if (view === 'verificar')
      return (
        <Verify {...common} initialEmail={pendingEmail} delivery={delivery} onSignedIn={signedIn} />
      );
    if (view === 'recuperar') return <Recovery {...common} />;
    return (
      <Login
        {...common}
        initialMessage={loginMessage}
        onRegister={() => navigate('cadastro')}
        onForgot={() => navigate('recuperar')}
        onVerify={(email) => {
          setPendingEmail(email);
          navigate('verificar');
        }}
        onSignedIn={signedIn}
      />
    );
  }
  if (view === 'tutorial')
    return (
      <Tutorial
        language={user.language}
        returning={user.tutorialCompleted}
        onFinish={finishTutorial}
      />
    );

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Pular para o conteúdo
      </a>
      {menuOpen && (
        <button
          className="menu-scrim"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <Brand onClick={() => navigate('mapa')} />
        <button
          className="mobile-close icon-button"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        >
          <X />
        </button>
        <nav aria-label="Menu principal">
          {links.map(([id, label, Icon]) => (
            <a
              href={`#${id}`}
              className={
                view === id || (id === 'perfil' && view === 'alterar-senha') ? 'active' : ''
              }
              key={id}
              aria-current={
                view === id || (id === 'perfil' && view === 'alterar-senha') ? 'page' : undefined
              }
            >
              <Icon size={21} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-guide">
          <Robot small />
          <strong>
            Aprenda no
            <br />
            seu ritmo.
          </strong>
          <span>Uma missão de cada vez.</span>
        </div>
        <button className="logout" onClick={logout}>
          <LogOut size={19} /> Sair da conta
        </button>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </button>
            <p>
              {view === 'jornada'
                ? 'MUNDO 1 / VALE DOS DADOS'
                : view === 'alterar-senha'
                  ? 'ALTERAR SENHA'
                  : links.find((link) => link[0] === view)?.[1] || 'SUA AVENTURA'}
            </p>
          </div>
          <div className="topbar-stats">
            <span className="topbar-language">
              <LanguageMarkInline language={user.language} />
            </span>
            <Xp value={user.xp} />
            <Lives lives={user.lives} />
            <button
              className={`avatar-button ${user.avatar}`}
              aria-label="Abrir meu perfil"
              onClick={() => navigate('perfil')}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content" ref={main} tabIndex={-1}>
          {globalError && <Notice>{globalError}</Notice>}
          {view === 'jornada' ? (
            <Journey
              user={user}
              onUser={setUser}
              exerciseId={route.split('/')[1]}
              navigate={navigate}
            />
          ) : view === 'perfil' ? (
            <Profile
              user={user}
              onUser={setUser}
              onLanguage={() => {
                setLanguage(user.language);
                navigate('linguagens');
              }}
              navigate={navigate}
            />
          ) : view === 'alterar-senha' ? (
            <ChangePassword
              user={user}
              onComplete={passwordChanged}
              onBack={() => navigate('perfil')}
            />
          ) : view === 'ranking' ? (
            <Ranking user={user} />
          ) : view === 'sobre' ? (
            <About />
          ) : (
            <MapPage user={user} navigate={navigate} />
          )}
        </main>
        <footer className="app-footer">
          CodeSaga · Aprenda a programar, uma missão de cada vez.
        </footer>
      </div>
    </div>
  );
}

function LanguageMarkInline({ language }) {
  return (
    <span className="language-inline">
      <span style={{ color: LANGUAGES[language].color }}>{LANGUAGES[language].short}</span>
      {LANGUAGES[language].name}
    </span>
  );
}
