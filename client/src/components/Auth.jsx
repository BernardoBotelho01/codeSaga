import { useEffect, useRef, useState } from 'react';
import { Check, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../api';
import { LANGUAGES } from '../data';
import { Brand, HeroArt, LanguageMark } from './Art';
import { Button, Notice, PasswordField } from './Common';

export function LanguageSelection({ language, onChoose, onContinue, onLogin, loggedIn = false }) {
  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <Brand />
        <div>
          {loggedIn ? (
            'Sua trilha, seu ritmo.'
          ) : (
            <>
              <span>Já tem uma conta?</span>
              <Button variant="secondary" onClick={onLogin}>
                Entrar
              </Button>
            </>
          )}
        </div>
      </header>
      <main className="language-main">
        <p className="eyebrow">
          <Sparkles size={16} /> SUA AVENTURA NA PROGRAMAÇÃO
        </p>
        <h1>
          Com qual linguagem
          <br />
          você quer começar?
        </h1>
        <p className="lead">O mesmo mundo de descobertas. Três jeitos de programar.</p>
        <div className="language-grid">
          {Object.entries(LANGUAGES).map(([id, item]) => (
            <button
              key={id}
              className={`language-card ${language === id ? 'selected' : ''}`}
              onClick={() => onChoose(id)}
              aria-pressed={language === id}
            >
              <span className="selection-indicator">{language === id && <Check size={17} />}</span>
              <LanguageMark language={id} />
              <h2>{item.name}</h2>
              <p>{item.subtitle}</p>
              <div className={`language-island ${id}`}>
                <HeroArt alt="" />
              </div>
              <code>{item.sample}</code>
              <span className="language-card-status">
                {language === id ? 'SELECIONADO' : 'ESCOLHER LINGUAGEM'}
              </span>
            </button>
          ))}
        </div>
        <p className="muted">Você poderá trocar de linguagem no seu perfil.</p>
        <Button className="continue-language" onClick={onContinue}>
          Continuar com {LANGUAGES[language].name}
        </Button>
        <p className="small muted">O Mundo 1 está disponível nas três linguagens.</p>
      </main>
      <footer className="public-footer">
        CodeSaga · Aprenda a programar, uma missão de cada vez.
      </footer>
    </div>
  );
}

function AuthLayout({
  children,
  subtitle = 'Sua próxima conquista começa aqui.',
  onHome,
  compact = false,
}) {
  return (
    <main className={`auth-page ${compact ? 'auth-compact' : ''}`}>
      <section className="auth-illustration">
        <Brand onClick={onHome} />
        <div>
          <p className="eyebrow">UMA NOVA FORMA DE APRENDER</p>
          <h1>{subtitle}</h1>
          <p className="lead">Entre para explorar, aprender e continuar sua aventura.</p>
        </div>
        <HeroArt />
        <p className="auth-caption">
          <ShieldCheck size={17} /> Seu progresso acompanha a sua conta.
        </p>
      </section>
      <section className="auth-form-area">{children}</section>
    </main>
  );
}

