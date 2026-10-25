'use client';

import { useState, useEffect, useRef } from 'react';
import { sounds } from '@/lib/soundEffects';

interface BubblePopGameProps {
  onScoreReward: (xp: number) => void;
  onClose: () => void;
}

interface GameBubble {
  id: number;
  x: number;
  y: number;
  speed: number;
  icon: string;
  points: number;
  isGold?: boolean;
}

const ICONS = ['🌿', '🌸', '🍓', '🍯', '🫐', '🍋', '⭐'];

export default function BubblePopGame({ onScoreReward, onClose }: BubblePopGameProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [bubbles, setBubbles] = useState<GameBubble[]>([]);
  const nextId = useRef(1);

  // Countdown timer
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

  // Bubble spawner
  useEffect(() => {
    if (gameOver) return;
    const spawner = setInterval(() => {
      setBubbles((prev) => {
        if (prev.length >= 10) return prev;
        const isGold = Math.random() < 0.22;
        const icon = isGold ? '⭐' : ICONS[Math.floor(Math.random() * (ICONS.length - 1))];
        const newBubble: GameBubble = {
          id: nextId.current++,
          x: 10 + Math.random() * 80,
          y: 105, // start just below bottom
          speed: 0.8 + Math.random() * 0.9,
          icon,
          points: isGold ? 25 : 10,
          isGold,
        };
        return [...prev, newBubble];
      });
    }, 700);
    return () => clearInterval(spawner);
  }, [gameOver]);

  // Bubble animation frame
  useEffect(() => {
    if (gameOver) return;
    let animId: number;
    const update = () => {
      setBubbles((prev) =>
        prev
          .map((b) => ({ ...b, y: b.y - b.speed }))
          .filter((b) => b.y > -15) // remove if escaped off top
      );
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [gameOver]);

  const pop = (b: GameBubble) => {
    sounds.playBubblePop();
    setScore((s) => s + b.points);
    setBubbles((prev) => prev.filter((item) => item.id !== b.id));
    if (b.isGold) {
      sounds.playCatch();
    }
  };

  const restart = () => {
    sounds.playClick();
    setScore(0);
    setTimeLeft(30);
    setGameOver(false);
    setBubbles([]);
  };

  const starsEarned = score >= 200 ? 3 : score >= 100 ? 2 : 1;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Game Header */}
      <div className="w-full flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🫧</span>
          <div className="text-xl font-bold text-sky-900">Bubble Pop Bash!</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="font-bold text-lg bg-white/80 px-3 py-1 rounded-full border-2 border-sky-300">
            ⏳ {timeLeft}s
          </div>
          <div className="font-bold text-lg bg-white/80 px-3 py-1 rounded-full border-2 border-amber-300 text-amber-700">
            ⭐ {score}
          </div>
        </div>
      </div>

      {/* Game Playfield */}
      <div className="relative w-full h-[360px] rounded-3xl overflow-hidden bg-gradient-to-b from-sky-200 via-purple-100 to-pink-100 border-4 border-sky-300 shadow-inner select-none">
        {bubbles.map((b) => (
          <button
            key={b.id}
            onClick={() => pop(b)}
            className={`absolute rounded-full flex items-center justify-center cursor-pointer transition transform hover:scale-115 active:scale-90 ${
              b.isGold
                ? 'bg-gradient-to-tr from-amber-200/90 to-yellow-100/95 border-3 border-amber-400 shadow-lg shadow-amber-300/50 animate-pulse'
                : 'bg-gradient-to-tr from-white/70 via-sky-100/80 to-pink-100/80 border-2 border-white shadow-md'
            }`}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.isGold ? '62px' : '54px',
              height: b.isGold ? '62px' : '54px',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="text-2xl pointer-events-none">{b.icon}</span>
            <span className="absolute top-1.5 left-2 w-2 h-2 rounded-full bg-white/90" />
          </button>
        ))}

        {gameOver && (
          <div className="absolute inset-0 bg-purple-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-30">
            <div className="toy-card px-6 py-5 text-center max-w-xs w-full animate-pop bg-white">
              <div className="text-5xl mb-2">🎉</div>
              <h3 className="text-2xl font-bold text-purple-900">Time Up!</h3>
              <div className="text-3xl my-2">{'⭐'.repeat(starsEarned)}</div>
              <p className="text-lg font-bold text-amber-600 mb-1">Score: {score} points</p>
              <p className="text-sm font-semibold opacity-80 mb-4">
                +{score} XP added to your tea party level!
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={restart}
                  className="btn-chunky green py-2.5 text-base font-bold"
                >
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

      <div className="mt-3 text-xs sm:text-sm font-semibold text-center opacity-80">
        👆 Tap bubbles before they float away! Golden stars ⭐ give +25 points!
      </div>
    </div>
  );
}
