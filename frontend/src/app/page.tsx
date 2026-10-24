'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  fetchMe,
  fetchCurrentBrew,
  startBrew,
  claimBrew,
  UserProfile,
  BrewItem,
  Loot
} from '@/lib/api';
import { DURATION_TIERS, customerTarget, bonusXp } from '@/lib/customers';
import { getPlayerId } from '@/lib/identity';
import { sounds } from '@/lib/soundEffects';
import Starfield from '@/components/Starfield';
import ProgressRing from '@/components/ProgressRing';

const CosmicVat3D = dynamic(() => import('@/components/CosmicVat3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 sm:h-96 rounded-3xl bg-slate-950/80 border border-indigo-900/40 flex flex-col items-center justify-center font-mono text-xs text-indigo-400 animate-pulse">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-cyan-400 rounded-full animate-spin mb-3" />
      <span>INITIALIZING QUANTUM CRUCIBLE 3D ENGINE...</span>
    </div>
  ),
});

interface IngredientInfo {
  name: string;
  element: string;
  icon: string;
  description: string;
  color: string;
  hex: string;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

interface AchievementToast {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
}

const INGREDIENTS_BASE: IngredientInfo[] = [
  { name: 'Nebula Dust', element: 'COSMIC', icon: '🌌', description: 'Pulverized stardust with sweet ozone aroma', color: 'from-purple-600 to-indigo-600', hex: '#a855f7' },
  { name: 'Void Water', element: 'DARK MATTER', icon: '🕳️', description: 'Zero-entropy liquid from event horizon rims', color: 'from-cyan-600 to-blue-700', hex: '#06b6d4' },
  { name: 'Astral Lavender', element: 'FLORA', icon: '🪻', description: 'Calms neural pathways across 4 dimensions', color: 'from-violet-500 to-purple-700', hex: '#8b5cf6' },
  { name: 'Supernova Jasmine', element: 'SOLAR', icon: '✨', description: 'Harvested in the flash of stellar collapse', color: 'from-amber-500 to-orange-600', hex: '#f59e0b' },
  { name: 'Lunar Mint', element: 'CRYO', icon: '❄️', description: 'Sub-zero crystal leaf grown in crater shadows', color: 'from-emerald-500 to-teal-700', hex: '#10b981' },
  { name: 'Solar Flare Zest', element: 'PLASMA', icon: '☀️', description: 'High-energy citrus charged with gamma rays', color: 'from-rose-500 to-red-600', hex: '#f43f5e' },
];

const INGREDIENTS_INFUSION: IngredientInfo[] = [
  { name: 'Chronos Honey', element: 'TEMPORAL', icon: '🍯', description: 'Crystallized time distilled by chronos bees', color: 'from-amber-400 to-yellow-600', hex: '#eab308' },
  { name: 'Comet Dust Ginger', element: 'KINETIC', icon: '☄️', description: 'Spicy root infused with orbital velocity', color: 'from-orange-500 to-rose-600', hex: '#fb923c' },
  { name: 'Meteorite Cardamom', element: 'GEO', icon: '🪨', description: 'Heavy mineral pods with interstellar fragrance', color: 'from-stone-400 to-slate-600', hex: '#94a3b8' },
  { name: 'Dark Matter Cinnamon', element: 'GRAVITY', icon: '🪵', description: 'Distorts local gravity to intensify flavor', color: 'from-indigo-600 to-violet-900', hex: '#6366f1' },
  { name: 'Orbital Sage', element: 'PSYCHIC', icon: '🌿', description: 'Resonates with telepathic frequencies', color: 'from-teal-400 to-emerald-700', hex: '#14b8a6' },
  { name: 'Zero-G Vanilla', element: 'VACUUM', icon: '🍦', description: 'Weightless bean with velvety celestial finish', color: 'from-pink-400 to-purple-500', hex: '#ec4899' },
];

const RADAR_PINGS = [
  'Deep-space scanner active: Sector 9 clear.',
  'Radar ping: Cargo cruiser from Vega entering quadrant...',
  'Interdimensional wake detected in sector 4.',
  'Atmospheric sensors: Entity "Zorblatt" within tea scent radius.',
  'Stellar wind calming down across the outpost.',
  'Thermal scan: Nebula particles reaching optimal steeping heat.',
  'Chronometer resonance: Molecular flavor binding in progress.',
  'Sloth Engine: Zero-action protocol running at 100% efficiency.',
];

const TRAVELER_DOSSIERS = [
  { name: 'Zorblatt-7', species: 'Gaseous Hivemind', sector: 'Sector 4', lore: 'Communicates through chromatic fluctuations. Craves high-gravity teas.' },
  { name: 'Chronos Monk Kael', species: 'Temporal Nomad', sector: 'Vega Rift', lore: 'Has lived through 14 universal resets. Prefers Chronos Honey brews.' },
  { name: 'Captain Vex', species: 'Cybernetic Smuggler', sector: 'Orion Rim', lore: 'Trades asteroid spice for dark matter infusions. Highly impatient.' },
  { name: 'Astraea', species: 'Solar Seraph', sector: 'Helios Core', lore: 'Bathes in gamma rays. Finds Lunar Mint delightfully chill.' },
];

const RANKS = [
  'Drowsy Apprentice',
  'Moonlit Brewer',
  'Stardust Steeper',
  'Nebula Alchemist',
  'Void Sommelier',
  'Cosmic Archmage',
  'Eternal Sloth Sage',
];

const getRank = (level: number) => RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 2))];

/** Deterministic pair synergy so every combo feels distinct and rewards experimentation. */
const getSynergy = (base: IngredientInfo, infusion: IngredientInfo) => {
  const seed = (base.name + infusion.name).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const power = 60 + (seed % 41);
  const tiers = [
    { min: 95, label: 'LEGENDARY', color: 'text-amber-300 border-amber-500/70 bg-amber-950/50' },
    { min: 85, label: 'RESONANT', color: 'text-fuchsia-300 border-fuchsia-500/70 bg-fuchsia-950/50' },
    { min: 72, label: 'HARMONIC', color: 'text-cyan-300 border-cyan-500/70 bg-cyan-950/50' },
    { min: 0, label: 'STABLE', color: 'text-emerald-300 border-emerald-500/70 bg-emerald-950/50' },
  ];
  const tier = tiers.find((t) => power >= t.min)!;
  return { power, ...tier };
};

