'use client';

import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { evaluateTabPFN, type TabPFNResult } from '@/lib/tabpfn';
import { NAPS } from '@/lib/kidsContent';
import { NapIcon, plain } from '@/components/ui';

interface AlchemistCrystalBallProps {
  leafName: string;
  treatName: string;
  napKey: string;
  streak: number;
  careXP?: number;
  onSelectNap?: (key: string) => void;
  onClose?: () => void;
}

export function AlchemistCrystalBall({
  leafName,
  treatName,
  napKey,
  streak,
  careXP = 20,
  onSelectNap,
  onClose,
}: AlchemistCrystalBallProps) {
  const [whatIfNap, setWhatIfNap] = useState<string | null>(null);
  const [showSensory, setShowSensory] = useState(false);

  const activeNapKey = whatIfNap ?? napKey;
  const activeNap = NAPS.find((n) => n.key === activeNapKey) ?? NAPS[0];

  const durationSeconds = useMemo(() => {
    switch (activeNapKey) {
      case 'demo':
        return 10;
      case 'quick':
        return 120;
      case '1h':
        return 3600;
      case '4h':
        return 14400;
      case '12h':
        return 43200;
      default:
        return 10;
    }
  }, [activeNapKey]);

  const prediction: TabPFNResult = useMemo(() => {
    return evaluateTabPFN({
      ingredients: [leafName, treatName],
      durationSeconds,
      streak,
      careXP,
    });
  }, [leafName, treatName, durationSeconds, streak, careXP]);

  const { probabilities, mystery_index, sensory, sleepiness_score, attributions, sunny_quote } = prediction;

  const commonPct = Math.round(probabilities.common * 100);
  const rarePct = Math.round(probabilities.rare * 100);
  const legPct = Math.round(probabilities.legendary * 100);

  const sensoryRows: { label: string; value: number; color: string; wide?: boolean }[] = [
    { label: 'Sweetness', value: sensory.sweetness, color: 'var(--daisy)' },
    { label: 'Starlight glow', value: sensory.starlight_glow, color: 'var(--accent)' },
    { label: 'Floral', value: sensory.floral_harmony, color: 'var(--rose)' },
    { label: 'Earthiness', value: sensory.earthiness, color: 'var(--mint)' },
    { label: 'Warmth', value: sensory.warmth, color: 'var(--orange)', wide: true },
  ];

  const attrRows = [
    { label: 'Streak', value: attributions.streak_pct },
    { label: 'Sleep', value: attributions.duration_pct },
    { label: 'Synergy', value: attributions.synergy_pct },
    { label: 'Care', value: attributions.care_pct },
  ];

  return (
    <div className="surface p-4 sm:p-5 select-none" style={{ background: 'var(--surface-solid)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between gap-2 pb-3 mb-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="min-w-0">
          <div className="font-semibold text-sm sm:text-base flex items-center flex-wrap gap-2" style={{ color: 'var(--text)' }}>
            <span>TabPFN Alchemist&apos;s Forecast</span>
            <span
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold"
              style={{
                color: 'var(--accent)',
                background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)',
              }}
            >
              Bayesian AI
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {plain(leafName)} + {plain(treatName)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSensory(!showSensory)}
            aria-expanded={showSensory}
            className="btn-pill px-3 text-xs"
          >
            {showSensory ? (
              <ChevronUp size={16} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
            )}
            {showSensory ? 'Simple' : 'Flavors & XAI'}
          </button>
          {onClose && (
            <button onClick={onClose} className="icon-btn" aria-label="Close">
              <X size={22} strokeWidth={1.5} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Sunny's quote */}
      <div
        className="mb-3 p-3 text-sm italic leading-snug"
        style={{
          color: 'var(--text)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        {plain(sunny_quote)}
      </div>

      {/* Probability gauge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--muted)' }}>
          <span>Predicted rarity odds</span>
          <span style={{ color: 'var(--daisy)' }}>Mystery: {mystery_index}% (entropy)</span>
        </div>

        <div
          className="w-full h-3 rounded-full flex overflow-hidden"
          style={{ background: 'var(--border)' }}
          role="img"
          aria-label={`Common ${commonPct} percent, rare ${rarePct} percent, legendary ${legPct} percent`}
        >
          <div
            style={{ width: `${commonPct}%`, background: 'var(--mint)', transition: 'width 250ms var(--ease)' }}
            className="h-full"
          />
          <div
            style={{ width: `${rarePct}%`, background: 'var(--accent)', transition: 'width 250ms var(--ease)' }}
            className="h-full"
          />
          <div
            style={{ width: `${legPct}%`, background: 'var(--daisy)', transition: 'width 250ms var(--ease)' }}
            className="h-full"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { label: 'Common', pct: commonPct, color: 'var(--mint)' },
            { label: 'Rare', pct: rarePct, color: 'var(--accent)' },
            { label: 'Legendary', pct: legPct, color: 'var(--daisy)' },
          ].map((r) => (
            <div
              key={r.label}
              className="py-1.5 px-2"
              style={{
                borderRadius: 'var(--radius-sm)',
                background: `color-mix(in srgb, ${r.color} 10%, transparent)`,
                border: `1px solid color-mix(in srgb, ${r.color} 30%, transparent)`,
              }}
            >
              <span className="font-semibold" style={{ color: r.color }}>
                {r.label}{' '}
              </span>
              <span className="font-bold" style={{ color: 'var(--text)' }}>
                {r.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* What-if simulator */}
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between gap-2 text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>
          <span>What-if simulator</span>
          <span style={{ color: 'var(--text)' }}>
            {plain(activeNap.label)} ({activeNap.sub})
          </span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {NAPS.map((n) => {
            const isSelected = activeNapKey === n.key;
            return (
              <button
                key={n.key}
                type="button"
                aria-pressed={isSelected}
                data-selected={isSelected}
                onClick={() => {
                  setWhatIfNap(n.key);
                  if (onSelectNap) onSelectNap(n.key);
                }}
                className="pick-card min-h-11 px-3 text-xs font-semibold flex items-center gap-1.5"
                style={{ ['--sel' as string]: 'var(--accent)' }}
              >
                <NapIcon id={n.key} size={16} />
                <span>{plain(n.label)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sensory & explainability drawer */}
      {showSensory && (
        <div className="mt-3 pt-3 space-y-3 animate-modal text-xs" style={{ borderTop: '1px solid var(--border)' }}>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center justify-between gap-2" style={{ color: 'var(--muted)' }}>
              <span>Sensory vector</span>
              <span style={{ color: 'var(--berry)' }}>Sleepiness: {sleepiness_score}%</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sensoryRows.map((r) => (
                <div
                  key={r.label}
                  className={`p-2 ${r.wide ? 'col-span-2 sm:col-span-1' : ''}`}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <div className="font-semibold flex justify-between" style={{ color: 'var(--text)' }}>
                    <span>{r.label}</span>
                    <span>{r.value}%</span>
                  </div>
                  <div className="progress-line mt-1.5">
                    <span style={{ width: `${r.value}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="p-3"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div className="font-semibold flex items-center justify-between gap-2" style={{ color: 'var(--muted)' }}>
              <span>Attribution</span>
              <span style={{ color: 'var(--mint)' }}>{attributions.primary_driver}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center mt-2 font-bold" style={{ color: 'var(--text)' }}>
              {attrRows.map((a) => (
                <div key={a.label} className="rounded-xl py-1.5" style={{ background: 'rgba(0,0,0,0.25)' }}>
                  <div className="text-[11px] font-normal" style={{ color: 'var(--muted)' }}>
                    {a.label}
                  </div>
                  +{a.value}%
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
