'use client';

import { useState } from 'react';
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

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Bath Top HUD */}
      <div className="toy-card px-4 py-3 flex items-center justify-between gap-3 bg-sky-100/90 border-sky-300">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-3xl animate-bounce-soft">🛁</span>
          <div>
            <div className="font-bold text-base text-[#1e3a8a]">Sunny&apos;s Bubble Bath</div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="text-xs font-semibold text-sky-800">Cleanliness: {cleanliness}%</div>
              <div className="w-24 h-3 bg-white/80 rounded-full overflow-hidden border border-sky-300">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${cleanliness}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-chunky green px-4 py-2 text-sm sm:text-base flex items-center gap-1 shrink-0"
        >
          ✓ Done Bathing
        </button>
      </div>

      {/* Interactive Bathing Overlay Area (covers the 3D pet view) */}
      <div
        className="relative w-full h-[220px] rounded-3xl overflow-hidden border-4 border-sky-200 bg-sky-500/10 cursor-pointer select-none"
        onClick={(e) => {
          if (activeTool === 'soap') applySoap(e);
          else if (activeTool === 'shower') useShower();
          else if (activeTool === 'duck') squeakDuck();
          else if (activeTool === 'bubble') blowBubble();
        }}
      >
        {/* Hint banner */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/85 px-4 py-1 rounded-full text-xs sm:text-sm font-bold text-sky-900 border-2 border-sky-300 shadow-sm pointer-events-none z-20">
          {activeTool === 'soap' && '🧼 Tap Sunny to lather with fluffy soap bubbles!'}
          {activeTool === 'shower' && '🚿 Tap to spray warm water and rinse the suds!'}
          {activeTool === 'duck' && '🐥 Tap the rubber ducky to squeak and splash!'}
          {activeTool === 'bubble' && '🫧 Tap to blow shiny bubbles, then tap them to pop!'}
        </div>

        {/* Soap suds sticking to Sunny */}
        {suds.map((s) => (
          <div
            key={s.id}
            className="absolute rounded-full bg-white/90 shadow-md border-2 border-sky-100 flex items-center justify-center pointer-events-none transition-transform animate-pop"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              transform: 'translate(-50%, -50%)',
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
            className="absolute rounded-full bg-gradient-to-tr from-sky-200/60 via-pink-200/60 to-white/80 border-2 border-white/90 shadow-lg cursor-pointer hover:scale-110 active:scale-90 transition transform animate-pulse"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              transform: 'translate(-50%, -50%)',
            }}
            title="Pop me!"
          >
            <span className="absolute top-1 left-2 w-2 h-2 rounded-full bg-white/80" />
          </button>
        ))}

        {/* Squeaky Rubber Duck in Tub */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            squeakDuck();
          }}
          className={`absolute bottom-3 right-6 text-4xl p-2 rounded-full bg-white/80 border-2 border-amber-300 shadow-md hover:scale-125 active:scale-95 transition cursor-pointer ${
            duckBounces > 0 ? 'animate-bounce' : ''
          }`}
          title="Squeak the duck!"
        >
          🐥
        </button>

        {isSparklingClean && (
          <div className="absolute inset-0 bg-yellow-200/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none z-30">
            <div className="toy-card px-5 py-3 text-center bg-white border-yellow-300 animate-pop">
              <span className="text-3xl">✨👑✨</span>
              <div className="font-bold text-lg text-amber-700">Sparkly Clean! +50 Stars!</div>
            </div>
          </div>
        )}
      </div>

      {/* Bath Tools Toolbar */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTool('soap');
          }}
          className={`btn-chunky p-2.5 flex flex-col items-center justify-center gap-1 ${
            activeTool === 'soap' ? 'blue scale-105 ring-4 ring-sky-300' : 'purple'
          }`}
        >
          <span className="text-2xl sm:text-3xl">🧼</span>
          <span className="text-xs sm:text-sm font-bold">Soap Up</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTool('shower');
            useShower();
          }}
          className={`btn-chunky p-2.5 flex flex-col items-center justify-center gap-1 ${
            activeTool === 'shower' ? 'blue scale-105 ring-4 ring-sky-300' : 'purple'
          }`}
        >
          <span className="text-2xl sm:text-3xl">🚿</span>
          <span className="text-xs sm:text-sm font-bold">Shower Rinse</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTool('duck');
            squeakDuck();
          }}
          className={`btn-chunky p-2.5 flex flex-col items-center justify-center gap-1 ${
            activeTool === 'duck' ? 'yellow scale-105 ring-4 ring-amber-300' : 'purple'
          }`}
        >
          <span className="text-2xl sm:text-3xl">🐥</span>
          <span className="text-xs sm:text-sm font-bold">Rubber Duck</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTool('bubble');
            blowBubble();
          }}
          className={`btn-chunky p-2.5 flex flex-col items-center justify-center gap-1 ${
            activeTool === 'bubble' ? 'green scale-105 ring-4 ring-emerald-300' : 'purple'
          }`}
        >
          <span className="text-2xl sm:text-3xl">🫧</span>
          <span className="text-xs sm:text-sm font-bold">Blow Bubbles</span>
        </button>
      </div>
    </div>
  );
}
