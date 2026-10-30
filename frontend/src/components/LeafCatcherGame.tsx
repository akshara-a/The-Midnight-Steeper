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
      <div className="w-full flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Leaf Catcher!</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 min-h-[36px] inline-flex items-center gap-1.5 rounded-full text-sm sm:text-base font-semibold" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} aria-label={`${timeLeft} seconds left`}>
            <Hourglass size={18} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--mint)' }} /> {timeLeft}s
          </div>
          <div className="px-3 min-h-[36px] inline-flex items-center gap-1.5 rounded-full text-sm sm:text-base font-semibold" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} aria-label={`Score ${score}`}>
            <Star size={18} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--daisy)' }} /> {score}
          </div>
        </div>
      </div>

      {/* Game Field */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="relative w-full h-[330px] max-h-[55vh] overflow-hidden select-none touch-none cursor-ew-resize"
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-strong)',
          background: 'linear-gradient(180deg, #1d1442, #1f2f4f 65%, #264a4a)',
        }}
      >
        {/* Falling ingredients */}
        {items.map((item) => (
          <div
            key={item.id}
            className={`absolute text-3xl flex items-center justify-center pointer-events-none transition-transform ${
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
            className="px-4 py-2 flex items-center justify-center gap-1.5 text-sm sm:text-base font-semibold"
            style={{ background: 'var(--surface-solid)', border: '1.5px solid var(--orange)', borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
          >
            <span aria-hidden="true">🧺</span> Tea Basket
          </div>
        </div>

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-30 pointer-events-auto overflow-y-auto" style={{ background: 'rgba(10,6,28,0.7)' }}>
            <div className="surface px-6 py-5 text-center max-w-xs w-full animate-pop" style={{ background: 'var(--surface-solid)' }}>
              <PartyPopper size={36} strokeWidth={1.5} aria-hidden="true" className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
              <h3 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Tea Time!</h3>
              <div className="flex justify-center gap-1 my-3" role="img" aria-label={`${starsEarned} out of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <Star key={n} size={28} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--daisy)' }} fill={n <= starsEarned ? 'var(--daisy)' : 'none'} />
                ))}
              </div>
              <p className="text-base font-semibold" style={{ color: 'var(--daisy)' }}>Caught {catches} treats!</p>
              <p className="text-sm my-1" style={{ color: 'var(--muted)' }}>Score: {score} points</p>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--mint)' }}>+{score} XP earned!</p>

              <div className="flex flex-col gap-2">
                <button onClick={restart} className="btn-pill primary px-5 text-base">
                  <RotateCcw size={18} strokeWidth={1.5} aria-hidden="true" /> Play Again
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onScoreReward(score);
                    onClose();
                  }}
                  className="btn-pill px-5 text-sm"
                >
                  <Check size={18} strokeWidth={1.5} aria-hidden="true" /> Finish &amp; Claim Stars
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
