'use client';

import { useState } from 'react';
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
      <div className="w-full flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🃏</span>
          <div className="text-xl font-bold text-sky-900">Forest Friends Match</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-bold text-sm sm:text-base bg-white/80 px-3 py-1 rounded-full border-2 border-purple-300">
            Pairs: {matches}/{PAIRS.length}
          </div>
          <div className="font-bold text-sm sm:text-base bg-white/80 px-3 py-1 rounded-full border-2 border-amber-300 text-amber-700">
            Moves: {moves}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="relative w-full p-3 rounded-3xl bg-purple-100/80 border-4 border-purple-300 shadow-inner">
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {cards.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => flipCard(idx)}
              disabled={c.isMatched || c.isFlipped}
              className={`h-20 sm:h-24 rounded-2xl border-4 text-3xl sm:text-4xl flex items-center justify-center transition-all duration-300 transform select-none cursor-pointer ${
                c.isFlipped || c.isMatched
                  ? 'bg-white border-pink-400 rotate-0 shadow-md scale-100'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-white text-white hover:scale-105 active:scale-95 shadow-lg'
              }`}
            >
              {c.isFlipped || c.isMatched ? (
                <span className="animate-pop">{c.icon}</span>
              ) : (
                <span className="text-2xl opacity-80">🍃</span>
              )}
            </button>
          ))}
        </div>

        {/* Victory Screen */}
        {isWon && (
          <div className="absolute inset-0 bg-purple-950/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-4 z-30">
            <div className="toy-card px-6 py-5 text-center max-w-xs w-full animate-pop bg-white">
              <div className="text-5xl mb-2">🏆</div>
              <h3 className="text-2xl font-bold text-purple-900">You Found All Friends!</h3>
              <div className="text-3xl my-2">{'⭐'.repeat(starsEarned)}</div>
              <p className="text-sm font-semibold opacity-80">Completed in {moves} moves!</p>
              <p className="text-base font-bold text-emerald-600 my-2">+{rewardXP} Stars XP!</p>

              <div className="flex flex-col gap-2 mt-2">
                <button onClick={restart} className="btn-chunky green py-2.5 text-base font-bold">
                  🔄 Play Again
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onScoreReward(rewardXP);
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
        Tap two cards to find matching pairs of forest friends! 🐰🦊🐻
      </div>
    </div>
  );
}
