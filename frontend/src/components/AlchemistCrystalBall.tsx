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

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-950/90 via-purple-950/85 to-slate-950/95 border-2 border-indigo-400/40 p-3.5 sm:p-4 text-white shadow-xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-indigo-400/20 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔮</span>
          <div>
            <div className="font-bold text-xs sm:text-sm text-amber-200 flex items-center gap-1.5">
              <span>TabPFN Alchemist's Forecast</span>
              <span className="text-[9px] uppercase tracking-wider bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-300/30 font-bold">
                Bayesian AI
              </span>
            </div>
            <p className="text-[10px] text-indigo-200/80">
              {leafName} + {treatName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSensory(!showSensory)}
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 transition text-indigo-200"
          >
            {showSensory ? '▲ Simple' : '▼ Flavors & XAI'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-xs flex items-center justify-center font-bold text-indigo-200"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Sunny's Alchemist Quote */}
      <div className="mb-2.5 rounded-xl bg-indigo-900/50 border border-indigo-400/30 p-2 text-xs font-medium text-indigo-100 flex items-center gap-2">
        <span className="text-lg shrink-0">🦥</span>
        <div className="italic leading-snug">{sunny_quote}</div>
      </div>

      {/* Probability Gauge Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-indigo-200">
          <span>Predicted Rarity Odds</span>
          <span className="text-amber-300 text-[10px]">
            Mystery: {mystery_index}% (Entropy)
          </span>
        </div>

        {/* 3-Part Stacked Probability Bar */}
        <div className="w-full h-3 rounded-full bg-slate-900/80 p-0.5 border border-white/20 flex overflow-hidden">
          <div
            style={{ width: `${commonPct}%` }}
            className="h-full bg-emerald-400 transition-all duration-500 rounded-l-full"
            title={`Common: ${commonPct}%`}
          />
          <div
            style={{ width: `${rarePct}%` }}
            className="h-full bg-purple-400 transition-all duration-500"
            title={`Rare: ${rarePct}%`}
          />
          <div
            style={{ width: `${legPct}%` }}
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500 rounded-r-full"
            title={`Legendary: ${legPct}%`}
          />
        </div>

        {/* Legend / Percentage Labels */}
        <div className="grid grid-cols-3 gap-1 text-center text-[11px]">
          <div className="rounded-lg bg-emerald-950/60 border border-emerald-400/30 py-1 px-1.5">
            <span className="font-semibold text-emerald-300 text-[10px]">Common: </span>
            <span className="font-extrabold text-white">{commonPct}%</span>
          </div>
          <div className="rounded-lg bg-purple-950/60 border border-purple-400/30 py-1 px-1.5">
            <span className="font-semibold text-purple-300 text-[10px]">Rare: </span>
            <span className="font-extrabold text-white">{rarePct}%</span>
          </div>
          <div className="rounded-lg bg-amber-950/60 border border-amber-400/30 py-1 px-1.5">
            <span className="font-semibold text-amber-300 text-[10px]">Legendary: </span>
            <span className="font-extrabold text-white">{legPct}%</span>
          </div>
        </div>
      </div>

      {/* "What-If" Interactive Bedtime Simulator */}
      <div className="mt-2.5 pt-2 border-t border-indigo-400/20">
        <div className="flex items-center justify-between text-[10px] font-bold text-indigo-200 mb-1">
          <span>🔮 What-If Simulator:</span>
          <span className="text-amber-200">{activeNap.label} ({activeNap.sub})</span>
        </div>
        <div className="flex flex-wrap gap-1 justify-center">
          {NAPS.map((n) => {
            const isSelected = activeNapKey === n.key;
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => {
                  setWhatIfNap(n.key);
                  if (onSelectNap) onSelectNap(n.key);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-sm scale-105 border border-amber-200'
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
      {showSensory && (
        <div className="mt-2.5 pt-2 border-t border-indigo-400/20 space-y-2 animate-fade-in text-[11px]">
          {/* Sensory Flavor Dimensions */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300 mb-1.5 flex items-center justify-between">
              <span>🍵 TabPFN Sensory Vector</span>
              <span className="text-sky-300 font-bold">💤 Sleepiness: {sleepiness_score}%</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[10px]">
              <div className="bg-indigo-900/40 rounded-lg p-1.5 border border-indigo-400/20">
                <div className="text-amber-200 font-semibold flex justify-between">
                  <span>🍯 Sweetness</span>
                  <span>{sensory.sweetness}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${sensory.sweetness}%` }} />
                </div>
              </div>

              <div className="bg-indigo-900/40 rounded-lg p-1.5 border border-indigo-400/20">
                <div className="text-amber-200 font-semibold flex justify-between">
                  <span>✨ Starlight Glow</span>
                  <span>{sensory.starlight_glow}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div className="bg-yellow-300 h-full rounded-full" style={{ width: `${sensory.starlight_glow}%` }} />
                </div>
              </div>

              <div className="bg-indigo-900/40 rounded-lg p-1.5 border border-indigo-400/20">
                <div className="text-amber-200 font-semibold flex justify-between">
                  <span>🌸 Floral</span>
                  <span>{sensory.floral_harmony}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div className="bg-pink-400 h-full rounded-full" style={{ width: `${sensory.floral_harmony}%` }} />
                </div>
              </div>

              <div className="bg-indigo-900/40 rounded-lg p-1.5 border border-indigo-400/20">
                <div className="text-amber-200 font-semibold flex justify-between">
                  <span>🌿 Earthiness</span>
                  <span>{sensory.earthiness}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${sensory.earthiness}%` }} />
                </div>
              </div>

              <div className="bg-indigo-900/40 rounded-lg p-1.5 border border-indigo-400/20 col-span-2 sm:col-span-2">
                <div className="text-amber-200 font-semibold flex justify-between">
                  <span>☕ Warmth</span>
                  <span>{sensory.warmth}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                  <div className="bg-orange-400 h-full rounded-full" style={{ width: `${sensory.warmth}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Attribution (XAI) Preview */}
          <div className="rounded-xl bg-indigo-900/30 p-2 border border-indigo-400/20 text-[10px]">
            <div className="font-bold text-indigo-200 mb-1 flex items-center justify-between">
              <span>📊 Attribution:</span>
              <span className="text-emerald-300 font-semibold">{attributions.primary_driver}</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center mt-1 font-bold text-white">
              <div className="bg-black/30 rounded p-1">
                <div className="text-[9px] text-indigo-300 font-normal">Streak</div>
                +{attributions.streak_pct}%
              </div>
              <div className="bg-black/30 rounded p-1">
                <div className="text-[9px] text-indigo-300 font-normal">Sleep</div>
                +{attributions.duration_pct}%
              </div>
              <div className="bg-black/30 rounded p-1">
                <div className="text-[9px] text-indigo-300 font-normal">Synergy</div>
                +{attributions.synergy_pct}%
              </div>
              <div className="bg-black/30 rounded p-1">
                <div className="text-[9px] text-indigo-300 font-normal">Care</div>
                +{attributions.care_pct}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
