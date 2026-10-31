'use client';

import { useState } from 'react';
import { RotateCcw, Check, Star, Trophy, Layers } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';

interface MemoryMatchGameProps {
  onScoreReward: (xp: number) => void;
  onClose: () => void;
}

interface Card {
  id: number;
  pairId: number;
  icon: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const PAIRS = [
  { pairId: 1, icon: '🐰', name: 'Bunny' },
  { pairId: 2, icon: '🦊', name: 'Fox' },
  { pairId: 3, icon: '🐻', name: 'Bear' },
  { pairId: 4, icon: '🦉', name: 'Owl' },
  { pairId: 5, icon: '🐸', name: 'Frog' },
  { pairId: 6, icon: '🐧', name: 'Penguin' },
];

function createDeck(): Card[] {
  const cards: Card[] = [];
  let id = 1;
  PAIRS.forEach((item) => {
    // Two of each
    cards.push({ id: id++, ...item, isFlipped: false, isMatched: false });
    cards.push({ id: id++, ...item, isFlipped: false, isMatched: false });
  });
  // Shuffle
  return cards.sort(() => Math.random() - 0.5);
}

export default function MemoryMatchGame({ onScoreReward, onClose }: MemoryMatchGameProps) {
  const [cards, setCards] = useState<Card[]>(() => createDeck());
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isWon, setIsWon] = useState(false);

  const flipCard = (index: number) => {
    if (isLocked) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    sounds.playClick();
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selected, index];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      setIsLocked(true);
      const [firstIdx, secondIdx] = newSelected;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        // Match!
        setTimeout(() => {
          sounds.playMatchSuccess();
          const matchedCards = [...newCards];
          matchedCards[firstIdx].isMatched = true;
          matchedCards[secondIdx].isMatched = true;
          setCards(matchedCards);
          setSelected([]);
          setIsLocked(false);
          const newMatches = matches + 1;
          setMatches(newMatches);

          if (newMatches === PAIRS.length) {
            setIsWon(true);
            sounds.playAchievement();
            sounds.playGameWin();
          }
        }, 400);
      } else {
        // Mismatch
        setTimeout(() => {
          sounds.playMatchFail();
          const resetCards = [...newCards];
          resetCards[firstIdx].isFlipped = false;
          resetCards[secondIdx].isFlipped = false;
          setCards(resetCards);
          setSelected([]);
          setIsLocked(false);
        }, 900);
      }
    }
  };

  const restart = () => {
    sounds.playClick();
    setCards(createDeck());
    setSelected([]);
    setMoves(0);
    setMatches(0);
    setIsLocked(false);
    setIsWon(false);
  };

  const starsEarned = moves <= 9 ? 3 : moves <= 14 ? 2 : 1;
  const rewardXP = 80 + starsEarned * 20;

  return (
    <div className="flex flex-col items-center w-full">
      {/* Game Header */}
      {/* Game Header */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="text-xl sm:text-2xl font-black text-amber-200">
            🃏 Forest Friends Match! 🐰
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-3 py-1 rounded-2xl bg-purple-600/30 border-2 border-purple-400/50 shadow-sm inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-purple-200">
            ✨ Pairs: {matches}/{PAIRS.length}
          </div>
          <div className="px-3.5 py-1 rounded-2xl bg-amber-500/30 border-2 border-amber-400/60 shadow-sm inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-amber-200">
            🎯 Moves: {moves}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="relative w-full p-3.5 rounded-3xl border-3 border-purple-200 shadow-inner"
        style={{ background: 'radial-gradient(ellipse at 50% 100%, #f5f3ff 0%, #fdf2f8 100%)' }}>
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5">
          {cards.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => flipCard(idx)}
              disabled={c.isMatched || c.isFlipped}
              aria-label={c.isFlipped || c.isMatched ? c.name : 'Hidden card'}
              className={`h-20 sm:h-24 min-h-[48px] text-3xl sm:text-4xl flex items-center justify-center transition-all duration-200 ease-out select-none cursor-pointer disabled:opacity-100 rounded-2xl ${
                c.isFlipped || c.isMatched
                  ? 'scale-105 shadow-md'
                  : 'hover:-translate-y-1 active:scale-95 shadow-sm'
              }`}
              style={{
                border: c.isMatched ? '3px solid #34d399' : c.isFlipped ? '3px solid #facc15' : '2.5px solid #c4b5fd',
                background: c.isMatched
                  ? 'linear-gradient(135deg, #a7f3d0 0%, #34d399 100%)'
                  : c.isFlipped
                  ? 'linear-gradient(135deg, #fef08a 0%, #facc15 100%)'
                  : 'linear-gradient(145deg, #c4b5fd 0%, #8b5cf6 100%)',
                boxShadow: c.isMatched ? '0 0 16px rgba(52, 211, 153, 0.6)' : '0 4px 0 #7c3aed',
              }}
            >
              {c.isFlipped || c.isMatched ? (
                <span className="animate-pop drop-shadow-md">{c.icon}</span>
              ) : (
                <span className="text-2xl drop-shadow-sm select-none" aria-hidden="true">⭐</span>
              )}
            </button>
          ))}
        </div>

        {/* Victory Screen */}
        {isWon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-30 overflow-y-auto rounded-3xl" style={{ background: 'rgba(10,6,28,0.85)', backdropFilter: 'blur(4px)' }}>
            <div className="surface px-6 py-5 text-center max-w-xs w-full animate-pop rounded-3xl" style={{ background: 'var(--surface-solid)' }}>
              <div className="text-5xl animate-bounce mb-1">🏆🎉</div>
              <h3 className="text-2xl font-black text-amber-300">You Found All Friends!</h3>
              <div className="flex justify-center gap-1.5 my-3" role="img" aria-label={`${starsEarned} out of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <Star key={n} size={32} strokeWidth={2} aria-hidden="true" style={{ color: '#fbbf24' }} fill={n <= starsEarned ? '#fbbf24' : 'none'} className="drop-shadow-md" />
                ))}
              </div>
              <p className="text-xs font-bold text-white/80">Completed in {moves} moves!</p>
              <p className="text-xl font-black my-2 text-emerald-300">+{rewardXP} Stars XP! ⭐</p>

              <div className="flex flex-col gap-2.5 mt-2">
                <button onClick={restart} className="btn-pill primary px-5 text-base font-black">
                  <RotateCcw size={18} strokeWidth={2.5} aria-hidden="true" /> Play Again
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onScoreReward(rewardXP);
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

      <div className="mt-3 text-xs sm:text-sm text-center" style={{ color: 'var(--muted)' }}>
        Tap two cards to find matching pairs of forest friends!
      </div>
    </div>
  );
}
