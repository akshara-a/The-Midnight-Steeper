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
    desc: 'Tap and pop floating bubbles & shiny golden stars!',
    color: '#06b6d4',
    bg: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(14, 116, 144, 0.45) 100%)',
    btnColor: 'linear-gradient(180deg, #67e8f9 0%, #06b6d4 100%)',
    btnShadow: '#0e7490',
  },
  {
    id: 'memory',
    emoji: '🃏',
    title: 'Friends Match',
    desc: 'Flip cards and find matching pairs of cute forest animals!',
    color: '#a855f7',
    bg: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(126, 34, 206, 0.45) 100%)',
    btnColor: 'linear-gradient(180deg, #d8b4fe 0%, #a855f7 100%)',
    btnShadow: '#6b21a8',
  },
  {
    id: 'catcher',
    emoji: '🧺',
    title: 'Leaf Catcher',
    desc: 'Slide the cozy tea basket to catch falling berries & leaves!',
    color: '#10b981',
    bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(4, 120, 87, 0.45) 100%)',
    btnColor: 'linear-gradient(180deg, #6ee7b7 0%, #10b981 100%)',
    btnShadow: '#047857',
  },
] as const;

export default function MiniGamesModal({ onScoreReward, onClose }: MiniGamesModalProps) {
  const [selectedGame, setSelectedGame] = useState<SelectedGame>(null);

  return (
    <div className="w-full">
      {selectedGame === null ? (
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <h3 className="text-2xl font-black text-indigo-950">
              🎮 Sunny&apos;s Arcade! 🌟
            </h3>
            <p className="text-sm font-bold text-indigo-900/70 mt-1">
              Pick a fun mini-game to play with Sunny and earn bonus stars!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  sounds.playClick();
                  setSelectedGame(g.id);
                }}
                className="pick-card p-4.5 flex flex-col items-center text-center rounded-3xl"
                style={{ ['--sel' as string]: g.color }}
              >
                <div className="w-18 h-18 rounded-3xl flex items-center justify-center text-5xl animate-bounce-soft shadow-inner my-2" style={{ background: g.bg, border: `2.5px solid ${g.color}` }}>
                  {g.emoji}
                </div>
                <div className="font-black text-xl mt-2 text-indigo-950">
                  {g.title}
                </div>
                <div className="text-xs font-semibold mt-1 text-slate-600 leading-relaxed px-1">
                  {g.desc}
                </div>
                <div
                  className="mt-4 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-white shadow-md transition-transform hover:scale-105"
                  style={{
                    background: g.btnColor,
                    boxShadow: `0 4px 0 ${g.btnShadow}, 0 6px 12px rgba(0,0,0,0.3)`,
                    border: '1.5px solid #ffffff',
                  }}
                >
                  <Play size={14} strokeWidth={3} aria-hidden="true" /> Play Game!
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
              className="btn-pill px-5 text-sm font-black text-indigo-950"
            >
              <ArrowLeft size={18} strokeWidth={2.5} aria-hidden="true" /> Back to Arcade Menu 🎮
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
