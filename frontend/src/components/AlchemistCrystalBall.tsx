'use client';

import React, { useState, useMemo } from 'react';
import { evaluateTabPFN, type TabPFNResult } from '@/lib/tabpfn';
import { NAPS } from '@/lib/kidsContent';

interface AlchemistCrystalBallProps {
  leafName: string;
  treatName: string;
  napKey: string;
  streak: number;
  careXP?: number;
  onSelectNap?: (key: string) => void;
}

export function AlchemistCrystalBall({
  leafName,
  treatName,
  napKey,
  streak,
  careXP = 20,
  onSelectNap,
}: AlchemistCrystalBallProps) {
  const [whatIfNap, setWhatIfNap] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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

  return (
    <div className="mt-4 rounded-3xl bg-gradient-to-br from-indigo-950/85 via-purple-950/80 to-slate-950/90 border-4 border-indigo-300/40 p-4 sm:p-5 text-white shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-indigo-400/20 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-spin-slow">🔮</span>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-amber-200 flex items-center gap-1.5">
              <span>TabPFN Alchemist's Crystal Ball</span>
              <span className="text-[10px] uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/30">
                Live Bayesian AI
              </span>
            </h3>
            <p className="text-xs text-indigo-200/80">
              Predicting in-context rarity & sensory flavors before Sunny tucks in
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition text-indigo-200"
        >
          {showDetails ? '▲ Compact' : '▼ Sensory Lab'}
        </button>
      </div>

      {/* Sunny's Alchemist Quote */}
      <div className="mb-3 rounded-2xl bg-indigo-900/50 border border-indigo-400/30 p-2.5 sm:p-3 text-xs sm:text-sm font-medium text-indigo-100 flex items-center gap-2.5">
        <span className="text-2xl shrink-0">🦥</span>
        <div className="italic leading-snug">{sunny_quote}</div>
      </div>

      {/* Live Posterior Probability Gauges */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
          <span>Rarity Odds</span>
          <span className="text-amber-300">
            Mystery Index: {mystery_index}% (Entropy)
          </span>
        </div>

        {/* 3-Part Stacked Probability Bar */}
        <div className="w-full h-4 rounded-full bg-slate-900/80 p-0.5 border border-white/20 flex overflow-hidden">
          <div
            style={{ width: `${commonPct}%` }}
            className="h-full bg-emerald-400 transition-all duration-500 rounded-l-full relative group"
            title={`Common: ${commonPct}%`}
          />
          <div
            style={{ width: `${rarePct}%` }}
            className="h-full bg-purple-400 transition-all duration-500 relative group"
            title={`Rare: ${rarePct}%`}
          />
          <div
            style={{ width: `${legPct}%` }}
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500 rounded-r-full relative group"
            title={`Legendary: ${legPct}%`}
          />
        </div>

        {/* Legend / Percentage Labels */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
          <div className="rounded-xl bg-emerald-950/60 border border-emerald-400/30 py-1.5 px-2">
            <div className="font-bold text-emerald-300">🍃 Common</div>
            <div className="text-sm font-extrabold text-white">{commonPct}%</div>
          </div>
          <div className="rounded-xl bg-purple-950/60 border border-purple-400/30 py-1.5 px-2">
            <div className="font-bold text-purple-300">✨ Rare</div>
            <div className="text-sm font-extrabold text-white">{rarePct}%</div>
          </div>
          <div className="rounded-xl bg-amber-950/60 border border-amber-400/30 py-1.5 px-2">
            <div className="font-bold text-amber-300">⭐ Legendary</div>
            <div className="text-sm font-extrabold text-white">{legPct}%</div>
          </div>
        </div>
      </div>

      {/* "What-If" Interactive Bedtime Simulator */}
      <div className="mt-3.5 pt-3 border-t border-indigo-400/20">
        <div className="flex items-center justify-between text-xs font-bold text-indigo-200 mb-1.5">
          <span>🔮 What-If Bedtime Simulator:</span>
          <span className="text-amber-200">{activeNap.label} ({activeNap.sub})</span>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {NAPS.map((n) => {
            const isSelected = activeNapKey === n.key;
            return (
              <button
                key={n.key}
                onClick={() => {
                  setWhatIfNap(n.key);
                  if (onSelectNap) onSelectNap(n.key);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105 border border-amber-200'
                    : 'bg-white/10 text-white/90 hover:bg-white/20'
                }`}
              >
                <span>{n.icon}</span>
                <span>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expanded Multi-Task Sensory & Explainability Drawer */}
      {showDetails && (
        <div className="mt-3.5 pt-3 border-t border-indigo-400/20 space-y-3 animate-fade-in">
          {/* Sensory Flavor Dimensions */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-2 flex items-center justify-between">
              <span>🍵 TabPFN Sensory Flavor Dimensions</span>
              <span className="text-sky-300">💤 Sleepiness: {sleepiness_score}%</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-indigo-900/40 rounded-xl p-2 border border-indigo-400/20">
                <div className="text-amber-200 font-semibold flex justify-between">
                  <span>🍯 Sweetness</span>
                  <span>{sensory.sweetness}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${sensory.sweetness}%` }} />
                </div>
              </div>

              <div className="bg-indigo-900/40 rounded-xl p-2 border border-indigo-400/20">
                <div className="text-amber-200 font-semibold flex justify-between">
                  <span>✨ Starlight Glow</span>
                  <span>{sensory.starlight_glow}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div className="bg-yellow-300 h-full rounded-full" style={{ width: `${sensory.starlight_glow}%` }} />
                </div>
              </div>

              <div className="bg-indigo-900/40 rounded-xl p-2 border border-indigo-400/20">
                <div className="text-amber-200 font-semibold flex justify-between">
                  <span>🌸 Floral Harmony</span>
                  <span>{sensory.floral_harmony}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div className="bg-pink-400 h-full rounded-full" style={{ width: `${sensory.floral_harmony}%` }} />
                </div>
              </div>

              <div className="bg-indigo-900/40 rounded-xl p-2 border border-indigo-400/20">
                <div className="text-amber-200 font-semibold flex justify-between">
                  <span>🌿 Earthiness</span>
                  <span>{sensory.earthiness}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${sensory.earthiness}%` }} />
                </div>
              </div>

              <div className="bg-indigo-900/40 rounded-xl p-2 border border-indigo-400/20 col-span-2 sm:col-span-2">
                <div className="text-amber-200 font-semibold flex justify-between">
                  <span>☕ Warmth</span>
                  <span>{sensory.warmth}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div className="bg-orange-400 h-full rounded-full" style={{ width: `${sensory.warmth}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Attribution (XAI) Preview */}
          <div className="rounded-2xl bg-indigo-900/30 p-2.5 border border-indigo-400/20 text-xs">
            <div className="font-bold text-indigo-200 mb-1 flex items-center justify-between">
              <span>📊 Projected Attribution Weights:</span>
              <span className="text-emerald-300 font-semibold">{attributions.primary_driver}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center mt-1">
              <div className="bg-black/30 rounded-lg p-1">
                <div className="text-[10px] text-indigo-300">Streak</div>
                <div className="font-bold text-white">+{attributions.streak_pct}%</div>
              </div>
              <div className="bg-black/30 rounded-lg p-1">
                <div className="text-[10px] text-indigo-300">Sleep</div>
                <div className="font-bold text-white">+{attributions.duration_pct}%</div>
              </div>
              <div className="bg-black/30 rounded-lg p-1">
                <div className="text-[10px] text-indigo-300">Synergy</div>
                <div className="font-bold text-white">+{attributions.synergy_pct}%</div>
              </div>
              <div className="bg-black/30 rounded-lg p-1">
                <div className="text-[10px] text-indigo-300">Care</div>
                <div className="font-bold text-white">+{attributions.care_pct}%</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
