'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
          <span className="text-3xl">🧺</span>
          <div className="text-xl font-bold text-sky-900">Leaf Catcher!</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-bold text-sm sm:text-base bg-white/80 px-3 py-1 rounded-full border-2 border-emerald-300">
            ⏳ {timeLeft}s
          </div>
          <div className="font-bold text-sm sm:text-base bg-white/80 px-3 py-1 rounded-full border-2 border-amber-300 text-amber-700">
            ⭐ {score}
          </div>
        </div>
      </div>

      {/* Game Field */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        className="relative w-full h-[330px] rounded-3xl overflow-hidden bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-100 border-4 border-emerald-300 shadow-inner select-none cursor-ew-resize"
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
          className="absolute bottom-4 flex flex-col items-center transition-all duration-75 pointer-events-none"
          style={{
            left: `${basketX}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="text-3xl animate-bounce-soft">🦥</div>
          <div className="px-4 py-2 bg-amber-600 border-3 border-amber-300 rounded-2xl shadow-lg flex items-center justify-center text-white font-bold text-sm sm:text-base">
            🧺 Tea Basket
          </div>
        </div>

        {gameOver && (
          <div className="absolute inset-0 bg-purple-950/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-4 z-30 pointer-events-auto">
            <div className="toy-card px-6 py-5 text-center max-w-xs w-full animate-pop bg-white">
              <div className="text-5xl mb-2">🎉</div>
              <h3 className="text-2xl font-bold text-emerald-900">Tea Time!</h3>
              <div className="text-3xl my-2">{'⭐'.repeat(starsEarned)}</div>
              <p className="text-base font-bold text-amber-600">Caught {catches} treats!</p>
              <p className="text-sm font-semibold opacity-80 my-1">Score: {score} points</p>
              <p className="text-sm font-bold text-emerald-600 mb-3">+{score} XP earned!</p>

              <div className="flex flex-col gap-2">
                <button onClick={restart} className="btn-chunky green py-2.5 text-base font-bold">
                  🔄 Play Again
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onScoreReward(score);
                    onClose();
                  }}
                  className="btn-chunky blue py-2 text-sm font-bold"
                >
                  ✓ Finish & Claim Stars
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
          className="btn-chunky blue flex-1 py-3 text-lg font-bold flex items-center justify-center gap-1"
        >
          ◀ Left
        </button>
        <span className="text-xs sm:text-sm font-semibold opacity-75 text-center">
          Drag basket or tap buttons
        </span>
        <button
          onClick={moveRight}
          className="btn-chunky blue flex-1 py-3 text-lg font-bold flex items-center justify-center gap-1"
        >
          Right ▶
        </button>
      </div>
    </div>
  );
}
