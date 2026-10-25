'use client';

import { useState } from 'react';
import { sounds } from '@/lib/soundEffects';
import { SNACKS, SnackItem } from '@/lib/kidsContent';

interface SnackModeProps {
  onFeed: (snack: SnackItem) => void;
  onClose: () => void;
}

export default function SnackMode({ onFeed, onClose }: SnackModeProps) {
  const [selectedSnack, setSelectedSnack] = useState<string | null>(null);

  const feedItem = (snack: SnackItem) => {
    setSelectedSnack(snack.id);
    sounds.playNom();
    onFeed(snack);
    setTimeout(() => setSelectedSnack(null), 1000);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="toy-card px-4 py-3 flex items-center justify-between gap-3 bg-amber-100/90 border-amber-300">
        <div className="flex items-center gap-2">
          <span className="text-3xl animate-bounce-soft">🍓</span>
          <div>
            <div className="font-bold text-base text-amber-950">Sunny&apos;s Snack Bar</div>
            <div className="text-xs font-semibold text-amber-800">
              Tap a treat to feed Sunny yummy snacks!
            </div>
          </div>
        </div>
        <button onClick={onClose} className="btn-chunky green px-4 py-2 text-sm sm:text-base font-bold shrink-0">
          ✓ Done
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {SNACKS.map((snack) => {
          const isFeeding = selectedSnack === snack.id;
          return (
            <button
              key={snack.id}
              onClick={() => feedItem(snack)}
              className={`pick-card p-3 flex flex-col items-center justify-center text-center transition transform hover:scale-110 active:scale-95 bg-white/90 ${
                isFeeding ? 'scale-125 border-amber-400 bg-amber-50 animate-bounce' : ''
              }`}
            >
              <div className="text-4xl sm:text-5xl">{snack.icon}</div>
              <div className="font-bold text-xs sm:text-sm text-[#3b2a63] mt-1.5 leading-tight">
                {snack.name}
              </div>
              <div className="text-[10px] font-bold text-amber-600 mt-0.5">+{snack.xp} XP</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
