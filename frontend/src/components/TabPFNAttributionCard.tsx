'use client';

import React, { useState } from 'react';
import type { Loot } from '@/lib/api';

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

  return (
    <div className="mt-3 rounded-2xl bg-gradient-to-br from-indigo-950/90 via-purple-950/85 to-slate-950/95 border-2 border-indigo-400/40 p-3 sm:p-4 text-white text-left shadow-lg select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔬</span>
          <div>
            <div className="font-bold text-xs sm:text-sm text-amber-200 flex items-center gap-1.5">
              <span>TabPFN Feature Attribution</span>
              <span className="text-[9px] uppercase font-bold tracking-wider bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-400/30">
                XAI
              </span>
            </div>
            <p className="text-[10px] text-indigo-200/80">
              Why did this tea brew into {loot.rarity} quality?
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-indigo-300 font-semibold">Rest: </span>
            <span className="text-xs font-black text-sky-300">💤 {sleepiness}%</span>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition text-indigo-200"
          >
            {expanded ? '▲ Simple' : '▼ Breakdown'}
          </button>
        </div>
      </div>

      {/* Primary Driver Key Takeaway */}
      <div className="mt-2 rounded-xl bg-emerald-950/50 border border-emerald-400/30 p-2 text-xs text-emerald-100 flex items-center gap-2">
        <span className="text-lg shrink-0">💡</span>
        <div className="leading-snug">
          <strong className="text-emerald-300">{attributions.primary_driver}</strong> was the biggest reason this tea reached its magical flavor!
        </div>
      </div>

      {/* Expanded Breakdown */}
      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-indigo-400/20 space-y-2.5 animate-fade-in">
          {/* Attribution Progress Bars */}
          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-indigo-200 mb-0.5">
                <span>🌙 Bedtime Consistency Streak</span>
                <span className="font-bold text-amber-300">+{attributions.streak_pct}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/10">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${attributions.streak_pct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-indigo-200 mb-0.5">
                <span>⏳ Deep Steep & Sleep Length</span>
                <span className="font-bold text-sky-300">+{attributions.duration_pct}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/10">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${attributions.duration_pct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-indigo-200 mb-0.5">
                <span>🌸 Herbal Ingredient Synergy</span>
                <span className="font-bold text-pink-300">+{attributions.synergy_pct}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/10">
                <div
                  className="bg-pink-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${attributions.synergy_pct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-indigo-200 mb-0.5">
                <span>🛁 Bedtime Routine & Bathing</span>
                <span className="font-bold text-purple-300">+{attributions.care_pct}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/10">
                <div
                  className="bg-purple-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${attributions.care_pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sensory Flavor Dimensions Radar Tags */}
          <div className="pt-2 border-t border-indigo-400/20">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1 flex items-center justify-between">
              <span>🍵 Sensory Flavor Notes</span>
              <span className="text-[9px] text-indigo-300 font-normal">Multi-Task Regression</span>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-amber-200 text-[10px] font-semibold">
                🍯 Sweetness: {sensory.sweetness}%
              </span>
              <span className="px-2 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-300/30 text-yellow-200 text-[10px] font-semibold">
                ✨ Starlight: {sensory.starlight_glow}%
              </span>
              <span className="px-2 py-0.5 rounded-full bg-pink-400/20 border border-pink-300/30 text-pink-200 text-[10px] font-semibold">
                🌸 Floral: {sensory.floral_harmony}%
              </span>
              <span className="px-2 py-0.5 rounded-full bg-orange-400/20 border border-orange-300/30 text-orange-200 text-[10px] font-semibold">
                ☕ Warmth: {sensory.warmth}%
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-[10px] font-semibold">
                🌿 Earthiness: {sensory.earthiness}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
