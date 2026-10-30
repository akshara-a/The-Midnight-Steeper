'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import type { Loot } from '@/lib/api';
import { plain } from '@/components/ui';

interface TabPFNAttributionCardProps {
  loot: Loot;
  defaultExpanded?: boolean;
}

export function TabPFNAttributionCard({ loot, defaultExpanded = false }: TabPFNAttributionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const attributions = loot.attributions ?? {
    streak_pct: 35,
    duration_pct: 30,
    synergy_pct: 20,
    care_pct: 15,
    primary_driver: 'Consistent Bedtime Streak',
  };

  const sensory = loot.sensory ?? {
    sweetness: 65,
    earthiness: 45,
    starlight_glow: loot.rarity === 'Legendary' ? 88 : loot.rarity === 'Rare' ? 62 : 35,
    floral_harmony: 70,
    warmth: 80,
  };

  const sleepiness = loot.sleepiness_score ?? 85;

  const bars = [
    { label: 'Bedtime consistency streak', value: attributions.streak_pct, color: 'var(--daisy)' },
    { label: 'Deep steep & sleep length', value: attributions.duration_pct, color: 'var(--berry)' },
    { label: 'Herbal ingredient synergy', value: attributions.synergy_pct, color: 'var(--rose)' },
    { label: 'Bedtime routine & bathing', value: attributions.care_pct, color: 'var(--accent)' },
  ];

  const notes = [
    { label: 'Sweetness', value: sensory.sweetness, color: 'var(--daisy)' },
    { label: 'Starlight', value: sensory.starlight_glow, color: 'var(--accent)' },
    { label: 'Floral', value: sensory.floral_harmony, color: 'var(--rose)' },
    { label: 'Warmth', value: sensory.warmth, color: 'var(--orange)' },
    { label: 'Earthiness', value: sensory.earthiness, color: 'var(--mint)' },
  ];

  return (
    <div className="surface mt-3 p-4 text-left select-none" style={{ background: 'var(--surface-solid)' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <div className="font-semibold text-sm sm:text-base flex items-center flex-wrap gap-2" style={{ color: 'var(--text)' }}>
            <span>TabPFN Feature Attribution</span>
            <span
              className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full"
              style={{
                color: 'var(--mint)',
                background: 'color-mix(in srgb, var(--mint) 14%, transparent)',
                border: '1px solid color-mix(in srgb, var(--mint) 35%, transparent)',
              }}
            >
              XAI
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Why did this tea brew into {plain(String(loot.rarity))} quality?
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span style={{ color: 'var(--muted)' }}>Rest: </span>
            <span className="font-bold" style={{ color: 'var(--berry)' }}>
              {sleepiness}%
            </span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="btn-pill px-3 text-xs"
          >
            {expanded ? (
              <ChevronUp size={16} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
            )}
            {expanded ? 'Simple' : 'Breakdown'}
          </button>
        </div>
      </div>

      {/* Primary driver */}
      <div
        className="mt-3 p-3 text-sm flex items-center gap-2.5"
        style={{
          color: 'var(--text)',
          background: 'color-mix(in srgb, var(--mint) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--mint) 30%, transparent)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <Lightbulb size={22} strokeWidth={1.5} aria-hidden="true" className="shrink-0" style={{ color: 'var(--mint)' }} />
        <div className="leading-snug">
          <strong style={{ color: 'var(--mint)' }}>{plain(attributions.primary_driver)}</strong> was the biggest
          reason this tea reached its magical flavor.
        </div>
      </div>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="mt-3 pt-3 space-y-3 animate-modal" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="space-y-2.5">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  <span>{b.label}</span>
                  <span style={{ color: b.color }}>+{b.value}%</span>
                </div>
                <div className="progress-line">
                  <span style={{ width: `${b.value}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div
              className="text-[11px] font-semibold uppercase tracking-wider mb-2 flex items-center justify-between gap-2"
              style={{ color: 'var(--muted)' }}
            >
              <span>Sensory flavor notes</span>
              <span className="normal-case font-normal">Multi-task regression</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {notes.map((n) => (
                <span
                  key={n.label}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    color: 'var(--text)',
                    background: `color-mix(in srgb, ${n.color} 14%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${n.color} 38%, transparent)`,
                  }}
                >
                  {n.label}: {n.value}%
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
