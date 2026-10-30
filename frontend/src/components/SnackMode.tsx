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

const SNACK_COLORS = ['var(--rose)', 'var(--daisy)', 'var(--mint)', 'var(--berry)', 'var(--orange)', 'var(--lavender)'];

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
      <div className="surface px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Apple size={28} strokeWidth={1.5} aria-hidden="true" className="shrink-0" style={{ color: 'var(--rose)' }} />
          <div>
            <div className="font-semibold text-base" style={{ color: 'var(--text)' }}>
              Sunny&apos;s Snack Bar
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              Tap a treat to feed Sunny yummy snacks!
            </div>
          </div>
        </div>
        <button onClick={onClose} className="btn-pill primary px-4 text-sm sm:text-base shrink-0">
          <Check size={18} strokeWidth={1.5} aria-hidden="true" /> Done
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {SNACKS.map((snack, i) => {
          const isFeeding = selectedSnack === snack.id;
          return (
            <button
              key={snack.id}
              onClick={() => feedItem(snack)}
              data-selected={isFeeding}
              aria-label={`Feed ${plain(snack.name)}`}
              className="pick-card p-3 min-h-[44px] flex flex-col items-center justify-center text-center"
              style={{ ['--sel' as string]: SNACK_COLORS[i % SNACK_COLORS.length] }}
            >
              <div className="text-4xl sm:text-5xl">{snack.icon}</div>
              <div className="font-semibold text-xs sm:text-sm mt-1.5 leading-tight" style={{ color: 'var(--text)' }}>
                {plain(snack.name)}
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                +{snack.xp} XP
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
