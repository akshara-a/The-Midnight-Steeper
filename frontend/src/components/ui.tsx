'use client';

import { useEffect, useState } from 'react';
import {
  Apple,
  Cherry,
  Citrus,
  Clock,
  Cloud,
  Cookie,
  Droplet,
  Moon,
  Star,
  Sun,
  X,
  Zap,
} from 'lucide-react';

/** Strip emoji from text that is shown on screen (speech output is left untouched). */
export const plain = (s: string) =>
  s
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Minimal line illustrations for the six tea leaves and flowers. */
export function LeafArt({ name, size = 56 }: Readonly<{ name: string; size?: number }>) {
  let art: React.ReactNode;
  switch (name) {
    case 'Moon Mint':
      art = (
        <>
          <path d="M24 43V9" />
          <path d="M24 35c-6 0-10-3-11-8 6 0 10 3 11 8z" />
          <path d="M24 35c6 0 10-3 11-8-6 0-10 3-11 8z" />
          <path d="M24 25c-5 0-8-3-9-7 5 0 8 3 9 7z" />
          <path d="M24 25c5 0 8-3 9-7-5 0-8 3-9 7z" />
          <path d="M24 15c-3-2-3-6 0-10 3 4 3 8 0 10z" />
        </>
      );
      break;
    case 'Sleepy Lavender':
      art = (
        <>
          <path d="M24 44V20" />
          <ellipse cx="24" cy="11" rx="2.5" ry="4.5" />
          <ellipse cx="19" cy="18" rx="2.5" ry="4.5" transform="rotate(-20 19 18)" />
          <ellipse cx="29" cy="18" rx="2.5" ry="4.5" transform="rotate(20 29 18)" />
          <ellipse cx="19.5" cy="27" rx="2.5" ry="4.5" transform="rotate(-20 19.5 27)" />
          <ellipse cx="28.5" cy="27" rx="2.5" ry="4.5" transform="rotate(20 28.5 27)" />
        </>
      );
      break;
    case 'Sunny Daisy':
      art = (
        <>
          <circle cx="24" cy="24" r="4.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <ellipse key={a} cx="24" cy="12" rx="3.2" ry="6" transform={`rotate(${a} 24 24)`} />
          ))}
        </>
      );
      break;
    case 'Rose Petal':
      art = (
        <>
          <path d="M24 38c-9 0-15-6-15-14 0-5 3-9 7-10 1-4 5-6 8-6s7 2 8 6c4 1 7 5 7 10 0 8-6 14-15 14z" />
          <path d="M18 24c0-4 3-7 6-7s6 3 6 7-3 6-6 6c-2 0-4-1-4-3s1-3 3-3" />
          <path d="M24 38v6" />
          <path d="M24 42c-3-1-6-1-8 1 3 1 6 1 8-1z" />
        </>
      );
      break;
    case 'Berry Bloom':
      art = (
        <>
          <circle cx="16" cy="29" r="7" />
          <circle cx="31" cy="29" r="7" />
          <circle cx="23.5" cy="18" r="7" />
          <path d="M23.5 11c0-3 2-5 6-6" />
        </>
      );
      break;
    case 'Orange Blossom':
      art = (
        <>
          <circle cx="24" cy="24" r="3" />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="24" cy="12.5" rx="5" ry="7" transform={`rotate(${a} 24 24)`} />
          ))}
        </>
      );
      break;
    default:
      art = <circle cx="24" cy="24" r="10" />;
  }
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" {...stroke}>
      {art}
    </svg>
  );
}

const TREAT_ICONS: Record<string, typeof Star> = {
  'Honey Drop': Droplet,
  'Cookie Crumble': Cookie,
  'Strawberry Swirl': Cherry,
  'Lemon Sparkle': Citrus,
  'Vanilla Cloud': Cloud,
  'Star Sugar': Star,
};

export function TreatIcon({ name, size = 40 }: Readonly<{ name: string; size?: number }>) {
  const Icon = TREAT_ICONS[name] ?? Apple;
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />;
}

const NAP_ICONS: Record<string, typeof Star> = {
  demo: Zap,
  quick: Clock,
  '1h': Moon,
  '4h': Sun,
  '12h': Star,
};

export function NapIcon({ id, size = 36 }: Readonly<{ id: string; size?: number }>) {
  const Icon = NAP_ICONS[id] ?? Moon;
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />;
}

/** Thin indeterminate progress bar used while the 3D scene loads. */
export function LoadingBar({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <div
      role="progressbar"
      aria-label="Loading"
      className={`h-[2px] w-40 overflow-hidden rounded-full ${className}`}
      style={{ background: 'var(--border-strong)' }}
    >
      <div
        className="h-full w-2/5 rounded-full"
        style={{ background: 'var(--accent)', animation: 'loadbar 1.4s var(--ease) infinite' }}
      />
    </div>
  );
}

export function CloseButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button onClick={onClick} aria-label="Close" className="icon-btn">
      <X size={22} strokeWidth={1.5} aria-hidden="true" />
    </button>
  );
}

/** Esc closes whatever overlay is on screen. */
export function useEscape(onEscape: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEscape]);
}

function makeSum() {
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 3 + Math.floor(Math.random() * 7);
  const answer = a + b;
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const d = answer + Math.floor(Math.random() * 7) - 3;
    if (d > 0) options.add(d);
  }
  return { a, b, answer, options: [...options].sort((x, y) => x - y) };
}

/** A simple grown-up gate: answer an addition question. */
export function ParentGate({ onPass, onClose }: Readonly<{ onPass: () => void; onClose: () => void }>) {
  const [sum, setSum] = useState(makeSum);
  const [wrong, setWrong] = useState(false);
  useEscape(onClose);

  return (
    <div
      className="fixed inset-0 z-[52] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,13,26,0.8)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Grown-ups only"
    >
      <div className="surface animate-modal w-full max-w-sm p-7 text-center" style={{ background: 'var(--surface-solid)' }}>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Grown-ups only
        </p>
        <h2 className="mt-2 text-3xl font-light">
          {sum.a} + {sum.b} = ?
        </h2>
        <div className="mt-6 grid grid-cols-4 gap-2">
          {sum.options.map((o) => (
            <button
              key={o}
              onClick={() => {
                if (o === sum.answer) onPass();
                else {
                  setWrong(true);
                  setSum(makeSum());
                }
              }}
              className="btn-pill min-h-14 text-xl"
            >
              {o}
            </button>
          ))}
        </div>
        <p className="mt-3 h-5 text-sm" role="status" style={{ color: 'var(--danger)' }}>
          {wrong ? 'Not quite. Try this one.' : ''}
        </p>
        <button onClick={onClose} className="btn-pill mt-3 px-6">
          Cancel
        </button>
      </div>
    </div>
  );
}

const LEAF_NAMES = new Set(['Moon Mint', 'Sleepy Lavender', 'Sunny Daisy', 'Rose Petal', 'Berry Bloom', 'Orange Blossom']);

/** Line art for any tea ingredient (leaf, flower or treat). */
export function IngredientArt({ name, size = 40 }: Readonly<{ name: string; size?: number }>) {
  return LEAF_NAMES.has(name) ? <LeafArt name={name} size={size} /> : <TreatIcon name={name} size={size} />;
}
