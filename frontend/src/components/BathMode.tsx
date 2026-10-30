'use client';

import { useState } from 'react';
import { Bath, Bird, Check, Droplets, Sparkles, Wind } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';
import { BATH_LINES } from '@/lib/kidsContent';
import { plain } from '@/components/ui';

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
    { id: 1, x: 25, y: 70, size: 48, speed: 1.2 },
    { id: 2, x: 65, y: 80, size: 36, speed: 1.5 },
    { id: 3, x: 80, y: 60, size: 54, speed: 1.0 },
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
      size: Math.floor(28 + Math.random() * 24),
    };

    setSuds((prev) => [...prev.slice(-14), newSud]);
    setCleanliness((prev) => {
      const next = Math.min(85, prev + 5);
      return next;
    });

    if (Math.random() > 0.6) {
      onSay(pickLine());
    }
  };

  // Shower tool: rinse suds and wash Sunny clean!
  const useShower = () => {
    sounds.playWaterStream();
    sounds.playSplash();

    // Wash away some suds
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
      size: 38 + Math.random() * 30,
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
    { id: 'soap', label: 'Soap Up', Icon: Sparkles, color: 'var(--lavender)', onPick: () => {} },
    { id: 'shower', label: 'Shower Rinse', Icon: Droplets, color: 'var(--berry)', onPick: useShower },
    { id: 'duck', label: 'Rubber Duck', Icon: Bird, color: 'var(--daisy)', onPick: squeakDuck },
    { id: 'bubble', label: 'Blow Bubbles', Icon: Wind, color: 'var(--mint)', onPick: blowBubble },
  ] as const;

  const hints: Record<string, string> = {
    soap: 'Tap Sunny to lather with fluffy soap bubbles!',
    shower: 'Tap to spray warm water and rinse the suds!',
    duck: 'Tap the rubber ducky to squeak and splash!',
    bubble: 'Tap to blow shiny bubbles, then tap them to pop!',
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Bath Top HUD */}
      <div className="surface px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Bath size={28} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--berry)' }} className="shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-base" style={{ color: 'var(--text)' }}>
              Sunny&apos;s Bubble Bath
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                Cleanliness: {cleanliness}%
              </div>
              <div
                className="progress-line w-24"
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

        <button onClick={onClose} className="btn-pill primary px-4 text-sm sm:text-base shrink-0">
          <Check size={18} strokeWidth={1.5} aria-hidden="true" /> Done Bathing
        </button>
      </div>

      {/* Interactive Bathing Overlay Area (covers the 3D pet view) */}
      <div
        className="relative w-full h-[220px] overflow-hidden cursor-pointer select-none"
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-strong)',
          background: 'color-mix(in srgb, var(--berry) 10%, transparent)',
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
          className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs sm:text-sm text-center pointer-events-none z-20 max-w-[92%]"
          style={{ background: 'var(--surface-solid)', color: 'var(--text)', border: '1px solid var(--border-strong)' }}
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
              background: 'rgba(255,255,255,0.8)',
              border: '1.5px solid rgba(255,255,255,0.95)',
            }}
          >
            <span className="text-sm opacity-90">🫧</span>
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
            className="absolute rounded-full cursor-pointer hover:scale-110 active:scale-90 transition-transform duration-200 ease-out animate-pulse"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${Math.max(44, b.size)}px`,
              height: `${Math.max(44, b.size)}px`,
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(143,180,255,0.3) 60%, rgba(255,158,196,0.3))',
              border: '1.5px solid rgba(255,255,255,0.7)',
            }}
            aria-label="Pop the bubble"
          >
            <span className="absolute top-2 left-3 w-2 h-2 rounded-full bg-white/80" />
          </button>
        ))}

        {/* Squeaky Rubber Duck in Tub (gameplay sprite) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            squeakDuck();
          }}
          className={`absolute bottom-3 right-4 text-4xl min-w-[56px] min-h-[56px] flex items-center justify-center rounded-full hover:scale-110 active:scale-95 transition-transform duration-200 ease-out cursor-pointer ${
            duckBounces > 0 ? 'animate-bounce-soft' : ''
          }`}
          style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)' }}
          aria-label="Squeak the duck"
        >
          🐥
        </button>

        {isSparklingClean && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            style={{ background: 'rgba(255,216,115,0.10)' }}
          >
            <div className="surface px-5 py-3 text-center animate-pop" style={{ background: 'var(--surface-solid)' }}>
              <Sparkles size={28} strokeWidth={1.5} aria-hidden="true" className="mx-auto" style={{ color: 'var(--daisy)' }} />
              <div className="font-semibold text-lg mt-1" style={{ color: 'var(--text)' }}>
                {plain('Sparkly Clean! +50 Stars!')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bath Tools Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tools.map(({ id, label, Icon, color, onPick }) => (
          <button
            key={id}
            onClick={() => {
              sounds.playClick();
              setActiveTool(id);
              onPick();
            }}
            data-selected={activeTool === id}
            aria-pressed={activeTool === id}
            className="pick-card p-3 min-h-[72px] flex flex-col items-center justify-center gap-1.5"
            style={{ ['--sel' as string]: color }}
          >
            <Icon size={26} strokeWidth={1.5} aria-hidden="true" style={{ color }} />
            <span className="text-xs sm:text-sm font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
