'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Hourglass, RotateCcw, Check, Star, PartyPopper, ChevronLeft, ChevronRight } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface LeafCatcherGameProps {
  onScoreReward: (xp: number) => void;
  onClose: () => void;
}

interface FallingItem {
  id: number;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  speed: number;
  icon: string;
  points: number;
  isStar?: boolean;
}

const ITEMS = [
  { icon: '🌿', points: 10 },
  { icon: '🍓', points: 15 },
  { icon: '🍯', points: 20 },
  { icon: '🫐', points: 10 },
  { icon: '🌸', points: 15 },
  { icon: '⭐', points: 30, isStar: true },
];

export default function LeafCatcherGame({ onScoreReward, onClose }: LeafCatcherGameProps) {
  const [basketX, setBasketX] = useState(50); // percentage 10% - 90%
  const [score, setScore] = useState(0);
  const [catches, setCatches] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [items, setItems] = useState<FallingItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const basketXRef = useRef(50);

  useEffect(() => {
    basketXRef.current = basketX;
  }, [basketX]);

  // Timer countdown
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameOver(true);
          sounds.playGameWin();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  // Falling items spawner
  useEffect(() => {
    if (gameOver) return;
    const spawner = setInterval(() => {
      setItems((prev) => {
        if (prev.length >= 7) return prev;
        const template = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        const newItem: FallingItem = {
          id: nextId.current++,
          x: 12 + Math.random() * 76,
          y: -10,
          speed: 1.1 + Math.random() * 0.9,
          icon: template.icon,
          points: template.points,
          isStar: template.isStar,
        };
        return [...prev, newItem];
      });
    }, 850);
    return () => clearInterval(spawner);
  }, [gameOver]);

  // Game loop & collision detection
  useEffect(() => {
    if (gameOver) return;
    let animId: number;

    const loop = () => {
      setItems((prev) => {
        const nextItems: FallingItem[] = [];
        const currentBasket = basketXRef.current;

        for (const item of prev) {
          const nextY = item.y + item.speed;

          // Check collision with basket near bottom (y between 78% and 88%)
          if (nextY >= 78 && nextY <= 88 && Math.abs(item.x - currentBasket) < 14) {
            // Caught!
            sounds.playCatch();
            setScore((s) => s + item.points);
            setCatches((c) => c + 1);
            continue; // don't add to nextItems
          }

          if (nextY < 105) {
            nextItems.push({ ...item, y: nextY });
          }
        }
        return nextItems;
      });
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameOver]);

  // Mouse / Touch drag to move basket
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setBasketX(Math.min(88, Math.max(12, x)));
  }, []);

  const moveLeft = () => setBasketX((x) => Math.max(12, x - 15));
  const moveRight = () => setBasketX((x) => Math.min(88, x + 15));

  const restart = () => {
    sounds.playClick();
    setScore(0);
    setCatches(0);
    setTimeLeft(30);
    setGameOver(false);
    setItems([]);
    setBasketX(50);
  };

  const starsEarned = score >= 180 ? 3 : score >= 90 ? 2 : 1;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Game Header */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="text-xl sm:text-2xl font-black text-amber-200">
            🧺 Leaf &amp; Berry Catcher! 🍃
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-3 py-1 rounded-2xl bg-emerald-600/30 border-2 border-emerald-400/50 shadow-sm inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-emerald-200" aria-label={`${timeLeft} seconds left`}>
            ⏰ {timeLeft}s
          </div>
          <div className="px-3.5 py-1 rounded-2xl bg-amber-500/30 border-2 border-amber-400/60 shadow-sm inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-amber-200" aria-label={`Score ${score}`}>
            ⭐ {score}
          </div>
        </div>
      </div>

      {/* Game Field */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="relative w-full h-[330px] max-h-[55vh] overflow-hidden select-none touch-none cursor-ew-resize rounded-3xl border-3 border-emerald-400/30 shadow-inner"
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, #1e3a3a 0%, #141b38 100%)',
        }}
      >
        {/* Falling ingredients */}
        {items.map((item) => (
          <div
            key={item.id}
            className={`absolute text-3xl flex items-center justify-center pointer-events-none transition-transform drop-shadow-md ${
              item.isStar ? 'animate-bounce-soft' : ''
            }`}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {item.icon}
          </div>
        ))}

        {/* Player Basket with Sunny */}
        <div
          className="absolute bottom-4 flex flex-col items-center transition-all duration-75 ease-out pointer-events-none"
          style={{
            left: `${basketX}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-3xl animate-bounce-soft">🦥</div>
          <div
            className="px-4 py-2 flex items-center justify-center gap-1.5 text-sm sm:text-base font-black rounded-2xl shadow-lg"
            style={{ background: 'linear-gradient(180deg, #ea580c 0%, #c2410c 100%)', border: '2px solid #fdba74', color: '#ffffff' }}
          >
            <span aria-hidden="true">🧺</span> Tea Basket
          </div>
        </div>

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-30 pointer-events-auto overflow-y-auto rounded-3xl" style={{ background: 'rgba(10,6,28,0.85)', backdropFilter: 'blur(4px)' }}>
            <div className="surface px-6 py-5 text-center max-w-xs w-full animate-pop rounded-3xl" style={{ background: 'var(--surface-solid)' }}>
              <div className="text-5xl animate-bounce mb-1">🎉🧺</div>
              <h3 className="text-2xl font-black text-amber-300">Great Catching!</h3>
              <div className="flex justify-center gap-1.5 my-3" role="img" aria-label={`${starsEarned} out of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <Star key={n} size={32} strokeWidth={2} aria-hidden="true" style={{ color: '#fbbf24' }} fill={n <= starsEarned ? '#fbbf24' : 'none'} className="drop-shadow-md" />
                ))}
              </div>
              <p className="text-base font-black text-amber-200">Caught {catches} treats!</p>
              <p className="text-xl font-black my-2 text-emerald-300">+{score} XP earned! ⭐</p>

              <div className="flex flex-col gap-2.5 mt-2">
                <button onClick={restart} className="btn-pill primary px-5 text-base font-black">
                  <RotateCcw size={18} strokeWidth={2.5} aria-hidden="true" /> Play Again
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onScoreReward(score);
                    onClose();
                  }}
                  className="btn-pill px-5 text-sm font-black text-white"
                >
                  <Check size={18} strokeWidth={2.5} aria-hidden="true" /> Claim Stars &amp; Finish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* On-screen controls for easy touch/mouse play on tablets */}
      <div className="w-full flex items-center justify-between gap-3 mt-3">
        <button
          onClick={moveLeft}
          className="btn-pill flex-1 text-base"
        >
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" /> Left
        </button>
        <span className="text-xs sm:text-sm text-center" style={{ color: 'var(--muted)' }}>
          Drag basket or tap buttons
        </span>
        <button
          onClick={moveRight}
          className="btn-pill flex-1 text-base"
        >
          Right <ChevronRight size={20} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