export function Login({
  language,
  onLanguage,
  onRegister,
  onForgot,
  onVerify,
  onSignedIn,
  onHome,
  initialMessage,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const fields = new FormData(event.currentTarget);
    try {
      const remember = fields.get('remember') === 'on';
      const result = await api('/auth/login', {
        method: 'POST',
        body: { email: fields.get('email'), password: fields.get('password'), remember },
      });
      onSignedIn(result, remember);
    } catch (error) {
      setError(error.message);
      if (error.code === 'EMAIL_UNVERIFIED') onVerify(error.email);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout onHome={onHome}>
      <div className="auth-card">
        <div className="selected-language">
          <LanguageMark language={language} small />
          <span>Trilha selecionada · {LANGUAGES[language].name}</span>
          <button className="text-button" onClick={onLanguage}>
            Trocar
          </button>
        </div>
        <h2>Bem-vindo de volta!</h2>
        <p className="muted">Continue de onde parou.</p>
        <form onSubmit={submit}>
          {initialMessage && <Notice tone="success">{initialMessage}</Notice>}
          {error && <Notice>{error}</Notice>}
          <label className="field">
            <span>E-mail</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              maxLength={254}
              required
            />
          </label>
          <PasswordField placeholder="Sua senha" />
          <div className="form-options">
            <label className="check-label">
              <input name="remember" type="checkbox" /> Lembrar de mim
            </label>
            <button type="button" className="text-button" onClick={onForgot}>
              Esqueci minha senha
            </button>
          </div>
          <Button busy={busy} type="submit" className="full-width">
            Entrar
          </Button>
        </form>
        <p className="auth-bottom">
          Ainda não tem conta?{' '}
          <button className="text-button" onClick={onRegister}>
            Criar conta
          </button>
        </p>
        <button className="text-button small" onClick={() => onVerify('')}>
          Já me cadastrei. Confirmar e-mail
        </button>
      </div>
    </AuthLayout>
  );
}

export function Register({ language, onLanguage, onLogin, onRegistered, onHome }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setError('');
    const fields = new FormData(event.currentTarget);
    if (fields.get('password') !== fields.get('confirm')) {
      setError('As duas senhas precisam ser iguais.');
      return;
    }
    setBusy(true);
    try {
      const result = await api('/auth/register', {
        method: 'POST',
        body: {
          name: fields.get('name'),
          email: fields.get('email'),
          password: fields.get('password'),
          language,
        },
      });
      onRegistered(result);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout onHome={onHome} subtitle="Uma conta. Muitas descobertas.">
      <div className="auth-card signup">
        <p className="eyebrow">COMECE SUA JORNADA</p>
        <h2>Crie sua conta</h2>
        <p className="muted">Salve seu progresso e acompanhe sua evolução.</p>
        <form onSubmit={submit}>
          {error && <Notice>{error}</Notice>}
          <label className="field">
            <span>Nome de jogador</span>
            <input
              name="name"
              autoComplete="nickname"
              minLength={2}
              maxLength={40}
              placeholder="Como podemos chamar você?"
              required
            />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="seuemail@exemplo.com"
              required
            />
          </label>
          <PasswordField autoComplete="new-password" placeholder="Pelo menos 8 caracteres" />
          <PasswordField
            label="Confirmar senha"
            name="confirm"
            autoComplete="new-password"
            placeholder="Digite sua senha novamente"
          />
          <div className="selected-language">
            <LanguageMark language={language} small />
            <span>Sua trilha · {LANGUAGES[language].name}</span>
            <button type="button" className="text-button" onClick={onLanguage}>
              Alterar
            </button>
          </div>
          <Button busy={busy} type="submit" className="full-width">
            Criar conta
          </Button>
          <p className="small muted center">Vamos enviar um código para confirmar seu e-mail.</p>
        </form>
        <p className="auth-bottom">
          Já tem uma conta?{' '}
          <button className="text-button" onClick={onLogin}>
            Entrar
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

function OtpInput({ value, onChange }) {
  const input = useRef(null);
  return (
    <div className="otp-input" onClick={() => input.current?.focus()}>
      <input
        ref={input}
        aria-label="Código de verificação de seis dígitos"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
        required
        autoFocus
      />
      <div className="otp-boxes" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <span key={index} className={index === value.length ? 'focused' : ''}>
            {value[index] || ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Verify({ initialEmail, delivery, onSignedIn, onLogin, onHome }) {
  const [email, setEmail] = useState(initialEmail || '');
  const [editing, setEditing] = useState(!initialEmail);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState(delivery);
  const [remaining, setRemaining] = useState(initialEmail ? 45 : 0);
  useEffect(() => {
    if (!remaining) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);
  async function resend() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const result = await api('/auth/resend', { method: 'POST', body: { email } });
      setMode(result.delivery);
      setMessage(result.message);
      setRemaining(45);
      setEditing(false);
    } catch (error) {
      setError(error.message);
      if (error.retryAfter) setRemaining(error.retryAfter);
    } finally {
      setBusy(false);
    }
  }
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      onSignedIn(await api('/auth/verify', { method: 'POST', body: { email, code } }), false);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="verify-page">
      <header>
        <Brand onClick={onHome} />
      </header>
      <div className="verify-card">
        <span className="mail-illustration">
          <Mail size={45} />
          <ShieldCheck size={29} />
        </span>
        <p className="eyebrow">SÓ FALTA MAIS UM PASSO</p>
        <h1>Confirme seu e-mail</h1>
        <p className="muted">Digite o código de seis dígitos recebido para ativar sua conta.</p>
        {error && <Notice>{error}</Notice>}
        {message && <Notice tone="success">{message}</Notice>}
        {mode === 'console' && (
          <Notice tone="info">
            Teste local. O código aparece no terminal do VS Code, na mensagem “E-MAIL LOCAL”.
          </Notice>
        )}
        <form onSubmit={submit}>
          <label className="field email-confirm">
            <span>E-mail de cadastro</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              readOnly={!editing}
              required
            />
          </label>
          <OtpInput value={code} onChange={setCode} />
          <Button type="submit" busy={busy} disabled={code.length !== 6} className="full-width">
            Verificar código
          </Button>
        </form>
        <p className="small muted">O código vale por 10 minutos. Confira também o spam.</p>
        <button className="text-button" disabled={busy || remaining > 0 || !email} onClick={resend}>
          {remaining > 0 ? `Reenviar código em ${remaining}s` : 'Reenviar código'}
        </button>
        <button
          className="text-button small"
          onClick={() => {
            setEditing(true);
            setCode('');
            setMessage('Informe o e-mail usado no cadastro e solicite o reenvio.');
          }}
        >
          Corrigir e-mail digitado
        </button>
        <p className="small muted">
          Para usar outro endereço, volte e crie a conta com o e-mail correto.
        </p>
      </div>
      <button className="text-button" onClick={onLogin}>
        Voltar ao login
      </button>
    </main>
  );
}

function PasswordResetForm({ user, onComplete, onBack }) {
  const authenticated = Boolean(user);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(user?.email || '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!remaining) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  async function requestCode() {
    setBusy(true);
    setError('');
    setInfo('');
    try {
      const result = await api(authenticated ? '/me/password/code' : '/auth/forgot', {
        method: 'POST',
        body: authenticated ? {} : { email },
      });
      setInfo(
        result.delivery === 'console'
          ? 'Teste local. Consulte o código no terminal do VS Code.'
          : result.message,
      );
      setCode('');
      setRemaining(45);
      setStep(1);
    } catch (error) {
      setError(error.message);
      if (error.retryAfter) setRemaining(error.retryAfter);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (step === 0) {
      await requestCode();
      return;
    }
    const fields = new FormData(event.currentTarget);
    if (fields.get('password') !== fields.get('confirm')) {
      setError('As duas senhas precisam ser iguais.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api(authenticated ? '/me/password' : '/auth/reset', {
        method: 'POST',
        body: { email, code, password: fields.get('password') },
      });
      onComplete('Senha atualizada. Entre novamente com sua nova senha.');
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card password-reset-card">
      <p className="eyebrow">{authenticated ? 'SEGURANÇA DA CONTA' : 'RECUPERAÇÃO DE ACESSO'}</p>
      <h2>
        {step === 1
          ? 'Crie uma nova senha'
          : authenticated
            ? 'Alterar senha'
            : 'Esqueceu sua senha?'}
      </h2>
      <p className="muted">
        {step === 0
          ? 'Vamos enviar um código de seis dígitos para confirmar a troca de senha.'
          : 'Digite o código recebido no e-mail e escolha uma nova senha.'}
      </p>
      <form onSubmit={submit}>
        {error && <Notice>{error}</Notice>}
        {info && <Notice tone="info">{info}</Notice>}
        <label className="field">
          <span>{authenticated ? 'E-mail da sua conta' : 'E-mail cadastrado'}</span>
          <input
            type="email"
            value={email}
            autoComplete="email"
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
            required
            readOnly={step === 1 || authenticated}
          />
        </label>
        {step === 1 && (
          <>
            <OtpInput value={code} onChange={setCode} />
            <p className="small muted">
              O código vale por 10 minutos e permite até cinco tentativas.
            </p>
            <PasswordField autoComplete="new-password" label="Nova senha" />
            <PasswordField
              autoComplete="new-password"
              label="Confirmar nova senha"
              name="confirm"
            />
          </>
        )}
        <Button
          type="submit"
          busy={busy}
          disabled={step === 1 && code.length !== 6}
          className="full-width"
        >
          {step === 0 ? 'Enviar código por e-mail' : 'Salvar nova senha'}
        </Button>
      </form>
      {step === 1 && (
        <div className="password-resend">
          <button
            type="button"
            className="text-button"
            disabled={busy || remaining > 0}
            onClick={requestCode}
          >
            {remaining > 0 ? `Reenviar código em ${remaining}s` : 'Reenviar código por e-mail'}
          </button>
          {!authenticated && (
            <button
              type="button"
              className="text-button small"
              onClick={() => {
                setStep(0);
                setCode('');
                setInfo('');
                setError('');
              }}
            >
              Corrigir e-mail
            </button>
          )}
          <p className="small muted">Confira também a caixa de spam.</p>
        </div>
      )}
      <p className="auth-bottom">
        <button className="text-button" onClick={onBack}>
          {authenticated ? 'Voltar ao perfil' : 'Voltar ao login'}
        </button>
      </p>
    </div>
  );
}

export function Recovery({ onLogin, onHome }) {
  return (
    <AuthLayout onHome={onHome} subtitle="Sua aventura espera por você.">
      <PasswordResetForm onComplete={onLogin} onBack={() => onLogin()} />
    </AuthLayout>
  );
}

export function ChangePassword({ user, onComplete, onBack }) {
  return (
    <section className="password-change-page">
      <h1 className="sr-only">Alterar senha</h1>
      <PasswordResetForm user={user} onComplete={onComplete} onBack={onBack} />
    </section>
  );
}
