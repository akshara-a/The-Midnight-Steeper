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
      <div className="w-full flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="text-xl font-semibold" style={{ color: 'var(--text)' }}>Forest Friends Match</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 min-h-[36px] inline-flex items-center gap-1.5 rounded-full text-sm sm:text-base font-semibold" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            <Layers size={18} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--lavender)' }} /> Pairs: {matches}/{PAIRS.length}
          </div>
          <div className="px-3 min-h-[36px] inline-flex items-center gap-1.5 rounded-full text-sm sm:text-base font-semibold" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            Moves: {moves}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="relative w-full p-3"
        style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-strong)', background: 'linear-gradient(180deg, #1d1442, #33194f)' }}>
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {cards.map((c, idx) => (
            <button
              key={c.id}
              onClick={() => flipCard(idx)}
              disabled={c.isMatched || c.isFlipped}
              aria-label={c.isFlipped || c.isMatched ? c.name : 'Hidden card'}
              className={`h-20 sm:h-24 min-h-[44px] text-3xl sm:text-4xl flex items-center justify-center transition-all duration-200 ease-out select-none cursor-pointer disabled:opacity-100 ${
                c.isFlipped || c.isMatched ? '' : 'hover:-translate-y-0.5 active:scale-95'
              }`}
              style={{
                borderRadius: 'var(--radius)',
                border: c.isMatched ? '1.5px solid var(--mint)' : c.isFlipped ? '1.5px solid var(--accent)' : '1.5px solid var(--border-strong)',
                background: c.isFlipped || c.isMatched ? 'color-mix(in srgb, var(--accent) 22%, var(--surface-solid))' : 'var(--surface)',
              }}
            >
              {c.isFlipped || c.isMatched ? (
                <span className="animate-pop">{c.icon}</span>
              ) : (
                <span className="text-2xl opacity-50" aria-hidden="true">🍃</span>
              )}
            </button>
          ))}
        </div>

        {/* Victory Screen */}
        {isWon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-30 overflow-y-auto" style={{ background: 'rgba(10,6,28,0.7)', borderRadius: 'var(--radius-lg)' }}>
            <div className="surface px-6 py-5 text-center max-w-xs w-full animate-pop" style={{ background: 'var(--surface-solid)' }}>
              <Trophy size={36} strokeWidth={1.5} aria-hidden="true" className="mx-auto mb-2" style={{ color: 'var(--daisy)' }} />
              <h3 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>You Found All Friends!</h3>
              <div className="flex justify-center gap-1 my-3" role="img" aria-label={`${starsEarned} out of 3 stars`}>
                {[1, 2, 3].map((n) => (
                  <Star key={n} size={28} strokeWidth={1.5} aria-hidden="true" style={{ color: 'var(--daisy)' }} fill={n <= starsEarned ? 'var(--daisy)' : 'none'} />
                ))}
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Completed in {moves} moves!</p>
              <p className="text-base font-semibold my-2" style={{ color: 'var(--mint)' }}>+{rewardXP} Stars XP!</p>

              <div className="flex flex-col gap-2 mt-2">
                <button onClick={restart} className="btn-pill primary px-5 text-base">
                  <RotateCcw size={18} strokeWidth={1.5} aria-hidden="true" /> Play Again
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    onScoreReward(rewardXP);
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

      <div className="mt-3 text-xs sm:text-sm text-center" style={{ color: 'var(--muted)' }}>
        Tap two cards to find matching pairs of forest friends!
      </div>
    </div>
  );
}
