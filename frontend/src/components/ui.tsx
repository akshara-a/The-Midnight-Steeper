'use client';

import { useEffect, useState } from 'react';
import { X, Lock, Sparkles } from 'lucide-react';

/** Keep emojis and format text cleanly for kid-friendly display! */
export const plain = (s: string) => s.replace(/\s+/g, ' ').trim();

const LEAF_ITEMS: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  'Moon Mint': { emoji: '🌿', color: '#10b981', bg: 'linear-gradient(135deg, #a7f3d0 0%, #10b981 100%)', border: '#059669' },
  'Sleepy Lavender': { emoji: '🪻', color: '#8b5cf6', bg: 'linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%)', border: '#6d28d9' },
  'Sunny Daisy': { emoji: '🌼', color: '#f59e0b', bg: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)', border: '#d97706' },
  'Rose Petal': { emoji: '🌹', color: '#f43f5e', bg: 'linear-gradient(135deg, #fbcfe8 0%, #f43f5e 100%)', border: '#be123c' },
  'Berry Bloom': { emoji: '🫐', color: '#3b82f6', bg: 'linear-gradient(135deg, #bfdbfe 0%, #3b82f6 100%)', border: '#1d4ed8' },
  'Orange Blossom': { emoji: '🍊', color: '#f97316', bg: 'linear-gradient(135deg, #fed7aa 0%, #f97316 100%)', border: '#c2410c' },
};

const TREAT_ITEMS: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  'Honey Drop': { emoji: '🍯', color: '#f59e0b', bg: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)', border: '#d97706' },
  'Cookie Crumble': { emoji: '🍪', color: '#b45309', bg: 'linear-gradient(135deg, #fed7aa 0%, #b45309 100%)', border: '#78350f' },
  'Strawberry Swirl': { emoji: '🍓', color: '#f43f5e', bg: 'linear-gradient(135deg, #fbcfe8 0%, #f43f5e 100%)', border: '#be123c' },
  'Lemon Sparkle': { emoji: '🍋', color: '#eab308', bg: 'linear-gradient(135deg, #fef9c3 0%, #eab308 100%)', border: '#a16207' },
  'Vanilla Cloud': { emoji: '☁️', color: '#0ea5e9', bg: 'linear-gradient(135deg, #e0f2fe 0%, #38bdf8 100%)', border: '#0369a1' },
  'Star Sugar': { emoji: '⭐', color: '#a855f7', bg: 'linear-gradient(135deg, #f5d0fe 0%, #c084fc 100%)', border: '#7e22ce' },
};

const NAP_ITEMS: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  demo: { emoji: '⚡', color: '#f59e0b', bg: 'linear-gradient(135deg, #fef08a 0%, #f59e0b 100%)', border: '#d97706' },
  quick: { emoji: '😴', color: '#6366f1', bg: 'linear-gradient(135deg, #bfdbfe 0%, #6366f1 100%)', border: '#4338ca' },
  '1h': { emoji: '🐱', color: '#ec4899', bg: 'linear-gradient(135deg, #fed7aa 0%, #ec4899 100%)', border: '#be185d' },
  '4h': { emoji: '☀️', color: '#f97316', bg: 'linear-gradient(135deg, #fef08a 0%, #f97316 100%)', border: '#c2410c' },
  '12h': { emoji: '🌙', color: '#7c3aed', bg: 'linear-gradient(135deg, #c7d2fe 0%, #7c3aed 100%)', border: '#5b21b6' },
};

/** Joyful, bouncy candy badge for tea leaves and flowers. */
export function LeafArt({ name, size = 56 }: Readonly<{ name: string; size?: number }>) {
  const item = LEAF_ITEMS[name] ?? { emoji: '🍃', color: '#10b981', bg: 'linear-gradient(135deg, #a7f3d0 0%, #10b981 100%)', border: '#059669' };
  return (
    <div
      className="relative inline-flex items-center justify-center rounded-2xl select-none transition-transform hover:scale-105"
      style={{
        width: size,
        height: size,
        background: item.bg,
        border: `2.5px solid ${item.border}`,
        boxShadow: `0 4px 0 ${item.border}, 0 6px 14px rgba(0,0,0,0.25), inset 0 2px 2px rgba(255,255,255,0.7)`,
      }}
      aria-hidden="true"
    >
      <span style={{ fontSize: `${Math.round(size * 0.58)}px`, lineHeight: 1 }} className="filter drop-shadow-sm">
        {item.emoji}
      </span>
      <span className="absolute -top-1 -right-1 text-xs opacity-70">✨</span>
    </div>
  );
}

/** Sweet candy badge for yummy treats. */
export function TreatIcon({ name, size = 40 }: Readonly<{ name: string; size?: number }>) {
  const item = TREAT_ITEMS[name] ?? { emoji: '🍬', color: '#ec4899', bg: 'linear-gradient(135deg, #fbcfe8 0%, #ec4899 100%)', border: '#be185d' };
  return (
    <div
      className="relative inline-flex items-center justify-center rounded-2xl select-none transition-transform hover:scale-105"
      style={{
        width: size,
        height: size,
        background: item.bg,
        border: `2.5px solid ${item.border}`,
        boxShadow: `0 4px 0 ${item.border}, 0 6px 14px rgba(0,0,0,0.25), inset 0 2px 2px rgba(255,255,255,0.7)`,
      }}
      aria-hidden="true"
    >
      <span style={{ fontSize: `${Math.round(size * 0.58)}px`, lineHeight: 1 }} className="filter drop-shadow-sm">
        {item.emoji}
      </span>
      <span className="absolute -top-1 -right-1 text-xs opacity-70">✨</span>
    </div>
  );
}

