'use client';

import { useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';
import BubblePopGame from '@/components/BubblePopGame';
import MemoryMatchGame from '@/components/MemoryMatchGame';
import LeafCatcherGame from '@/components/LeafCatcherGame';

interface MiniGamesModalProps {
  onScoreReward: (xp: number) => void;
  onClose: () => void;
}

type SelectedGame = null | 'bubble' | 'memory' | 'catcher';

const GAMES = [
  {
    id: 'bubble',
    emoji: '🫧',
    title: 'Bubble Pop!',
    desc: 'Tap and pop floating bubbles & golden stars!',
    color: 'var(--berry)',
  },
  {
    id: 'memory',
    emoji: '🃏',
    title: 'Friends Match',
    desc: 'Find matching pairs of cute forest animals!',
    color: 'var(--lavender)',
  },
  {
    id: 'catcher',
    emoji: '🧺',
    title: 'Leaf Catcher',
    desc: 'Slide the tea basket to catch falling berries!',
    color: 'var(--mint)',
  },
] as const;

export default function MiniGamesModal({ onScoreReward, onClose }: MiniGamesModalProps) {
  const [selectedGame, setSelectedGame] = useState<SelectedGame>(null);

  return (
    <div className="w-full">
      {selectedGame === null ? (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <p className="text-base sm:text-lg" style={{ color: 'var(--text)' }}>
              Pick a fun mini-game to play with Sunny and earn stars!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedGame(g.id);
                }}
                className="pick-card p-4 flex flex-col items-center text-center"
                style={{ ['--sel' as string]: g.color }}
              >
                {/* game sprite: decorative emoji preview of the playfield */}
                <div className="text-5xl animate-bounce-soft" aria-hidden="true">
                  {g.emoji}
                </div>
                <div className="font-semibold text-lg mt-2" style={{ color: 'var(--text)' }}>
                  {g.title}
                </div>
                <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  {g.desc}
                </div>
                <div
                  className="mt-3 px-4 min-h-[44px] inline-flex items-center gap-1.5 rounded-full text-sm font-semibold"
                  style={{ background: `color-mix(in srgb, ${g.color} 22%, transparent)`, color: 'var(--text)' }}
                >
                  <Play size={16} strokeWidth={1.5} aria-hidden="true" /> Play Game
                </div>
              </button>
            ))}
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
              className="btn-pill px-4 text-sm"
            >
              <ArrowLeft size={18} strokeWidth={1.5} aria-hidden="true" /> Back to Games Menu
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
