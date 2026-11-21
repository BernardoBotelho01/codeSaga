import { useState } from 'react';
import { Check, Eye, EyeOff, Heart, LoaderCircle, Star, TriangleAlert } from 'lucide-react';

export function Button({
  children,
  busy = false,
  disabled = false,
  variant = 'primary',
  className = '',
  ...props
}) {
  return (
    <button {...props} className={`button ${variant} ${className}`} disabled={busy || disabled}>
      {busy && <LoaderCircle size={18} className="spin" />}
      {children}
    </button>
  );
}
export function Notice({ children, tone = 'error' }) {
  return (
    <div className={`notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {tone === 'error' ? <TriangleAlert size={19} /> : <Check size={19} />}
      <span>{children}</span>
    </div>
  );
}
export function PasswordField({
  label = 'Senha',
  name = 'password',
  autoComplete = 'current-password',
  ...props
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field">
      <span>{label}</span>
      <span className="input-wrap">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          minLength={8}
          maxLength={128}
          autoComplete={autoComplete}
          required
          {...props}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </span>
    </label>
  );
}
export function Lives({ lives = 5 }) {
  return (
    <span className="lives" role="img" aria-label={`${lives} de 5 vidas`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <Heart
          key={index}
          size={22}
          fill={index < lives ? 'currentColor' : 'none'}
          className={index < lives ? '' : 'lost'}
        />
      ))}
    </span>
  );
}
export function Xp({ value }) {
  return (
    <span className="xp-pill">
      <Star size={17} fill="currentColor" />
      {value} XP
    </span>
  );
}
export function ProgressBar({ value, label }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
