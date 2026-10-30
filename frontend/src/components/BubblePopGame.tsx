'use client';

import { useState, useEffect, useRef } from 'react';
import { Hourglass, RotateCcw, Check, Star, PartyPopper, Hand } from 'lucide-react';
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
          <div className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Bubble Pop Bash!</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 min-h-[36px] inline-flex items-center gap-1.5 rounded-full text-sm sm:text-base font-semibold" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} aria-label={`${timeLeft} seconds left`}>
            <Hourglass size={18} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--berry)' }} /> {timeLeft}s
          </div>
          <div className="px-3 min-h-[36px] inline-flex items-center gap-1.5 rounded-full text-sm sm:text-base font-semibold" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }} aria-label={`Score ${score}`}>
            <Star size={18} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--daisy)' }} /> {score}
          </div>
        </div>
      </div>

      {/* Game Playfield */}
      <div className="relative w-full h-[360px] max-h-[55vh] overflow-hidden select-none"
        style={{
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-strong)',
          background: 'linear-gradient(180deg, #1d1442, #33194f 60%, #4a2060)',
        }}>
        {bubbles.map((b) => (
          <button
            key={b.id}
            onClick={() => pop(b)}
            aria-label={b.isGold ? 'Pop golden star bubble' : 'Pop bubble'}
            className={`absolute rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 ease-out active:scale-90 ${
              b.isGold ? 'animate-pulse' : ''
            }`}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.isGold ? '62px' : '54px',
              height: b.isGold ? '62px' : '54px',
              transform: 'translate(-50%, -50%)',
              background: b.isGold
                ? 'radial-gradient(circle at 30% 30%, rgba(255,240,190,0.9), rgba(255,216,115,0.55))'
                : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), rgba(143,180,255,0.3) 60%, rgba(255,158,196,0.3))',
              border: b.isGold ? '2px solid var(--daisy)' : '1.5px solid rgba(255,255,255,0.7)',
            }}
          >
            <span className="text-2xl pointer-events-none">{b.icon}</span>
            <span className="absolute top-1.5 left-2 w-2 h-2 rounded-full bg-white/90" />
          </button>
        ))}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-30 overflow-y-auto" style={{ background: 'rgba(10,6,28,0.7)' }}>
            <div className="surface px-6 py-5 text-center max-w-xs w-full animate-pop" style={{ background: 'var(--surface-solid)' }}>
              <PartyPopper size={36} strokeWidth={1.5} aria-hidden="true" className="mx-auto mb-2" style={{ color: 'var(--accent)' }} />
              <h3 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Time Up!</h3>
              <div className="flex justify-center gap-1 my-3" role="img" aria-label={`${starsEarned} out of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <Star key={n} size={28} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--daisy)' }} fill={n <= starsEarned ? 'var(--daisy)' : 'none'} />
                ))}
              </div>
              <p className="text-lg font-semibold mb-1" style={{ color: 'var(--daisy)' }}>Score: {score} points</p>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                +{score} XP added to your tea party level!
              </p>

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

      <div className="mt-3 text-xs sm:text-sm text-center inline-flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
        <Hand size={16} strokeWidth={1.5} aria-hidden="true" /> Tap bubbles before they float away! Golden star bubbles give +25 points!
      </div>
    </div>
  );
}
