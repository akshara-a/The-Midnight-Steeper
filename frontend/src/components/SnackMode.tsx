'use client';

import { useState } from 'react';
import { Apple, Check } from 'lucide-react';
import { sounds } from '@/lib/soundEffects';
import { SNACKS, SnackItem } from '@/lib/kidsContent';
import { plain } from '@/components/ui';

interface SnackModeProps {
  onFeed: (snack: SnackItem) => void;
  onClose: () => void;
}

const SNACK_COLORS = ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#f97316', '#a855f7'];

export default function SnackMode({ onFeed, onClose }: SnackModeProps) {
  const [selectedSnack, setSelectedSnack] = useState<string | null>(null);

  const feedItem = (snack: SnackItem) => {
    setSelectedSnack(snack.id);
    sounds.playNom();
    onFeed(snack);
    setTimeout(() => setSelectedSnack(null), 1000);
  };

  return (
    <div className="flex flex-col gap-3.5 w-full animate-modal">
      <div className="surface px-4 py-3 flex items-center justify-between gap-3 rounded-3xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-3xl bg-rose-500/30 border-2 border-rose-400/50 shadow-inner">
            🍓
          </div>
          <div>
            <div className="font-black text-lg text-amber-200">
              Sunny&apos;s Snack Bar! 🍪
            </div>
            <div className="text-xs font-bold text-white/80">
              Tap any yummy treat to feed Sunny and earn stars!
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="btn-pill primary px-5 py-2 text-sm sm:text-base font-black shrink-0"
        >
          <Check size={20} strokeWidth={3} aria-hidden="true" /> Done
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {SNACKS.map((snack, i) => {
          const isFeeding = selectedSnack === snack.id;
          const color = SNACK_COLORS[i % SNACK_COLORS.length];
          return (
            <button
              key={snack.id}
              onClick={() => feedItem(snack)}
              data-selected={isFeeding}
              aria-label={`Feed ${plain(snack.name)}`}
              className={`pick-card p-3 min-h-[120px] flex flex-col items-center justify-center text-center transition-all ${
                isFeeding ? 'scale-110 rotate-3' : 'hover:scale-105'
              }`}
              style={{ ['--sel' as string]: color }}
            >
              <div className="text-4xl sm:text-5xl drop-shadow-md animate-bounce-soft">{snack.icon}</div>
              <div className="font-black text-xs sm:text-sm mt-2 leading-tight text-white">
                {plain(snack.name)}
              </div>
              <div className="text-[11px] font-black mt-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 shadow-sm">
                +{snack.xp} XP ⭐
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
