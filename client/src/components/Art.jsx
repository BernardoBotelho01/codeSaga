import {
  BookOpen,
  Building2,
  Code2,
  Flag,
  GraduationCap,
  LockKeyhole,
  Route,
  Sparkles,
  Trees,
  Trophy,
} from 'lucide-react';
import { avatarColors } from '../data';

export function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="CodeSaga, início">
      <span className="brand-mark">
        <Code2 size={27} strokeWidth={2.8} />
      </span>
      <span>
        Code<span className="brand-saga">Saga</span>
      </span>
    </button>
  );
}

export function HeroArt({
  className = '',
  alt = 'Robô explorador em uma ilha com um baú de código e livros de programação',
}) {
  return (
    <img
      className={`hero-art ${className}`}
      src={`${import.meta.env.BASE_URL}assets/aventura.png`}
      alt={alt}
    />
  );
}

export function Robot({ color = 'turquoise', small = false }) {
  const accent = avatarColors[color] || color;
  return (
    <svg
      className={`robot ${small ? 'robot-small' : ''}`}
      viewBox="0 0 150 160"
      role="img"
      aria-label="Avatar robô"
      style={{ '--robot-color': accent }}
    >
      <defs>
        <linearGradient id={`metal-${color}`} x2="1" y2="1">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#97b8d5" />
        </linearGradient>
      </defs>
      <path d="M75 26V12" stroke="#bcd0e5" strokeWidth="5" />
      <circle cx="75" cy="10" r="7" fill={accent} />
      <rect x="24" y="30" width="102" height="76" rx="28" fill={`url(#metal-${color})`} />
      <rect x="33" y="40" width="84" height="54" rx="21" fill="#071b2d" />
      <rect x="14" y="51" width="13" height="34" rx="6" fill={accent} />
      <rect x="123" y="51" width="13" height="34" rx="6" fill={accent} />
      <path
        d="M49 65q9-15 18 0m16 0q9-15 18 0"
        fill="none"
        stroke={accent}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M67 78q8 8 16 0" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <rect x="48" y="111" width="54" height="33" rx="12" fill={`url(#metal-${color})`} />
      <path
        d="m68 120-7 6 7 6m14-12 7 6-7 6m-5-14-4 22"
        fill="none"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M50 115l-15 10m65-10 15-10"
        stroke="#b8cfe5"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path d="M59 143v10m32-10v10" stroke="#b8cfe5" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

export function LanguageMark({ language, small = false }) {
  if (language === 'python')
    return (
      <span className={`language-mark python ${small ? 'small' : ''}`} aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <path
            fill="#64b7f5"
            d="M34 5H21q-9 0-9 9v8h20v4H10Q2 26 2 35v9q0 8 9 8h8V40q0-10 10-10h14V15q0-10-9-10Z"
          />
          <path
            fill="#f4d249"
            d="M30 59h13q9 0 9-9v-8H32v-4h22q8 0 8-9v-9q0-8-9-8h-8v12q0 10-10 10H21v15q0 10 9 10Z"
          />
          <circle cx="24" cy="13" r="2.7" fill="#102239" />
          <circle cx="41" cy="51" r="2.7" fill="#102239" />
        </svg>
      </span>
    );
  if (language === 'java')
    return (
      <span className={`language-mark java ${small ? 'small' : ''}`} aria-hidden="true">
        <svg viewBox="0 0 64 64">
          <path
            d="M30 28c-18-12 19-10 7-26m-6 27C53 18 22 14 43 5"
            fill="none"
            stroke="#f2905a"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M13 33h35l-4 17H18ZM48 36c16-1 12 12-3 10M10 54q24 10 46-1"
            fill="none"
            stroke="#c3dcee"
            strokeWidth="4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </span>
    );
  return (
    <span className={`language-mark javascript ${small ? 'small' : ''}`} aria-hidden="true">
      JS
    </span>
  );
}

export function WorldArt({ kind = 'chest', color = 'green', locked = false }) {
  const Icon = { chest: Code2, city: Building2, route: Route, campus: GraduationCap }[kind];
  return (
    <div className={`world-art ${color} ${locked ? 'world-art-locked' : ''}`} aria-hidden="true">
      <span className="world-orbit" />
      <span className="island-shadow" />
      <span className="island-rock" />
      <span className="island-grass" />
      <Trees className="island-tree" size={66} strokeWidth={1.3} />
      <div className={`world-building ${kind}`}>
        <Icon size={kind === 'campus' ? 59 : 48} strokeWidth={1.6} />
      </div>
      <Flag className="island-flag" size={35} />
      <span className="island-stone one" />
      <span className="island-stone two" />
      <span className="waterfall" />
      {locked ? (
        <span className="world-lock">
          <LockKeyhole size={23} />
        </span>
      ) : (
        <Sparkles className="world-spark" size={25} />
      )}
    </div>
  );
}

export function EmptyState({ title, children, icon: Icon = BookOpen }) {
  return (
    <div className="empty-state">
      <Icon size={39} />
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}

export function Achievement({ unlocked, title, icon: Icon = Trophy }) {
  return (
    <div className={`achievement ${unlocked ? 'unlocked' : ''}`}>
      <span>
        <Icon size={25} />
      </span>
      <strong>{title}</strong>
      {!unlocked && <LockKeyhole size={15} />}
    </div>
  );
}