const RARITY_AURA: Record<string, string> = {
  legendary: '#f59e0b',
  rare: '#a855f7',
  common: '#10b981',
};

export default function MidnightSteeperPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentBrew, setCurrentBrew] = useState<BrewItem | null>(null);
  const [selectedBase, setSelectedBase] = useState<string>(INGREDIENTS_BASE[0].name);
  const [selectedInfusion, setSelectedInfusion] = useState<string>(INGREDIENTS_INFUSION[0].name);
  const [isStarting, setIsStarting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [lootModal, setLootModal] = useState<Loot | null>(null);
  const [durationKey, setDurationKey] = useState<string>('quick');
  const servedRef = useRef(0);
  const [playerId, setPlayerId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [radarLog, setRadarLog] = useState<string[]>(RADAR_PINGS.slice(0, 3));
  const [isShaking, setIsShaking] = useState(false);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [achievementToast, setAchievementToast] = useState<AchievementToast | null>(null);
  const [typewriterText, setTypewriterText] = useState<string>('');
  const [started, setStarted] = useState(false);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [sessionBrews, setSessionBrews] = useState(0);
  const [sessionClaims, setSessionClaims] = useState(0);
  const [sessionPicks, setSessionPicks] = useState(0);
  const prevLevelRef = useRef<number | null>(null);

  // Traveler voice: the browser's built-in speech synthesis (free, local, no API)
  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.pitch = 0.8;
    utt.rate = 0.95;
    window.speechSynthesis.speak(utt);
  }, []);

  // Trigger floating action text (RPG damage/gain text style)
  const spawnFloatingText = (text: string, x?: number, y?: number, color = '#a855f7') => {
    const id = Date.now() + Math.random();
    const spawnX = x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200);
    const spawnY = y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 300);
    setFloatingTexts((prev) => [...prev, { id, text, x: spawnX, y: spawnY, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1300);
  };

  // Radial particle burst at a screen position
  const spawnBurst = (x: number, y: number, color: string) => {
    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, { id, x, y, color }]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 950);
  };

  // Trigger game screen shake
  const triggerScreenShake = () => {
    setIsShaking(true);
    sounds.playImpact();
    setTimeout(() => setIsShaking(false), 450);
  };

  // Trigger achievement toast notification
  const triggerAchievement = (title: string, subtitle: string, icon = '🏆') => {
    sounds.playAchievement();
    const toastItem: AchievementToast = { id: Date.now(), title, subtitle, icon };
    setAchievementToast(toastItem);
    setTimeout(() => {
      setAchievementToast((prev) => (prev?.id === toastItem.id ? null : prev));
    }, 4500);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) {
      sounds.playClick();
      spawnFloatingText('🔊 AUDIO ONLINE', undefined, undefined, '#10b981');
    } else {
      spawnFloatingText('🔇 AUDIO MUTED', undefined, undefined, '#94a3b8');
    }
  };

  const loadData = useCallback(async () => {
    try {
      setErrorMsg(null);
      const [userData, brewData] = await Promise.all([
        fetchMe(),
        fetchCurrentBrew(),
      ]);
      setUser(userData);
      setCurrentBrew(brewData.brew);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Telemetry offline';
      setErrorMsg(msg);
    }
  }, []);

  useEffect(() => {
    setPlayerId(getPlayerId());
    loadData();
  }, [loadData]);

  // Sloth Engine Countdown
  useEffect(() => {
    if (!currentBrew || currentBrew.status !== 'brewing') {
      setRemainingSeconds(null);
      return;
    }

    const calculateRemaining = () => {
      const readyTimestamp = new Date(currentBrew.ready_time).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((readyTimestamp - now) / 1000));
      setRemainingSeconds(diff);

      if (diff === 0) {
        sounds.playLootFanfare();
        triggerAchievement('HARVEST READY!', 'A celestial traveler visited your outpost.', '✨');
        loadData();
      }
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [currentBrew, loadData]);

  // Polling during active steep
  useEffect(() => {
    if (currentBrew?.status === 'brewing') {
      const pollTimer = setInterval(() => {
        loadData();
      }, 3000);
      return () => clearInterval(pollTimer);
    }
  }, [currentBrew?.status, loadData]);

  // Live Radar Simulator
  useEffect(() => {
    if (currentBrew?.status !== 'brewing') return;
    const radarInterval = setInterval(() => {
      const randomPing = RADAR_PINGS[Math.floor(Math.random() * RADAR_PINGS.length)];
      setRadarLog((prev) => [randomPing, ...prev.slice(0, 3)]);
    }, 4500);
    return () => clearInterval(radarInterval);
  }, [currentBrew?.status]);

  // Typewriter effect for traveler review when loot modal pops up
  useEffect(() => {
    if (!lootModal?.review) {
      setTypewriterText('');
      return;
    }
    setTypewriterText('');
    let idx = 0;
    const fullText = lootModal.review;
    const timer = setInterval(() => {
      if (idx < fullText.length) {
        setTypewriterText(fullText.slice(0, idx + 1));
        if (idx % 3 === 0) sounds.playTypewriterTick();
        idx++;
      } else {
        clearInterval(timer);
      }
    }, 28);
    return () => clearInterval(timer);
  }, [lootModal]);

  // Speak the traveler's review when the loot card is revealed
  useEffect(() => {
    if (lootModal?.review && soundEnabled) speak(lootModal.review);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lootModal, speak]);

  const handleStartBrew = async (e: React.MouseEvent) => {
    if (isStarting) return;
    triggerScreenShake();
    sounds.playIgnite();
    spawnFloatingText('⚡ CORE IGNITED! +100 XP', e.clientX, e.clientY, '#ec4899');
    spawnBurst(e.clientX, e.clientY, '#ec4899');
    setIsStarting(true);
    setErrorMsg(null);
    try {
      const res = await startBrew([selectedBase, selectedInfusion], durationKey);
      setCurrentBrew(res.brew);
      setSessionBrews((n) => n + 1);
      triggerAchievement('SLOTH ENGINE ENGAGED', `${tier.label} steep locked in. Target: ${target} customers.`, '⏳');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Crucible ignition error';
      setErrorMsg(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const handleClaim = async (e: React.MouseEvent) => {
    if (isClaiming) return;
    triggerScreenShake();
    sounds.playLootFanfare();
    spawnFloatingText('🎁 HARVEST CLAIMED! +250 XP', e.clientX, e.clientY, '#10b981');
    spawnBurst(e.clientX, e.clientY, '#fbbf24');
    setIsClaiming(true);
    setErrorMsg(null);
    try {
      const res = await claimBrew(currentBrew?.brew_id);
      setLootModal(res.loot);
      setSessionClaims((n) => n + 1);
      setCurrentBrew(null);
      triggerAchievement('CELESTIAL HARVEST CLAIMED', `Acquired: ${res.loot.item_name}`, '⭐');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Harvest retrieval error';
      setErrorMsg(msg);
    } finally {
      setIsClaiming(false);
    }
  };

  const formatTimer = (totalSeconds: number | null): string => {
    if (totalSeconds === null) return '--:--:--';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const isBrewing = currentBrew?.status === 'brewing';
  const isReady = currentBrew?.status === 'ready';
  const isIdle = !currentBrew || currentBrew.status === 'claimed';

  const baseItem = INGREDIENTS_BASE.find((i) => i.name === selectedBase) || INGREDIENTS_BASE[0];
  const infusionItem = INGREDIENTS_INFUSION.find((i) => i.name === selectedInfusion) || INGREDIENTS_INFUSION[0];

  // Calculate Barista Level & XP Progression
  const streak = user?.consistency_score ?? 1;
  const invCount = user?.inventory?.length ?? 0;
  const bonusTotal = (user?.inventory ?? []).reduce((sum, i) => sum + (i.bonus_xp ?? 0), 0);
  const totalXP = invCount * 250 + streak * 100 + bonusTotal;
  const currentXP = totalXP % 1000;
  const playerLevel = Math.max(1, Math.floor(totalXP / 1000) + 1);

  useEffect(() => {
    if (!user) return;
    if (prevLevelRef.current !== null && playerLevel > prevLevelRef.current) {
      setLevelUp(playerLevel);
      sounds.playAchievement();
      setTimeout(() => setLevelUp(null), 2500);
    }
    prevLevelRef.current = playerLevel;
  }, [user, playerLevel]);

  const synergy = getSynergy(baseItem, infusionItem);
  const tier = DURATION_TIERS.find((t) => t.key === durationKey) ?? DURATION_TIERS[0];
  const target = customerTarget(durationKey, [selectedBase, selectedInfusion]);

  // Customers who have already walked in, derived from the server-decided arrival schedule
  const arrivals = currentBrew?.customer_arrivals ?? [];
  const brewTarget = currentBrew?.customers_target ?? 0;
  const elapsed = currentBrew && remainingSeconds !== null ? currentBrew.duration_seconds - remainingSeconds : 0;
  const served = isReady ? arrivals.length : isBrewing ? arrivals.filter((o) => o <= elapsed).length : 0;

  // Announce each new customer as the steep progresses
  useEffect(() => {
    if (!isBrewing) {
      servedRef.current = served;
      return;
    }
    if (served > servedRef.current) {
      const traveler = TRAVELER_DOSSIERS[served % TRAVELER_DOSSIERS.length];
      sounds.playEquip();
      spawnFloatingText(`🛸 CUSTOMER #${served} ARRIVED`, undefined, window.innerHeight * 0.35, '#22d3ee');
      setRadarLog((prev) => [`${traveler.name} (${traveler.species}) docked and ordered a steep.`, ...prev.slice(0, 3)]);
    }
    servedRef.current = served;
  }, [served, isBrewing]);
  const brewProgress =
    remainingSeconds !== null && currentBrew?.duration_seconds
      ? 1 - remainingSeconds / currentBrew.duration_seconds
      : isReady
        ? 1
        : 0;

  const quests = [
    { label: 'Calibrate both dispensers', done: sessionPicks >= 2, reward: '+50 XP' },
    { label: 'Ignite the Quantum Vat', done: sessionBrews > 0 || isBrewing || isReady, reward: '+100 XP' },
    { label: 'Claim a celestial harvest', done: sessionClaims > 0, reward: '+250 XP' },
  ];
  const questsDone = quests.filter((q) => q.done).length;

  const getRarityBadgeStyle = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return 'bg-gradient-to-r from-amber-500/30 to-yellow-500/30 text-amber-300 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)]';
      case 'rare':
        return 'bg-gradient-to-r from-purple-500/30 to-indigo-500/30 text-purple-300 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.6)]';
      default:
        return 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.6)]';
    }
  };

  return (
    <main
      className={`relative min-h-screen flex flex-col justify-between p-3 sm:p-6 bg-slate-950 text-slate-100 font-mono select-none overflow-x-hidden cyber-grid ${
        isShaking ? 'animate-shake' : ''
      }`}
    >
      <Starfield tint={baseItem.hex} />
      <div className="crt-vignette" />
      <div className="cosmic-scanline" />

      {/* Click particle bursts */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {bursts.map((b) => (
          <div key={b.id} className="absolute" style={{ left: b.x, top: b.y }}>
            {Array.from({ length: 14 }, (_, i) => {
              const a = (i / 14) * Math.PI * 2 + (i % 3) * 0.13;
              const d = 40 + ((i * 37) % 50);
              return (
                <span
                  key={i}
                  className="shard"
                  style={
                    {
                      background: b.color,
                      boxShadow: `0 0 8px ${b.color}`,
                      '--dx': `${Math.cos(a) * d}px`,
                      '--dy': `${Math.sin(a) * d}px`,
                    } as React.CSSProperties
                  }
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Level-up banner */}
      {levelUp !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-levelup text-center">
            <div className="text-xs font-black tracking-[0.5em] text-amber-300">RANK UP</div>
            <div className="neon-title text-5xl sm:text-7xl font-black tracking-widest">LEVEL {levelUp}</div>
            <div className="text-sm text-cyan-300 tracking-widest mt-1 uppercase">{getRank(levelUp)}</div>
          </div>
        </div>
      )}

      {/* Title screen / press start (also unlocks browser audio) */}
      {!started && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-sm text-center px-4">
          <div className="animate-title-float">
            <div className="text-7xl mb-4 drop-shadow-[0_0_30px_rgba(168,85,247,0.9)]">🍵</div>
            <h1 className="neon-title text-4xl sm:text-6xl font-black tracking-[0.2em] uppercase">The Midnight Steeper</h1>
            <p className="text-xs sm:text-sm text-indigo-300 tracking-[0.35em] mt-3 uppercase">An Interdimensional Idle Teahouse</p>
          </div>
          <button
            onClick={() => {
              sounds.playIgnite();
              setStarted(true);
            }}
            className="btn-arcade mt-14 px-10 py-4 rounded-2xl border-2 border-cyan-300 bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 text-white font-black tracking-[0.3em] text-sm cursor-pointer shadow-[0_0_40px_rgba(34,211,238,0.5)]"
          >
            ▶ PRESS START
          </button>
          <p className="animate-blink mt-6 text-[10px] text-slate-500 tracking-widest uppercase">Click to enter the outpost • sound on</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💥 FLOATING RPG COMBAT/ACTION NUMBERS */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingTexts.map((f) => (
          <div
            key={f.id}
            style={{ left: f.x - 60, top: f.y - 20, color: f.color }}
            className="absolute font-black text-sm sm:text-base tracking-widest drop-shadow-[0_0_12px_currentColor] animate-float-text whitespace-nowrap"
          >
            {f.text}
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 🏆 IN-GAME ACHIEVEMENT DROP-DOWN TOAST */}
      {/* ========================================================================= */}
      {achievementToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-achievement-drop max-w-md w-full px-4">
          <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border-2 border-amber-400/90 rounded-2xl p-4 shadow-[0_0_35px_rgba(245,158,11,0.5)] flex items-center space-x-3.5 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              {achievementToast.icon}
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                ACHIEVEMENT UNLOCKED
              </div>
              <div className="text-sm font-black text-white tracking-wide">
                {achievementToast.title}
              </div>
              <div className="text-xs text-slate-300 font-sans">
                {achievementToast.subtitle}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🛸 TOP COCKPIT HUD CONSOLE */}
      {/* ========================================================================= */}
      <header className="hud-panel relative z-10 w-full max-w-6xl mx-auto p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Outpost Branding */}
        <div className="flex items-center space-x-3.5">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(168,85,247,0.6)] border border-white/20 animate-pulse-glow">
            🍵
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm sm:text-base font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-indigo-100 to-pink-300 uppercase">
                The Midnight Steeper
              </span>
              <span className="text-[10px] bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-600 text-indigo-300 font-bold uppercase tracking-wider">
                SECTOR 9
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Interdimensional Idle Teahouse • Edge of Universe
            </p>
          </div>
        </div>

        {/* Cockpit Telemetry Widgets */}
        <div className="flex items-center space-x-2.5 sm:space-x-4">
          {/* Barista Level & XP Bar */}
          <div className="bg-black/60 px-3.5 py-1.5 rounded-xl border border-indigo-800/80 flex flex-col justify-center min-w-[220px]">
            <div className="flex items-center justify-between text-[9px] uppercase font-bold text-indigo-300 tracking-wider">
              <span className="truncate mr-3">LVL {playerLevel} · {getRank(playerLevel)}</span>
              <span className="text-cyan-400 whitespace-nowrap">{currentXP}/1000 XP</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden border border-indigo-900">
              <div
                className="xp-fill h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                style={{ width: `${(currentXP / 1000) * 100}%` }}
              />
            </div>
          </div>

          {/* Consistency Streak Flame */}
          <div className="bg-black/50 px-3 py-1.5 rounded-xl border border-indigo-800/80">
            <div className="text-[9px] uppercase text-amber-400/80 font-bold tracking-wider">
              Streak
            </div>
            <div className="text-xs font-black text-amber-400 flex items-center space-x-1">
              <span>🔥 x{streak}</span>
            </div>
          </div>

          {/* Codex & Lore Menu Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowCodex(true);
            }}
            onMouseEnter={() => sounds.playHover()}
            title="Open Recipe Codex & Traveler Log"
            className="px-3 py-2 rounded-xl text-xs font-black border border-cyan-500/50 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer active:scale-95 flex items-center space-x-1.5"
          >
            <span>📖</span>
            <span className="hidden sm:inline">CODEX</span>
          </button>

          {/* Sound FX Switch */}
          <button
            onClick={toggleSound}
            onMouseEnter={() => sounds.playHover()}
            title="Toggle Procedural Audio"
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer active:scale-95 ${
              soundEnabled
                ? 'bg-purple-950/70 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? '🔊 SFX' : '🔇 MUTE'}
          </button>

          {/* Vault Archive Access Button */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowInventory(true);
            }}
            onMouseEnter={() => sounds.playHover()}
            className="px-4 py-2 rounded-xl text-xs font-black border border-indigo-400/80 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 hover:from-indigo-600 hover:to-pink-600 transition shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <span>🎒 VAULT</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black">
              {invCount}
            </span>
          </button>
        </div>
      </header>

      {/* Diagnostics Sub-bar */}
      <div className="w-full max-w-6xl mx-auto my-2 px-3 flex justify-between items-center text-[10px] text-indigo-400/70 font-mono">
        <div className="flex space-x-4">
          <span>STATION STATUS: <strong className="text-emerald-400 font-bold">ONLINE</strong></span>
          <span className="hidden sm:inline">QUANTUM CORE: <strong className="text-indigo-300">4,210 K (STABLE)</strong></span>
          <span className="hidden sm:inline">PILOT ID: <strong className="text-slate-300">{playerId ? playerId.slice(0, 10) : '---'}</strong></span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Animated Ambient Equalizer */}
          <div className="flex items-end space-x-0.5 h-3">
            {[40, 90, 60, 100, 75, 45, 80].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-cyan-400 rounded-full animate-pulse"
                style={{ height: `${h}%`, animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <span>SLOTH ENGINE: <strong className="text-purple-400 font-bold">ACTIVE</strong></span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🔮 MAIN GAME ARENA (3D Quantum Crucible Stage) */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center my-2">
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl border border-red-500/60 bg-red-950/80 text-red-200 text-xs w-full max-w-lg text-center font-sans animate-shake">
            ⚠️ SYSTEM ALERT: {errorMsg}
          </div>
        )}

        {/* Central Alchemy Station Panel */}
        <div className="hud-panel w-full p-5 sm:p-8 relative overflow-hidden">
          {/* Sci-Fi Corner Brackets */}
          <div className="absolute top-3 left-3 text-indigo-500/40 text-xs font-mono font-bold select-none pointer-events-none">⌜ BAY.01 ⌝</div>
          <div className="absolute top-3 right-3 text-indigo-500/40 text-xs font-mono font-bold select-none pointer-events-none">⌜ SYNTH.SYS ⌝</div>
          <div className="absolute bottom-3 left-3 text-indigo-500/40 text-xs font-mono font-bold select-none pointer-events-none">⌞ IDLE.ENG ⌟</div>
          <div className="absolute bottom-3 right-3 text-indigo-500/40 text-xs font-mono font-bold select-none pointer-events-none">⌞ STEEPER.V2 ⌟</div>

          {/* Daily mission tracker */}
          <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left relative z-10">
            {quests.map((q) => (
              <div
                key={q.label}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-[11px] font-sans transition ${
                  q.done ? 'border-emerald-500/70 bg-emerald-950/40 text-emerald-200' : 'border-indigo-900/70 bg-black/40 text-slate-300'
                }`}
              >
                <span
                  className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center text-[11px] font-black ${
                    q.done ? 'bg-emerald-400 border-emerald-200 text-slate-950 animate-check-pop' : 'border-indigo-700 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span className="flex-1 leading-tight">{q.label}</span>
                <span className="text-[9px] font-mono text-amber-300">{q.reward}</span>
              </div>
            ))}
            <div className="sm:col-span-3 text-[9px] font-mono text-indigo-400/70 tracking-widest uppercase">
              MISSIONS {questsDone}/{quests.length}
            </div>
          </div>

          {/* 3D React Three Fiber Quantum Crucible */}
          <div className="w-full mb-6 relative">
            <CosmicVat3D
              status={isReady ? 'ready' : isBrewing ? 'brewing' : 'idle'}
              primaryColor={baseItem.hex}
              secondaryColor={infusionItem.hex}
            />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* STATE 1: IDLE (Tactile Holographic Dispensers) */}
          {/* ------------------------------------------------------------- */}
          {isIdle && (
            <div className="flex flex-col items-center">
              {/* Dual Ingredient Dispenser Grids */}
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 text-left">
                {/* Bay 1: Primary Essence */}
                <div className="bg-black/60 border border-indigo-800/80 rounded-2xl p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                      [DISPENSER ALPHA: PRIMARY FLORA]
                    </span>
                    <span className="text-[10px] font-bold bg-indigo-950 px-2 py-0.5 rounded text-indigo-300 border border-indigo-800">
                      {baseItem.element}
                    </span>
                  </div>

                  {/* Tactile Ingredient Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {INGREDIENTS_BASE.map((item) => {
                      const isSelected = selectedBase === item.name;
                      return (
                        <button
                          key={item.name}
                          onClick={(e) => {
                            sounds.playEquip();
                            setSelectedBase(item.name);
                            setSessionPicks((n) => Math.max(n, 1));
                            spawnBurst(e.clientX, e.clientY, item.hex);
                            spawnFloatingText(`+50 ${item.element}!`, e.clientX, e.clientY, item.hex);
                          }}
                          onMouseEnter={() => sounds.playHover()}
                          data-selected={isSelected}
                          title={item.description}
                          className={`ingredient-card p-2.5 rounded-xl border text-left cursor-pointer flex flex-col justify-between h-24 ${
                            isSelected
                              ? 'bg-gradient-to-br ' + item.color + ' border-white text-white shadow-[0_0_20px_rgba(168,85,247,0.6)] '
                              : 'bg-slate-900/90 border-indigo-900/70 text-slate-300 hover:border-indigo-500 hover:bg-slate-800/80 hover:scale-[1.01]'
                          }`}
                        >
                          <div className="text-xl">{item.icon}</div>
                          <div>
                            <div className="text-[11px] font-black leading-tight truncate">{item.name}</div>
                            <div className="text-[8px] opacity-75 font-mono">{item.element}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bay 2: Catalytic Infusion */}
                <div className="bg-black/60 border border-indigo-800/80 rounded-2xl p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                      [DISPENSER BETA: CATALYTIC INFUSION]
                    </span>
                    <span className="text-[10px] font-bold bg-indigo-950 px-2 py-0.5 rounded text-indigo-300 border border-indigo-800">
                      {infusionItem.element}
                    </span>
                  </div>

                  {/* Tactile Ingredient Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {INGREDIENTS_INFUSION.map((item) => {
                      const isSelected = selectedInfusion === item.name;
                      return (
                        <button
                          key={item.name}
                          onClick={(e) => {
                            sounds.playEquip();
                            setSelectedInfusion(item.name);
                            setSessionPicks((n) => Math.max(n, 2));
                            spawnBurst(e.clientX, e.clientY, item.hex);
                            spawnFloatingText(`INFUSED: ${item.element}!`, e.clientX, e.clientY, item.hex);
                          }}
                          onMouseEnter={() => sounds.playHover()}
                          data-selected={isSelected}
                          title={item.description}
                          className={`ingredient-card p-2.5 rounded-xl border text-left cursor-pointer flex flex-col justify-between h-24 ${
                            isSelected
                              ? 'bg-gradient-to-br ' + item.color + ' border-white text-white shadow-[0_0_20px_rgba(6,182,212,0.6)] '
                              : 'bg-slate-900/90 border-indigo-900/70 text-slate-300 hover:border-cyan-500 hover:bg-slate-800/80 hover:scale-[1.01]'
                          }`}
                        >
                          <div className="text-xl">{item.icon}</div>
                          <div>
                            <div className="text-[11px] font-black leading-tight truncate">{item.name}</div>
                            <div className="text-[8px] opacity-75 font-mono">{item.element}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Steep length & customer quota */}
              <div className="w-full mb-6 text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">[STEEP LENGTH]</span>
                  <span className="text-[10px] font-mono text-indigo-300">
                    TARGET: <strong className="text-white">{target} CUSTOMERS</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {DURATION_TIERS.map((t) => {
                    const active = t.key === durationKey;
                    return (
                      <button
                        key={t.key}
                        onClick={() => {
                          sounds.playEquip();
                          setDurationKey(t.key);
                        }}
                        onMouseEnter={() => sounds.playHover()}
                        className={`rounded-xl border px-3 py-2.5 text-left cursor-pointer transition ${
                          active
                            ? 'border-amber-300 bg-gradient-to-br from-amber-500/30 to-orange-600/20 text-white shadow-[0_0_18px_rgba(245,158,11,0.45)]'
                            : 'border-indigo-900/70 bg-slate-900/80 text-slate-300 hover:border-amber-500/60'
                        }`}
                      >
                        <div className="text-[11px] font-black uppercase">{t.label}</div>
                        <div className="text-[9px] font-mono opacity-80">
                          {t.key === 'quick' ? 'TEST RUN' : 'SLOTH CYCLE'} · {t.baseTarget}+ guests
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-slate-400 font-sans leading-relaxed">
                  Customers arrive while you steep. Meet or beat the target to keep your rarity; fall short and the harvest
                  drops a tier. Better synergy and a longer streak bring more guests.
                </p>
              </div>

              {/* Recipe Forecast Banner */}
              <div className="w-full mb-6 p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/50 to-pink-950/40 border border-indigo-700/50 text-xs flex flex-wrap items-center justify-between gap-2 shadow-inner">
                <div className="flex items-center space-x-2">
                  <span className="text-purple-300 font-bold">Planned Infusion:</span>
                  <span className="font-black text-white tracking-wide text-sm">
                    {baseItem.icon} {selectedBase} + {infusionItem.icon} {selectedInfusion}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono border px-2 py-0.5 rounded-full font-black ${synergy.color}`}>
                    SYNERGY: {synergy.label} · {synergy.power}%
                  </span>
                  <span className="text-[10px] text-indigo-300 font-mono bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700">
                    {tier.label.toUpperCase()} SLOTH CYCLE
                  </span>
                </div>
              </div>

              {/* Arcade Ignition Trigger Button */}
              <button
                onClick={handleStartBrew}
                disabled={isStarting}
                onMouseEnter={() => sounds.playHover()}
                className="btn-arcade w-full sm:w-96 py-4 px-8 rounded-2xl font-black text-sm uppercase tracking-widest text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all shadow-[0_0_35px_rgba(168,85,247,0.7)] border-2 border-purple-300 flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50"
              >
                {isStarting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>SEALING VAT & ENGAGING SLOTH ENGINE...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ IGNITE QUANTUM VAT & STEEP</span>
                    <span className="text-lg">➔</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STATE 2: BREWING (Cyberpunk Lockdown & Giant Chronometer) */}
          {/* ------------------------------------------------------------- */}
          {isBrewing && (
            <div className="flex flex-col items-center">
              {/* Status Header */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-500 text-[10px] font-black uppercase tracking-widest text-purple-300 mb-2 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
                <span>SLOTH ENGINE LOCKDOWN ACTIVE</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mb-1 tracking-tight">
                Steeping {currentBrew?.ingredients?.join(' & ')}
              </h2>
              <p className="text-xs text-purple-300/80 mb-5 max-w-md font-sans">
                The teahouse is sealed to the barista. Close this tab and walk away—cosmic travelers will sip while you sleep.
              </p>

              {/* Progress ring chronometer */}
              <div className="my-3">
                <ProgressRing progress={brewProgress} size={300}>
                  <div className="text-[9px] text-purple-300 uppercase tracking-[0.25em] font-black mb-1">Time to harvest</div>
                  <div className="text-4xl sm:text-5xl font-mono font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-purple-100 via-pink-200 to-purple-400 drop-shadow-[0_0_20px_rgba(216,180,254,0.8)]">
                    {formatTimer(remainingSeconds)}
                  </div>
                  <div className="mt-2 text-[10px] font-mono text-cyan-300">{Math.floor(brewProgress * 100)}% STEEPED</div>
                  <div className="text-[9px] font-mono text-slate-500 mt-1">
                    READY {new Date(currentBrew?.ready_time || '').toLocaleTimeString()}
                  </div>
                </ProgressRing>
              </div>

              {/* Customer quota tracker */}
              <div className="w-full max-w-lg rounded-2xl border border-cyan-800/70 bg-black/60 p-4 mb-1 text-left">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">🛸 Customers served</span>
                  <span
                    className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border ${
                      served >= brewTarget
                        ? 'text-emerald-300 border-emerald-500/70 bg-emerald-950/50'
                        : 'text-amber-300 border-amber-500/60 bg-amber-950/40'
                    }`}
                  >
                    {served}/{brewTarget} {served >= brewTarget ? 'QUOTA MET' : 'TARGET'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: Math.max(brewTarget, arrivals.length) }, (_, i) => {
                    const filled = i < served;
                    const bonus = i >= brewTarget;
                    return (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm transition-all ${
                          filled
                            ? bonus
                              ? 'border-amber-300 bg-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                              : 'border-cyan-300 bg-cyan-500/25 shadow-[0_0_12px_rgba(34,211,238,0.6)]'
                            : 'border-indigo-900 bg-slate-900/70 text-transparent'
                        }`}
                      >
                        {filled ? '👽' : '·'}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2.5 text-[10px] text-slate-400 font-sans">
                  Reward preview: {served >= brewTarget ? `rarity kept, +${bonusXp(served, brewTarget)} bonus XP` : `${brewTarget - served} more guest${brewTarget - served === 1 ? '' : 's'} needed to keep your rarity`}
                </p>
              </div>

              {/* Deep Space Traveler Scanner with Radar Animation */}
              <div className="w-full max-w-lg bg-slate-950/90 border border-indigo-900/80 rounded-2xl p-4 my-4 text-left font-mono relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-wider flex items-center space-x-2">
                    <span>📡</span>
                    <span>DEEP SPACE TRAVELER SCANNER</span>
                  </div>
                  {/* Miniature Animated Radar Sweep Blip */}
                  <div className="relative w-5 h-5 rounded-full border border-indigo-500 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-gradient-to-r from-cyan-400 to-transparent animate-radar-sweep origin-left absolute left-1/2" />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  {radarLog.map((log, idx) => (
                    <div key={idx} className="text-[11px] text-indigo-200/90 truncate flex items-center space-x-2">
                      <span className="text-cyan-400 font-bold">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Firm Lockout Banner */}
              <div className="w-full max-w-lg p-4 rounded-2xl bg-purple-950/60 border-2 border-purple-600/50 text-xs text-purple-200 text-left flex items-start space-x-3.5 shadow-lg">
                <span className="text-2xl">🔒</span>
                <div>
                  <strong className="text-purple-300 font-black block text-sm mb-1 uppercase tracking-wider">
                    All Actions Physically Disabled
                  </strong>
                  <p className="text-[11px] text-purple-300/80 font-sans leading-relaxed">
                    The Sloth Engine strictly forbids clicking or rushing. Close this tab, leave the station, and return tomorrow when the timer hits zero.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STATE 3: READY (Harvest Available - Golden Celestial Pulse) */}
          {/* ------------------------------------------------------------- */}
          {isReady && (
            <div className="flex flex-col items-center py-4">
              <div className="text-[11px] uppercase tracking-widest font-black text-emerald-400 mb-1">
                CYCLE COMPLETE • COSMIC HARVEST READY
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
                A Celestial Traveler Visited Your Shop!
              </h2>
              <p className="text-xs text-emerald-300/90 max-w-md mb-8 font-sans">
                The 24-hour steeping period has concluded. TabPFN classified your harvest, and Gemma 2 documented the traveler’s review.
              </p>

              {/* Pulsing Arcade Claim Loot Button */}
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                onMouseEnter={() => sounds.playHover()}
                className="px-12 py-5 rounded-2xl font-black text-base uppercase tracking-widest text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-[0_0_40px_rgba(16,185,129,0.8)] border-2 border-emerald-200 animate-pulse-claim active:scale-95 cursor-pointer flex items-center space-x-3"
              >
                <span className="text-2xl">🎁</span>
                <span>{isClaiming ? 'TRANSMITTING REWARD...' : 'CLAIM COSMIC LOOT'}</span>
                <span className="text-2xl">✨</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🃏 RPG LOOT DROP MODAL (Holographic Card Unboxing + God Rays) */}
      {/* ========================================================================= */}
      {lootModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-hidden">
          {/* Rotating God Rays / Sunburst Beam in Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-[800px] h-[800px] rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,#ec4899_0deg,#a855f7_45deg,transparent_90deg,#06b6d4_135deg,transparent_180deg,#ec4899_225deg,#a855f7_270deg,transparent_315deg,#06b6d4_360deg)] animate-sunburst filter blur-2xl" />
          </div>

          {/* Loot Presentation Container */}
          <div
            style={{
              borderColor: RARITY_AURA[lootModal.rarity.toLowerCase()] ?? RARITY_AURA.common,
              boxShadow: `0 0 80px ${RARITY_AURA[lootModal.rarity.toLowerCase()] ?? RARITY_AURA.common}aa`,
            }}
            className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950 border-2 rounded-3xl p-6 sm:p-8 text-center animate-modal-spring hologram-shimmer z-10"
          >
            {/* Sci-Fi Decorative Corner Accents */}
            <div className="absolute top-3 left-4 text-[9px] text-purple-400 font-mono tracking-widest">[REWARD.ID: #CELESTIAL]</div>
            <div className="absolute top-3 right-4 text-[9px] text-cyan-400 font-mono tracking-widest">[AUTHENTICATED]</div>

            {/* Rarity Aura Badge */}
            <div className="mb-4 inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border shadow-lg">
              <span className={`px-4 py-1.5 rounded-full border ${getRarityBadgeStyle(lootModal.rarity)}`}>
                ⭐ {lootModal.rarity} HARVEST REVEALED
              </span>
            </div>

            {/* Item Title */}
            <h3 className="text-2xl sm:text-3xl font-black text-slate-100 mb-2 tracking-tight">
              {lootModal.item_name}
            </h3>

            {/* RPG Tea Stats Bar */}
            <div className="grid grid-cols-3 gap-2 my-4 text-center">
              <div className="bg-black/50 border border-purple-800/60 rounded-xl p-2">
                <div className="text-[9px] text-purple-400 font-bold uppercase">POTENCY</div>
                <div className="text-sm font-black text-purple-200">96.4%</div>
              </div>
              <div className="bg-black/50 border border-cyan-800/60 rounded-xl p-2">
                <div className="text-[9px] text-cyan-400 font-bold uppercase">RESONANCE</div>
                <div className="text-sm font-black text-cyan-200">GRADE S+</div>
              </div>
              <div className="bg-black/50 border border-amber-800/60 rounded-xl p-2">
                <div className="text-[9px] text-amber-400 font-bold uppercase">SLOTH XP</div>
                <div className="text-sm font-black text-amber-300">+{250 + (lootModal.bonus_xp ?? 0)}</div>
              </div>
            </div>

            {/* Customer quota result */}
            {lootModal.customers_target !== undefined && lootModal.customers_target > 0 && (
              <div
                className={`my-4 p-3 rounded-xl border text-left text-xs ${
                  lootModal.quota_met
                    ? 'border-emerald-500/70 bg-emerald-950/40 text-emerald-200'
                    : 'border-amber-500/70 bg-amber-950/40 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-black uppercase tracking-wider text-[11px]">
                  <span>🛸 {lootModal.customers_served}/{lootModal.customers_target} customers</span>
                  <span>{lootModal.quota_met ? 'QUOTA MET' : 'QUOTA MISSED'}</span>
                </div>
                <p className="mt-1 text-[11px] font-sans opacity-90">
                  {lootModal.quota_met
                    ? `Full ${lootModal.rarity} rarity kept. +${lootModal.bonus_xp ?? 0} bonus XP.`
                    : `Rarity dropped from ${lootModal.base_rarity} to ${lootModal.rarity} for the shortfall.`}
                </p>
              </div>
            )}

            {/* Gemma 2 Alien Review Card with Typewriter Effect */}
            <div className="my-4 p-5 rounded-2xl bg-indigo-950/60 border border-indigo-700/60 text-left relative shadow-inner">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-300 mb-2">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>🛸 VISITOR TRANSMISSION (GEMMA 2)</span>
                </span>
                <span className="text-[10px] text-purple-400 font-mono">VERIFIED LOG</span>
              </div>
              <p className="text-sm italic text-indigo-100/95 font-serif leading-relaxed min-h-[3rem]">
                &ldquo;{typewriterText}&rdquo;
                {typewriterText.length < (lootModal.review?.length || 0) && (
                  <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse" />
                )}
              </p>
            </div>

            {/* Alien Communicator (browser speech synthesis) */}
            <div className="mb-6 p-4 rounded-2xl bg-black/80 border border-purple-800/60 flex flex-col items-center">
              <div className="w-full flex items-center justify-between text-[11px] text-purple-300 font-bold mb-2">
                <span className="flex items-center space-x-1.5">
                  <span>🎙️</span>
                  <span>COSMIC VOICE TRANSMISSION</span>
                </span>
                {/* Audio Equalizer dancing wave */}
                <div className="flex items-end space-x-1 h-3">
                  {[60, 100, 40, 80, 95, 30, 85, 50].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-purple-400 rounded-full animate-pulse"
                      style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => speak(lootModal.review)}
                className="text-[10px] text-indigo-300 hover:text-white bg-indigo-950/70 border border-indigo-700 hover:bg-indigo-900/80 px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <span>🛸</span>
                <span>Replay transmission (browser voice)</span>
              </button>
            </div>

            {/* Deposit in Vault Button */}
            <button
              onClick={() => {
                sounds.playClick();
                setLootModal(null);
                triggerAchievement('DEPOSITED IN VAULT', 'Artifact stored securely.', '🎒');
              }}
              onMouseEnter={() => sounds.playHover()}
              className="w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition shadow-[0_0_25px_rgba(168,85,247,0.5)] border border-purple-400/40 cursor-pointer active:scale-98"
            >
              DEPOSIT IN VAULT & PRIME VAT FOR NEXT CYCLE
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📖 IN-GAME CODEX & STAR-LOG POPUP MODAL */}
      {/* ========================================================================= */}
      {showCodex && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-cyan-500/80 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.4)] max-h-[85vh] flex flex-col animate-modal-spring">
            <div className="flex items-center justify-between pb-4 border-b border-cyan-900/60">
              <h3 className="text-base font-black text-cyan-300 flex items-center space-x-2 tracking-wider">
                <span>📖</span>
                <span>ALCHEMIST CODEX & STAR-LOG</span>
              </h3>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowCodex(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4 space-y-5 pr-2 text-left font-sans">
              {/* Section 1: Cosmic Ingredients & Elements */}
              <div>
                <h4 className="text-xs font-black uppercase text-purple-400 font-mono tracking-wider mb-2 flex items-center space-x-2">
                  <span>🌌</span>
                  <span>Cosmic Materia Registry (12 Elements)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[...INGREDIENTS_BASE, ...INGREDIENTS_INFUSION].map((ing) => (
                    <div key={ing.name} className="p-2.5 rounded-xl bg-black/50 border border-indigo-900/60 text-xs">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-base">{ing.icon}</span>
                        <strong className="text-white text-[11px] truncate">{ing.name}</strong>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">{ing.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Traveler Dossiers */}
              <div>
                <h4 className="text-xs font-black uppercase text-cyan-400 font-mono tracking-wider mb-2 flex items-center space-x-2">
                  <span>👽</span>
                  <span>Observed Deep-Space Travelers</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TRAVELER_DOSSIERS.map((d) => (
                    <div key={d.name} className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <strong className="text-cyan-300 font-mono">{d.name}</strong>
                        <span className="text-[9px] bg-indigo-900 px-2 py-0.5 rounded text-indigo-200">{d.sector}</span>
                      </div>
                      <div className="text-[10px] text-purple-300 mb-1 font-mono">SPECIES: {d.species}</div>
                      <p className="text-[11px] text-slate-300 leading-snug">{d.lore}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Sloth Philosophy */}
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-xs text-purple-200">
                <strong className="font-mono text-purple-300 block mb-1">THE FIRST LAW OF SLOTH ALCHEMY:</strong>
                <p className="text-[11px] text-purple-200/90 leading-relaxed">
                  Fast tea is bitter tea. By locking the crucible for a durable 24 hours, flavor molecules harmonize with cosmic background radiation. True mastery is achieved through patience, not frantic clicking.
                </p>
              </div>
            </div>

            <div className="pt-2 text-center text-[10px] text-cyan-400/50 font-mono">
              INTERGALACTIC REGISTRY • ARCHIVE SECTOR 9
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎒 COSMIC VAULT ARCHIVE DRAWER */}
      {/* ========================================================================= */}
      {showInventory && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-slate-900 border-2 border-indigo-600 rounded-3xl p-6 shadow-[0_0_50px_rgba(99,102,241,0.5)] max-h-[85vh] flex flex-col animate-modal-spring">
            <div className="flex items-center justify-between pb-4 border-b border-indigo-900/60">
              <h3 className="text-base font-black text-slate-100 flex items-center space-x-2 tracking-wider">
                <span>🎒</span>
                <span>BARISTA VAULT ARCHIVE</span>
              </h3>
              <button
                onClick={() => {
                  sounds.playClick();
                  setShowInventory(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 my-4 space-y-3 pr-2">
              {!user?.inventory || user.inventory.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 font-sans">
                  No artifacts archived yet. Steep your first celestial brew to earn loot!
                </div>
              ) : (
                user.inventory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/80 border border-indigo-900/60 text-left hover:border-indigo-600 transition"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-200 text-xs">{item.item_name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${getRarityBadgeStyle(item.rarity)}`}>
                        {item.rarity}
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-200/80 font-serif italic mb-2">
                      &ldquo;{item.review}&rdquo;
                    </p>
                    <button
                      onClick={() => speak(item.review)}
                      className="text-[10px] text-indigo-300 hover:text-white bg-indigo-950/70 border border-indigo-700 px-2.5 py-1 rounded-lg cursor-pointer"
                    >
                      🛸 Replay
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-center text-[10px] text-indigo-400/50 font-mono">
              STATION ID: {user?.player_id}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto py-2 text-center text-[10px] text-indigo-400/40">
        THE MIDNIGHT STEEPER • ZERO-PLAYER SLOTH ENGINE • THREE.JS 3D CRUCIBLE • DURABLE WORKFLOW
      </footer>
    </main>
  );
}
