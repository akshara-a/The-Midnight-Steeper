'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Ban,
  Bell,
  ChefHat,
  Cloud,
  Crown,
  Eye,
  EyeOff,
  Flower,
  Flower2,
  Glasses,
  Leaf,
  Moon,
  Ribbon,
  RotateCcw,
  Save,
  Search,
  Wand,
  Wind,
  type LucideIcon,
} from 'lucide-react';
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
import { CloseButton, plain, useEscape } from '@/components/ui';

const SlothPet3D = dynamic(() => import('@/components/SlothPet3D'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full flex flex-col items-center justify-center text-sm"
      style={{ color: 'var(--muted)' }}
    >
      <Moon size={36} strokeWidth={1.5} aria-hidden="true" className="animate-bounce-soft" />
      <span className="mt-2">Mirror loading...</span>
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

const ITEM_ICONS: Record<string, LucideIcon> = {
  wizard: Wand,
  crown: Crown,
  sakura: Flower2,
  chef: ChefHat,
  beanie: Cloud,
  nightcap: Moon,
  glasses: Glasses,
  sunglasses: Glasses,
  sleepmask: EyeOff,
  monocle: Search,
  bowtie: Ribbon,
  scarf: Wind,
  bell: Bell,
  lei: Flower,
};
const NONE_ICONS: Record<WardrobeTab, LucideIcon> = { hats: Ban, glasses: Eye, neck: Leaf };

function ItemIcon({ tab, id, size = 24 }: Readonly<{ tab: WardrobeTab; id: string; size?: number }>) {
  const Icon = id === 'none' ? NONE_ICONS[tab] : (ITEM_ICONS[id] ?? Leaf);
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />;
}

const TABS: { key: WardrobeTab; label: string; color: string; icon: LucideIcon }[] = [
  { key: 'hats', label: 'Hats', color: 'var(--lavender)', icon: Crown },
  { key: 'glasses', label: 'Glasses', color: 'var(--daisy)', icon: Glasses },
  { key: 'neck', label: 'Neck', color: 'var(--rose)', icon: Ribbon },
];

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
  useEscape(onClose);

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

  type Row = { id: string; name: string; tag: string; description: string };
  const catalog: {
    tab: WardrobeTab;
    items: Row[];
    equipped: string;
    color: string;
    toggle: (item: never, e: React.MouseEvent) => void;
  }[] = [
    { tab: 'hats', items: WARDROBE_HATS, equipped: draftOutfit.hat, color: 'var(--lavender)', toggle: toggleHat as never },
    { tab: 'glasses', items: WARDROBE_GLASSES, equipped: draftOutfit.glasses, color: 'var(--daisy)', toggle: toggleGlasses as never },
    { tab: 'neck', items: WARDROBE_NECK, equipped: draftOutfit.neck, color: 'var(--rose)', toggle: toggleNeck as never },
  ];
  const active = catalog.find((c) => c.tab === activeTab) ?? catalog[0];
  const worn: { tab: WardrobeTab; item: { id: string; name: string }; color: string }[] = [
    { tab: 'hats', item: currentHat, color: 'var(--lavender)' },
    { tab: 'glasses', item: currentGlasses, color: 'var(--daisy)' },
    { tab: 'neck', item: currentNeck, color: 'var(--rose)' },
  ];

  return (
    <div
      className="fixed inset-0 z-[50] flex items-center justify-center p-2 sm:p-4 backdrop-blur-md"
      style={{ background: 'rgba(15,13,26,0.8)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Dressing room"
    >
      <div
        className="surface animate-modal w-full max-w-4xl max-h-[96dvh] flex flex-col p-4 sm:p-6 relative overflow-hidden"
        style={{ background: 'var(--surface-solid)' }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between gap-3 pb-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-light" style={{ color: 'var(--text)' }}>
              Sunny&apos;s Dressing Room
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--muted)' }}>
              Try on outfits in the live mirror, then save your favorite look.
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {/* 2-Column Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 flex-1 min-h-0 overflow-y-auto md:overflow-hidden">
          {/* LEFT COLUMN: LIVE FITTING MIRROR */}
          <div
            className="flex flex-col gap-2.5 p-3"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Live Fitting Mirror
              </span>
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={
                  hasUnsavedChanges
                    ? {
                        background: 'color-mix(in srgb, var(--daisy) 18%, transparent)',
                        color: 'var(--daisy)',
                        border: '1px solid color-mix(in srgb, var(--daisy) 40%, transparent)',
                      }
                    : { background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
                }
              >
                {hasUnsavedChanges ? 'Previewing new look' : 'Current outfit'}
              </span>
            </div>

            {/* 3D mirror frame */}
            <div
              className="relative overflow-hidden h-[220px] sm:h-[280px] md:h-[310px]"
              style={{
                borderRadius: 'var(--radius)',
                border: '1.5px solid var(--border-strong)',
                background:
                  'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(201,167,255,0.18), rgba(255,255,255,0.03))',
              }}
            >
              <SlothPet3D
                mood="happy"
                furColor={furColor}
                accentColor={accentColor}
                pokeCount={mirrorPokes}
                onPoke={handleMirrorPoke}
                theme={theme}
                wardrobe={draftOutfit}
              />

              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90%] max-w-xs z-10 pointer-events-none">
                <div className="bubble py-1.5 px-3 text-center text-xs sm:text-sm leading-tight" role="status">
                  {plain(previewQuote)}
                </div>
              </div>

              <div
                className="absolute bottom-2 left-2 z-10 pointer-events-none text-[11px] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(27,22,54,0.85)', color: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                Tap Sunny to pose
              </div>
            </div>

            {/* Wearing summary */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                In mirror:
              </span>
              {worn.map(({ tab, item, color }) => (
                <span
                  key={tab}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    color: 'var(--text)',
                    background: `color-mix(in srgb, ${color} 14%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
                  }}
                >
                  <span style={{ color }}>
                    <ItemIcon tab={tab} id={item.id} size={14} />
                  </span>
                  {plain(item.name)}
                </span>
              ))}
            </div>

            {/* Save & Reset */}
            <div className="flex flex-col gap-2 mt-auto pt-1">
              <button onClick={handleSave} className="btn-pill primary w-full px-5 text-base">
                <Save size={20} strokeWidth={1.5} aria-hidden="true" />
                <span>Save Outfit</span>
              </button>

              <div className="flex items-center justify-between gap-2 text-sm">
                {hasUnsavedChanges ? (
                  <button onClick={revertToCurrent} className="btn-pill px-4 text-sm">
                    <RotateCcw size={16} strokeWidth={1.5} aria-hidden="true" />
                    Revert to saved
                  </button>
                ) : (
                  <span style={{ color: 'var(--muted)' }}>No changes yet</span>
                )}
                <button onClick={resetAllDraft} className="btn-pill px-4 text-sm">
                  Take off all
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CATALOG */}
          <div className="flex flex-col gap-2.5 flex-1 min-h-0">
            <div className="grid grid-cols-3 gap-2 shrink-0" role="tablist" aria-label="Outfit categories">
              {TABS.map(({ key, label, color, icon: Icon }) => {
                const selected = activeTab === key;
                const hasItem = catalog.find((c) => c.tab === key)?.equipped !== 'none';
                return (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={selected}
                    onClick={() => {
                      sounds.playClick();
                      setActiveTab(key);
                    }}
                    className="pick-card min-h-12 px-2 text-sm font-semibold flex items-center justify-center gap-1.5"
                    style={{ ['--sel' as string]: color }}
                    data-selected={selected}
                  >
                    <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                    <span>{label}</span>
                    {hasItem && (
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ background: color }}
                        role="img"
                        aria-label="Item on"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0" role="tabpanel">
              {active.items.map((item) => {
                const isEquipped = active.equipped === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={(e) => active.toggle(item as never, e)}
                    aria-pressed={isEquipped}
                    data-selected={isEquipped}
                    className="pick-card w-full min-h-[60px] p-3 text-left flex items-start gap-3"
                    style={{ ['--sel' as string]: active.color }}
                  >
                    <span className="mt-0.5 shrink-0" style={{ color: active.color }}>
                      <ItemIcon tab={active.tab} id={item.id} size={28} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm sm:text-base">{plain(item.name)}</span>
                        {isEquipped ? (
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: active.color, color: 'var(--accent-ink)' }}
                          >
                            In mirror
                          </span>
                        ) : (
                          <span className="text-[11px] shrink-0" style={{ color: 'var(--muted)' }}>
                            {plain(item.tag)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 leading-snug line-clamp-2" style={{ color: 'var(--muted)' }}>
                        {plain(item.description)}
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
