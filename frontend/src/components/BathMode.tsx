'use client';

import { useState } from 'react';
import { Bath, Check, Sparkles } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';
import { BATH_LINES } from '@/lib/kidsContent';

interface BathModeProps {
  onSay: (text: string) => void;
  onReward: (xp: number) => void;
  onClose: () => void;
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface Sud {
  id: number;
  x: number;
  y: number;
  size: number;
}

export default function BathMode({ onSay, onReward, onClose }: BathModeProps) {
  const [cleanliness, setCleanliness] = useState(40);
  const [activeTool, setActiveTool] = useState<'soap' | 'shower' | 'duck' | 'bubble'>('soap');
  const [suds, setSuds] = useState<Sud[]>([]);
  const [floatingBubbles, setFloatingBubbles] = useState<Bubble[]>([
    { id: 1, x: 25, y: 70, size: 52, speed: 1.2 },
    { id: 2, x: 65, y: 80, size: 42, speed: 1.5 },
    { id: 3, x: 80, y: 60, size: 60, speed: 1.0 },
  ]);
  const [duckBounces, setDuckBounces] = useState(0);
  const [isSparklingClean, setIsSparklingClean] = useState(false);

  const pickLine = () => BATH_LINES[Math.floor(Math.random() * BATH_LINES.length)];

  // Soap tool: rub or tap on Sunny to create suds!
  const applySoap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    sounds.playBubblePop();
    const newSud: Sud = {
      id: Date.now() + Math.random(),
      x: Math.min(85, Math.max(15, x + (Math.random() * 8 - 4))),
      y: Math.min(80, Math.max(25, y + (Math.random() * 8 - 4))),
      size: Math.floor(32 + Math.random() * 26),
    };

    setSuds((prev) => [...prev.slice(-14), newSud]);
    setCleanliness((prev) => Math.min(85, prev + 5));

    if (Math.random() > 0.6) {
      onSay(pickLine());
    }
  };

  // Shower tool: rinse suds and wash Sunny clean!
  const useShower = () => {
    sounds.playWaterStream();
    sounds.playSplash();

    setSuds((prev) => prev.slice(0, Math.max(0, prev.length - 4)));

    setCleanliness((prev) => {
      const next = Math.min(100, prev + 15);
      if (next >= 100 && !isSparklingClean) {
        setIsSparklingClean(true);
        sounds.playLootFanfare();
        onSay('Hooray! I am 100% squeaky clean and sparkly fresh! ✨🦥');
        onReward(50);
      } else {
        onSay(pickLine());
      }
      return next;
    });
  };

  // Rubber duck squeak
  const squeakDuck = () => {
    sounds.playSqueak();
    setDuckBounces((b) => b + 1);
    onSay('Squeak squeak! Quack! That tickles! 🐥');
  };

  // Blow floating bubble
  const blowBubble = () => {
    sounds.playBubblePop();
    const newB: Bubble = {
      id: Date.now() + Math.random(),
      x: 20 + Math.random() * 60,
      y: 90,
      size: 44 + Math.random() * 32,
      speed: 1 + Math.random() * 0.8,
    };
    setFloatingBubbles((prev) => [...prev, newB]);
  };

  const popBubble = (id: number) => {
    sounds.playBubblePop();
    setFloatingBubbles((prev) => prev.filter((b) => b.id !== id));
    onReward(5);
  };

  const tools = [
    { id: 'soap', label: 'Soap Up', emoji: '🧼', color: '#a855f7', shadow: '#7e22ce', onPick: () => {} },
    { id: 'shower', label: 'Shower Rinse', emoji: '🚿', color: '#06b6d4', shadow: '#0891b2', onPick: useShower },
    { id: 'duck', label: 'Rubber Duck', emoji: '🐥', color: '#f59e0b', shadow: '#d97706', onPick: squeakDuck },
    { id: 'bubble', label: 'Blow Bubbles', emoji: '🫧', color: '#10b981', shadow: '#059669', onPick: blowBubble },
  ] as const;

  const hints: Record<string, string> = {
    soap: '🫧 Tap or rub Sunny to lather with fluffy soap bubbles!',
    shower: '🚿 Spray warm water and rinse all the soapy suds!',
    duck: '🐥 Squeak the rubber ducky to splash and giggle!',
    bubble: '🫧 Tap to blow shiny floating bubbles, then pop them!',
  };

