'use client';

import { useState } from 'react';
import { sounds } from '@/lib/soundEffects';
import BubblePopGame from '@/components/BubblePopGame';
import MemoryMatchGame from '@/components/MemoryMatchGame';
import LeafCatcherGame from '@/components/LeafCatcherGame';

interface MiniGamesModalProps {
  onScoreReward: (xp: number) => void;
  onClose: () => void;
}

type SelectedGame = null | 'bubble' | 'memory' | 'catcher';

export default function MiniGamesModal({ onScoreReward, onClose }: MiniGamesModalProps) {
  const [selectedGame, setSelectedGame] = useState<SelectedGame>(null);

  return (
    <div className="w-full">
      {selectedGame === null ? (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <p className="text-base sm:text-lg font-semibold text-[#3b2a63]">
              Pick a fun mini-game to play with Sunny and earn stars! ⭐
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Game 1: Bubble Pop */}
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedGame('bubble');
              }}
              className="pick-card p-4 flex flex-col items-center text-center hover:scale-105 active:scale-95 transition bg-gradient-to-b from-sky-50 to-pink-50 border-4 border-sky-300"
            >
              <div className="text-5xl animate-bounce-soft">🫧</div>
              <div className="font-bold text-lg text-sky-900 mt-2">Bubble Pop!</div>
              <div className="text-xs font-semibold text-sky-700/80 mt-1">
                Tap and pop floating bubbles & golden stars!
              </div>
              <div className="mt-3 px-3 py-1 rounded-full bg-sky-200 text-sky-900 text-xs font-bold">
                ▶ Play Game
              </div>
            </button>

            {/* Game 2: Forest Friends Match */}
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedGame('memory');
              }}
              className="pick-card p-4 flex flex-col items-center text-center hover:scale-105 active:scale-95 transition bg-gradient-to-b from-purple-50 to-indigo-50 border-4 border-purple-300"
            >
              <div className="text-5xl animate-bounce-soft">🃏</div>
              <div className="font-bold text-lg text-purple-900 mt-2">Friends Match</div>
              <div className="text-xs font-semibold text-purple-700/80 mt-1">
                Find matching pairs of cute forest animals!
              </div>
              <div className="mt-3 px-3 py-1 rounded-full bg-purple-200 text-purple-900 text-xs font-bold">
                ▶ Play Game
              </div>
            </button>

            {/* Game 3: Leaf Catcher */}
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedGame('catcher');
              }}
              className="pick-card p-4 flex flex-col items-center text-center hover:scale-105 active:scale-95 transition bg-gradient-to-b from-emerald-50 to-amber-50 border-4 border-emerald-300"
            >
              <div className="text-5xl animate-bounce-soft">🧺</div>
              <div className="font-bold text-lg text-emerald-900 mt-2">Leaf Catcher</div>
              <div className="text-xs font-semibold text-emerald-700/80 mt-1">
                Slide the tea basket to catch falling berries!
              </div>
              <div className="mt-3 px-3 py-1 rounded-full bg-emerald-200 text-emerald-900 text-xs font-bold">
                ▶ Play Game
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex justify-start">
            <button
              onClick={() => {
                sounds.playClick();
                setSelectedGame(null);
              }}
              className="btn-chunky blue px-4 py-2 text-sm font-bold flex items-center gap-1"
            >
              ← Back to Games Menu
            </button>
          </div>

          {selectedGame === 'bubble' && (
            <BubblePopGame onScoreReward={onScoreReward} onClose={onClose} />
          )}
          {selectedGame === 'memory' && (
            <MemoryMatchGame onScoreReward={onScoreReward} onClose={onClose} />
          )}
          {selectedGame === 'catcher' && (
            <LeafCatcherGame onScoreReward={onScoreReward} onClose={onClose} />
          )}
        </div>
      )}
    </div>
  );
}
