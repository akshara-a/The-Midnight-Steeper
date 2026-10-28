'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { sounds } from '@/lib/soundEffects';
import {
  type HatId,
  type GlassesId,
  type NeckwearId,
  type WardrobeOutfit,
  type WardrobeItemConfig,
  WARDROBE_HATS,
  WARDROBE_GLASSES,
  WARDROBE_NECK,
  DEFAULT_WARDROBE,
} from '@/lib/wardrobe';
import { type DioramaTheme } from '@/components/SlothPet3D';

const SlothPet3D = dynamic(() => import('@/components/SlothPet3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-sm font-semibold text-purple-900">
      <div className="text-4xl animate-bounce-soft">🦥</div>
      <span className="mt-1">Mirror loading...</span>
    </div>
  ),
});

interface WardrobeModalProps {
  currentOutfit: WardrobeOutfit;
  onSaveOutfit: (newOutfit: WardrobeOutfit) => void;
  onSay: (text: string) => void;
  onFloatEmoji: (emoji: string, x?: number, y?: number) => void;
  onClose: () => void;
  furColor?: string;
  accentColor?: string;
  theme?: DioramaTheme;
}

type WardrobeTab = 'hats' | 'glasses' | 'neck';

export default function WardrobeModal({
  currentOutfit,
  onSaveOutfit,
  onSay,
  onFloatEmoji,
  onClose,
  furColor = '#a7f3d0',
  accentColor = '#f472b6',
  theme = 'classic',
}: Readonly<WardrobeModalProps>) {
  // Draft outfit shown live in the mirror before saving
  const [draftOutfit, setDraftOutfit] = useState<WardrobeOutfit>({ ...currentOutfit });
  const [activeTab, setActiveTab] = useState<WardrobeTab>('hats');
  const [previewQuote, setPreviewQuote] = useState<string>(
    'Try on hats, glasses, or scarves on me in the mirror!'
  );
  const [mirrorPokes, setMirrorPokes] = useState(0);

  const currentHat = WARDROBE_HATS.find((h) => h.id === draftOutfit.hat) ?? WARDROBE_HATS[0];
  const currentGlasses =
    WARDROBE_GLASSES.find((g) => g.id === draftOutfit.glasses) ?? WARDROBE_GLASSES[0];
  const currentNeck = WARDROBE_NECK.find((n) => n.id === draftOutfit.neck) ?? WARDROBE_NECK[0];

  const hasUnsavedChanges =
    draftOutfit.hat !== currentOutfit.hat ||
    draftOutfit.glasses !== currentOutfit.glasses ||
    draftOutfit.neck !== currentOutfit.neck;

  const toggleHat = (item: WardrobeItemConfig<HatId>, e: React.MouseEvent) => {
    sounds.playEquip();
    const nextHat = draftOutfit.hat === item.id ? 'none' : item.id;
    setDraftOutfit((prev) => ({ ...prev, hat: nextHat }));
    setPreviewQuote(nextHat === 'none' ? 'Took off my hat! Ah, breezy ears!' : item.quote);
    onFloatEmoji(item.icon, e.clientX, e.clientY);
  };

  const toggleGlasses = (item: WardrobeItemConfig<GlassesId>, e: React.MouseEvent) => {
    sounds.playEquip();
    const nextGlasses = draftOutfit.glasses === item.id ? 'none' : item.id;
    setDraftOutfit((prev) => ({ ...prev, glasses: nextGlasses }));
    setPreviewQuote(nextGlasses === 'none' ? 'Taking off my glasses!' : item.quote);
    onFloatEmoji(item.icon, e.clientX, e.clientY);
  };

  const toggleNeck = (item: WardrobeItemConfig<NeckwearId>, e: React.MouseEvent) => {
    sounds.playEquip();
    const nextNeck = draftOutfit.neck === item.id ? 'none' : item.id;
    setDraftOutfit((prev) => ({ ...prev, neck: nextNeck }));
    setPreviewQuote(nextNeck === 'none' ? 'Taking off my neckwear!' : item.quote);
    onFloatEmoji(item.icon, e.clientX, e.clientY);
  };

  const handleMirrorPoke = () => {
    setMirrorPokes((n) => n + 1);
    sounds.playGiggle();
    setPreviewQuote('Hehehe, that tickles! How do I look in this outfit? ✨');
    onFloatEmoji('💖');
  };

  const resetAllDraft = () => {
    sounds.playPop();
    setDraftOutfit(DEFAULT_WARDROBE);
    setPreviewQuote('All natural fluffy fur! So cozy and clean! 🦥');
  };

  const revertToCurrent = () => {
    sounds.playClick();
    setDraftOutfit({ ...currentOutfit });
    setPreviewQuote('Reverted back to my original outfit!');
  };

  const handleSave = () => {
    sounds.playLootFanfare();
    onSaveOutfit(draftOutfit);
    onSay('Ta-da! My brand new look is saved! Thank you! ✨🦥');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-2 sm:p-4 bg-purple-950/50 backdrop-blur-md">
      <div className="toy-card animate-modal w-full max-w-4xl max-h-[94vh] flex flex-col p-4 sm:p-6 relative overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-purple-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl animate-bounce-soft">🪞</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#3b2a63]">
                Sunny&apos;s Dressing Room
              </h2>
              <p className="text-xs text-[#3b2a63]/75 font-medium">
                Try on outfits in the live mirror, then save your favorite look!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="btn-chunky blue w-10 h-10 sm:w-11 sm:h-11 text-xl flex items-center justify-center shrink-0"
          >
            ✕
          </button>
        </div>

        {/* 2-Column Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
          {/* ========================================================= */}
          {/* LEFT COLUMN: LIVE FITTING MIRROR (Talking Tom style)     */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-2.5 bg-gradient-to-b from-purple-50/90 to-amber-50/90 rounded-2xl p-3 border-2 border-purple-200/80 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                <span>🪞</span> Live Fitting Mirror
              </span>
              {hasUnsavedChanges ? (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full animate-pulse border border-amber-300">
                  Previewing New Look ✨
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                  Current Outfit
                </span>
              )}
            </div>

            {/* 3D Vanity Mirror Frame */}
            <div className="relative rounded-2xl border-4 border-amber-300 overflow-hidden h-[240px] sm:h-[280px] md:h-[310px] bg-gradient-to-b from-sky-200/40 via-purple-100/30 to-amber-100/50 shadow-md">
              <SlothPet3D
                mood="happy"
                furColor={furColor}
                accentColor={accentColor}
                pokeCount={mirrorPokes}
                onPoke={handleMirrorPoke}
                theme={theme}
                wardrobe={draftOutfit}
              />

              {/* Mirror Speech Bubble */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90%] max-w-xs z-10 pointer-events-none">
                <div className="bubble py-1.5 px-3 text-center text-xs sm:text-sm font-bold leading-tight shadow-md">
                  {previewQuote}
                </div>
              </div>

              {/* Tap to Pose Pill */}
              <div className="absolute bottom-2 left-2 z-10 pointer-events-none text-[11px] font-bold bg-white/80 text-purple-900 px-2 py-0.5 rounded-full shadow-xs backdrop-blur-xs">
                👆 Tap Sunny to pose!
              </div>
            </div>

            {/* In-Mirror Wearing Summary Strip */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs bg-white/85 p-2 rounded-xl border border-purple-100 shadow-xs">
              <span className="font-bold text-purple-950 text-[11px]">In Mirror:</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[11px] shadow-2xs">
                {currentHat.icon} {currentHat.name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px] shadow-2xs">
                {currentGlasses.icon} {currentGlasses.name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold text-[11px] shadow-2xs">
                {currentNeck.icon} {currentNeck.name}
              </span>
            </div>

            {/* Save & Reset Actions */}
            <div className="flex flex-col gap-2 mt-auto pt-1">
              <button
                onClick={handleSave}
                className="btn-chunky green w-full py-2.5 text-base sm:text-lg font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <span>💾</span>
                <span>Save Outfit</span>
                {hasUnsavedChanges && <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">✓</span>}
              </button>

              <div className="flex items-center justify-between gap-2 text-xs">
                {hasUnsavedChanges ? (
                  <button
                    onClick={revertToCurrent}
                    className="font-bold text-purple-700 hover:text-purple-900 bg-white hover:bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-200 transition-colors"
                  >
                    ↺ Revert to Saved
                  </button>
                ) : (
                  <span className="text-purple-700/60 font-medium">No changes yet</span>
                )}

                <button
                  onClick={resetAllDraft}
                  className="font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors"
                >
                  Take Off All
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: WARDROBE CATALOG & OUTFIT PICKER            */}
          {/* ========================================================= */}
          <div className="flex flex-col gap-2.5 flex-1 min-h-0">
            {/* Category Tabs */}
            <div className="grid grid-cols-3 gap-1.5 shrink-0">
              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('hats');
                }}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'hats'
                    ? 'bg-purple-600 text-white shadow-md scale-[1.02]'
                    : 'bg-white/80 text-purple-950 border border-purple-200 hover:bg-white'
                }`}
              >
                <span>🎩</span>
                <span>Hats</span>
                {draftOutfit.hat !== 'none' && (
                  <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />
                )}
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('glasses');
                }}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'glasses'
                    ? 'bg-amber-500 text-white shadow-md scale-[1.02]'
                    : 'bg-white/80 text-purple-950 border border-amber-200 hover:bg-white'
                }`}
              >
                <span>👓</span>
                <span>Glasses</span>
                {draftOutfit.glasses !== 'none' && (
                  <span className="w-2 h-2 rounded-full bg-purple-300 inline-block" />
                )}
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('neck');
                }}
                className={`py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'neck'
                    ? 'bg-rose-500 text-white shadow-md scale-[1.02]'
                    : 'bg-white/80 text-purple-950 border border-rose-200 hover:bg-white'
                }`}
              >
                <span>🧣</span>
                <span>Neck</span>
                {draftOutfit.neck !== 'none' && (
                  <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />
                )}
              </button>
            </div>

            {/* Scrollable Item Catalog for Active Tab */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
              {/* 1. HATS */}
              {activeTab === 'hats' &&
                WARDROBE_HATS.map((item) => {
                  const isEquipped = draftOutfit.hat === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => toggleHat(item, e)}
                      className={`w-full p-2.5 rounded-xl border-2 text-left transition-all flex items-start gap-2.5 relative group ${
                        isEquipped
                          ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-300 scale-[1.01] shadow-xs'
                          : 'bg-white/80 border-purple-100 hover:border-purple-300 hover:bg-white'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl mt-0.5 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs sm:text-sm text-[#3b2a63]">
                            {item.name}
                          </span>
                          {isEquipped ? (
                            <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                              In Mirror ✓
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md shrink-0">
                              {item.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#3b2a63]/75 mt-0.5 leading-snug line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}

              {/* 2. GLASSES */}
              {activeTab === 'glasses' &&
                WARDROBE_GLASSES.map((item) => {
                  const isEquipped = draftOutfit.glasses === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => toggleGlasses(item, e)}
                      className={`w-full p-2.5 rounded-xl border-2 text-left transition-all flex items-start gap-2.5 relative group ${
                        isEquipped
                          ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-300 scale-[1.01] shadow-xs'
                          : 'bg-white/80 border-amber-100 hover:border-amber-300 hover:bg-white'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl mt-0.5 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs sm:text-sm text-[#3b2a63]">
                            {item.name}
                          </span>
                          {isEquipped ? (
                            <span className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                              In Mirror ✓
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                              {item.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#3b2a63]/75 mt-0.5 leading-snug line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}

              {/* 3. NECKWEAR */}
              {activeTab === 'neck' &&
                WARDROBE_NECK.map((item) => {
                  const isEquipped = draftOutfit.neck === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={(e) => toggleNeck(item, e)}
                      className={`w-full p-2.5 rounded-xl border-2 text-left transition-all flex items-start gap-2.5 relative group ${
                        isEquipped
                          ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-300 scale-[1.01] shadow-xs'
                          : 'bg-white/80 border-rose-100 hover:border-rose-300 hover:bg-white'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl mt-0.5 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs sm:text-sm text-[#3b2a63]">
                            {item.name}
                          </span>
                          {isEquipped ? (
                            <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                              In Mirror ✓
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded-md shrink-0">
                              {item.tag}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#3b2a63]/75 mt-0.5 leading-snug line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
