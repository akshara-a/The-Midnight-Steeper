'use client';

import { useState } from 'react';
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

interface WardrobeModalProps {
  outfit: WardrobeOutfit;
  onUpdateOutfit: (newOutfit: WardrobeOutfit) => void;
  onSay: (text: string) => void;
  onFloatEmoji: (emoji: string, x: number, y: number) => void;
  onClose: () => void;
}

type WardrobeTab = 'hats' | 'glasses' | 'neck';

export default function WardrobeModal({
  outfit,
  onUpdateOutfit,
  onSay,
  onFloatEmoji,
  onClose,
}: Readonly<WardrobeModalProps>) {
  const [activeTab, setActiveTab] = useState<WardrobeTab>('hats');

  const currentHat = WARDROBE_HATS.find((h) => h.id === outfit.hat) ?? WARDROBE_HATS[0];
  const currentGlasses = WARDROBE_GLASSES.find((g) => g.id === outfit.glasses) ?? WARDROBE_GLASSES[0];
  const currentNeck = WARDROBE_NECK.find((n) => n.id === outfit.neck) ?? WARDROBE_NECK[0];

  const equipHat = (item: WardrobeItemConfig<HatId>, e: React.MouseEvent) => {
    sounds.playEquip();
    const updated = { ...outfit, hat: item.id };
    onUpdateOutfit(updated);
    onSay(item.quote);
    onFloatEmoji(item.icon, e.clientX, e.clientY);
  };

  const equipGlasses = (item: WardrobeItemConfig<GlassesId>, e: React.MouseEvent) => {
    sounds.playEquip();
    const updated = { ...outfit, glasses: item.id };
    onUpdateOutfit(updated);
    onSay(item.quote);
    onFloatEmoji(item.icon, e.clientX, e.clientY);
  };

  const equipNeck = (item: WardrobeItemConfig<NeckwearId>, e: React.MouseEvent) => {
    sounds.playEquip();
    const updated = { ...outfit, neck: item.id };
    onUpdateOutfit(updated);
    onSay(item.quote);
    onFloatEmoji(item.icon, e.clientX, e.clientY);
  };

  const resetAll = () => {
    sounds.playPop();
    onUpdateOutfit(DEFAULT_WARDROBE);
    onSay('All stripped down to my natural fluffy fur! So breezy! 🦥');
  };

  const activeCount =
    (outfit.hat !== 'none' ? 1 : 0) +
    (outfit.glasses !== 'none' ? 1 : 0) +
    (outfit.neck !== 'none' ? 1 : 0);

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-3 bg-purple-950/45 backdrop-blur-sm">
      <div className="toy-card animate-modal w-full max-w-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="btn-chunky blue absolute top-3 right-3 w-11 h-11 sm:w-12 sm:h-12 text-xl flex items-center justify-center z-10"
        >
          ✕
        </button>

        <div className="flex items-center gap-2.5 mb-1 pr-14">
          <span className="text-3xl animate-bounce-soft">👒</span>
          <h2 className="text-2xl font-bold text-[#3b2a63]">Sunny&apos;s Dress-Up Closet</h2>
        </div>
        <p className="text-xs sm:text-sm text-[#3b2a63]/80 mb-4 font-medium">
          Dress Sunny in charming hats, glasses, and cozy neckwear just like Talking Tom!
        </p>

        {/* Current Equipped Outfit Strip */}
        <div className="p-3 mb-4 rounded-2xl bg-white/75 border-2 border-purple-200/80 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-purple-950 uppercase tracking-wider">Wearing:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold shadow-xs">
                {currentHat.icon} {currentHat.name}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold shadow-xs">
                {currentGlasses.icon} {currentGlasses.name}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-bold shadow-xs">
                {currentNeck.icon} {currentNeck.name}
              </span>
            </div>
          </div>
          {activeCount > 0 && (
            <button
              onClick={resetAll}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors"
            >
              Take Off All
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('hats');
            }}
            className={`py-2 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'hats'
                ? 'bg-purple-600 text-white shadow-md scale-[1.02]'
                : 'bg-white/80 text-purple-950 border-2 border-purple-100 hover:bg-white'
            }`}
          >
            <span>🎩</span>
            <span>Hats</span>
            {outfit.hat !== 'none' && <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('glasses');
            }}
            className={`py-2 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'glasses'
                ? 'bg-amber-500 text-white shadow-md scale-[1.02]'
                : 'bg-white/80 text-purple-950 border-2 border-purple-100 hover:bg-white'
            }`}
          >
            <span>👓</span>
            <span>Glasses</span>
            {outfit.glasses !== 'none' && <span className="w-2 h-2 rounded-full bg-purple-300 inline-block" />}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('neck');
            }}
            className={`py-2 px-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'neck'
                ? 'bg-rose-500 text-white shadow-md scale-[1.02]'
                : 'bg-white/80 text-purple-950 border-2 border-purple-100 hover:bg-white'
            }`}
          >
            <span>🧣</span>
            <span>Neckwear</span>
            {outfit.neck !== 'none' && <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" />}
          </button>
        </div>

        {/* Tab 1: HATS */}
        {activeTab === 'hats' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {WARDROBE_HATS.map((item) => {
              const isEquipped = outfit.hat === item.id;
              return (
                <button
                  key={item.id}
                  onClick={(e) => equipHat(item, e)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all flex items-start gap-3 relative overflow-hidden group ${
                    isEquipped
                      ? 'bg-purple-600/25 border-purple-500 ring-2 ring-purple-300 scale-[1.02] shadow-md'
                      : 'bg-white/75 border-purple-100 hover:border-purple-300 hover:bg-white/95'
                  }`}
                >
                  <span className="text-3xl mt-0.5 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm sm:text-base text-[#3b2a63]">{item.name}</span>
                      {isEquipped ? (
                        <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full shadow-xs shrink-0">
                          Equipped ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md shrink-0">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#3b2a63]/75 mt-0.5 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: GLASSES & MASKS */}
        {activeTab === 'glasses' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {WARDROBE_GLASSES.map((item) => {
              const isEquipped = outfit.glasses === item.id;
              return (
                <button
                  key={item.id}
                  onClick={(e) => equipGlasses(item, e)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all flex items-start gap-3 relative overflow-hidden group ${
                    isEquipped
                      ? 'bg-amber-500/25 border-amber-500 ring-2 ring-amber-300 scale-[1.02] shadow-md'
                      : 'bg-white/75 border-amber-100 hover:border-amber-300 hover:bg-white/95'
                  }`}
                >
                  <span className="text-3xl mt-0.5 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm sm:text-base text-[#3b2a63]">{item.name}</span>
                      {isEquipped ? (
                        <span className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full shadow-xs shrink-0">
                          Equipped ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#3b2a63]/75 mt-0.5 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 3: NECKWEAR */}
        {activeTab === 'neck' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {WARDROBE_NECK.map((item) => {
              const isEquipped = outfit.neck === item.id;
              return (
                <button
                  key={item.id}
                  onClick={(e) => equipNeck(item, e)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all flex items-start gap-3 relative overflow-hidden group ${
                    isEquipped
                      ? 'bg-rose-500/25 border-rose-500 ring-2 ring-rose-300 scale-[1.02] shadow-md'
                      : 'bg-white/75 border-rose-100 hover:border-rose-300 hover:bg-white/95'
                  }`}
                >
                  <span className="text-3xl mt-0.5 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm sm:text-base text-[#3b2a63]">{item.name}</span>
                      {isEquipped ? (
                        <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-xs shrink-0">
                          Equipped ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded-md shrink-0">
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#3b2a63]/75 mt-0.5 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