  return (
    <div className="flex flex-col gap-3.5 w-full animate-modal">
      {/* Bath Top HUD */}
      <div className="surface px-4 py-3 flex items-center justify-between gap-3 rounded-3xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl bg-cyan-500/30 border-2 border-cyan-400/50 shadow-inner">
            🛁
          </div>
          <div className="min-w-0">
            <div className="font-black text-lg text-amber-200">
              Sunny&apos;s Bubble Bath! 🫧
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-black text-cyan-200 uppercase tracking-wide">
                Clean: {cleanliness}%
              </span>
              <div
                className="progress-line w-28 sm:w-36 h-3.5"
                role="progressbar"
                aria-label="Cleanliness"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={cleanliness}
              >
                <span style={{ width: `${cleanliness}%` }} />
              </div>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="btn-pill primary px-5 py-2 text-sm sm:text-base font-black shrink-0">
          <Check size={20} strokeWidth={3} aria-hidden="true" /> Done Bathing
        </button>
      </div>

      {/* Interactive Bathing Overlay Area (covers the 3D pet view) */}
      <div
        className="relative w-full h-[220px] overflow-hidden cursor-pointer select-none rounded-3xl border-3 border-cyan-300/40 shadow-inner"
        style={{
          background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.15) 0%, rgba(14, 116, 144, 0.3) 100%)',
        }}
        onClick={(e) => {
          if (activeTool === 'soap') applySoap(e);
          else if (activeTool === 'shower') useShower();
          else if (activeTool === 'duck') squeakDuck();
          else if (activeTool === 'bubble') blowBubble();
        }}
      >
        {/* Hint banner */}
        <div
          className="absolute top-2.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-black text-center pointer-events-none z-20 max-w-[92%] shadow-md"
          style={{ background: 'rgba(25, 12, 65, 0.88)', color: '#ffd23f', border: '2px solid rgba(255, 255, 255, 0.3)' }}
        >
          {hints[activeTool]}
        </div>

        {/* Soap suds sticking to Sunny */}
        {suds.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full flex items-center justify-center pointer-events-none animate-pop"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(220,240,255,0.85) 60%, rgba(200,225,255,0.7))',
              border: '2px solid rgba(255,255,255,0.95)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
            }}
          >
            <span className="text-sm">🫧</span>
          </div>
        ))}

        {/* Floating bubbles that can be popped */}
        {floatingBubbles.map((b) => (
          <button
            key={b.id}
            onClick={(e) => {
              e.stopPropagation();
              popBubble(b.id);
            }}
            className="absolute rounded-full cursor-pointer hover:scale-110 active:scale-90 transition-transform duration-150 ease-out animate-pulse"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${Math.max(48, b.size)}px`,
              height: `${Math.max(48, b.size)}px`,
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(125,211,252,0.4) 60%, rgba(244,114,182,0.4))',
              border: '2.5px solid rgba(255,255,255,0.85)',
              boxShadow: '0 0 16px rgba(125,211,252,0.6)',
            }}
            aria-label="Pop the bubble"
          >
            <span className="absolute top-2 left-3 w-2.5 h-2.5 rounded-full bg-white/90" />
            <span className="text-xs">✨</span>
          </button>
        ))}

        {/* Squeaky Rubber Duck in Tub */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            squeakDuck();
          }}
          className={`absolute bottom-3 right-4 text-4xl w-14 h-14 flex items-center justify-center rounded-2xl hover:scale-110 active:scale-95 transition-transform duration-150 cursor-pointer shadow-lg ${
            duckBounces > 0 ? 'animate-bounce' : ''
          }`}
          style={{ background: 'linear-gradient(180deg, #fef08a 0%, #f59e0b 100%)', border: '2.5px solid #ffffff', boxShadow: '0 4px 0 #b45309' }}
          aria-label="Squeak the duck"
        >
          🐥
        </button>

        {isSparklingClean && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            style={{ background: 'rgba(255,216,115,0.18)' }}
          >
            <div className="surface px-6 py-4 text-center animate-pop rounded-3xl" style={{ background: 'rgba(25, 12, 65, 0.95)' }}>
              <div className="text-4xl animate-bounce mb-1">✨🦥✨</div>
              <div className="font-black text-xl text-amber-300">
                Sparkly Clean! Hooray!
              </div>
              <div className="text-xs font-bold text-emerald-300 mt-1">
                ⭐ +50 Stars Awarded!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bath Tools Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {tools.map(({ id, label, emoji, color, shadow, onPick }) => (
          <button
            key={id}
            onClick={() => {
              sounds.playClick();
              setActiveTool(id);
              onPick();
            }}
            data-selected={activeTool === id}
            aria-pressed={activeTool === id}
            className="pick-card p-3 min-h-[80px] flex flex-col items-center justify-center gap-1"
            style={{ ['--sel' as string]: color }}
          >
            <span className="text-3xl animate-bounce-soft">{emoji}</span>
            <span className="text-xs sm:text-sm font-black text-white">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