/** Playful badge for nap times. */
export function NapIcon({ id, size = 36 }: Readonly<{ id: string; size?: number }>) {
  const item = NAP_ITEMS[id] ?? { emoji: '💤', color: '#8b5cf6', bg: 'linear-gradient(135deg, #ddd6fe 0%, #8b5cf6 100%)', border: '#6d28d9' };
  return (
    <div
      className="relative inline-flex items-center justify-center rounded-2xl select-none transition-transform hover:scale-105"
      style={{
        width: size,
        height: size,
        background: item.bg,
        border: `2.5px solid ${item.border}`,
        boxShadow: `0 4px 0 ${item.border}, 0 6px 14px rgba(0,0,0,0.25), inset 0 2px 2px rgba(255,255,255,0.7)`,
      }}
      aria-hidden="true"
    >
      <span style={{ fontSize: `${Math.round(size * 0.58)}px`, lineHeight: 1 }} className="filter drop-shadow-sm">
        {item.emoji}
      </span>
    </div>
  );
}

/** Chunky candy progress bar used while 3D loads. */
export function LoadingBar({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <div
      role="progressbar"
      aria-label="Loading"
      className={`h-4 w-48 overflow-hidden rounded-full p-0.5 ${className}`}
      style={{
        background: 'rgba(15, 8, 48, 0.8)',
        border: '2px solid rgba(255, 255, 255, 0.35)',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
      }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: '50%',
          background: 'linear-gradient(90deg, #10b981, #facc15, #f43f5e)',
          boxShadow: '0 0 10px #facc15',
          animation: 'loadbar 1.2s var(--ease) infinite',
        }}
      />
    </div>
  );
}

/** Bouncy candy ✖ close button */
export function CloseButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button
      onClick={onClick}
      aria-label="Close"
      className="inline-flex items-center justify-center w-11 h-11 rounded-full text-white font-black text-lg cursor-pointer transition-all hover:scale-110 active:scale-90"
      style={{
        background: 'linear-gradient(180deg, #fb7185 0%, #e11d48 100%)',
        border: '2.5px solid #ffffff',
        boxShadow: '0 4px 0 #9f1239, 0 6px 14px rgba(0,0,0,0.3)',
      }}
    >
      <X size={22} strokeWidth={3} aria-hidden="true" />
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

/** Playful grown-up lock */
export function ParentGate({ onPass, onClose }: Readonly<{ onPass: () => void; onClose: () => void }>) {
  const [sum, setSum] = useState(makeSum);
  const [wrong, setWrong] = useState(false);
  useEscape(onClose);

  return (
    <div
      className="fixed inset-0 z-[52] flex items-center justify-center p-4"
      style={{ background: 'rgba(30, 20, 60, 0.45)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Grown-ups only lock"
    >
      <div className="surface animate-modal w-full max-w-sm p-7 text-center rounded-3xl border-3 border-purple-200 shadow-2xl">
        <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-white mb-2" style={{ background: 'linear-gradient(180deg, #818cf8, #4f46e5)', border: '2.5px solid #ffffff', boxShadow: '0 4px 0 #312e81' }}>
          <Lock size={26} strokeWidth={2.5} />
        </div>
        <p className="text-sm font-black uppercase tracking-wider text-purple-700">
          🔒 Grown-ups Only!
        </p>
        <p className="text-xs text-slate-600 font-bold mt-0.5">Solve the puzzle to enter the parent settings:</p>
        <h2 className="mt-4 text-3xl font-black text-indigo-950">
          {sum.a} + {sum.b} = ?
        </h2>
        <div className="mt-6 grid grid-cols-4 gap-2.5">
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
              className="btn-pill min-h-14 text-2xl font-black text-white"
              style={{
                background: 'linear-gradient(180deg, #6366f1 0%, #4338ca 100%)',
                border: '2px solid #a5b4fc',
                boxShadow: '0 5px 0 #312e81',
              }}
            >
              {o}
            </button>
          ))}
        </div>
        <p className="mt-3 h-5 text-sm font-bold text-rose-500" role="status">
          {wrong ? 'Oops! Try this one instead ⭐' : ''}
        </p>
        <button onClick={onClose} className="btn-pill mt-3 px-6 text-sm font-black text-indigo-950">
          Close
        </button>
      </div>
    </div>
  );
}

const LEAF_NAMES = new Set(['Moon Mint', 'Sleepy Lavender', 'Sunny Daisy', 'Rose Petal', 'Berry Bloom', 'Orange Blossom']);

/** Rich sticker art for any tea ingredient (leaf, flower or treat). */
export function IngredientArt({ name, size = 44 }: Readonly<{ name: string; size?: number }>) {
  return LEAF_NAMES.has(name) ? <LeafArt name={name} size={size} /> : <TreatIcon name={name} size={size} />;
}
