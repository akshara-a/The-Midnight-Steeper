'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { fetchMe, fetchCurrentBrew, startBrew, claimBrew, fastForwardBrew, UserProfile, BrewItem, Loot } from '@/lib/api';
import { getPlayerId } from '@/lib/identity';
import { sounds } from '@/lib/soundEffects';
import { speech } from '@/lib/speech';
import { customerTarget, bonusXp } from '@/lib/customers';
import {
  LEAVES,
  TREATS,
  NAPS,
  FRIENDS,
  Ingredient,
  rarityKid,
  getRank,
  POKE_LINES,
  SLEEP_MUMBLES,
  FIFTH_POKE,
  SnackItem,
} from '@/lib/kidsContent';
import { brainWasEnabled, brainReady, loadBrain, writeNote, BrainStatus } from '@/lib/browserAI';
import BathMode from '@/components/BathMode';
import SnackMode from '@/components/SnackMode';
import MiniGamesModal from '@/components/MiniGamesModal';
import TalkingSlothModal from '@/components/TalkingSlothModal';
import WardrobeModal from '@/components/WardrobeModal';
import { type WardrobeOutfit, DEFAULT_WARDROBE } from '@/lib/wardrobe';
import { AlchemistCrystalBall } from '@/components/AlchemistCrystalBall';
import { TabPFNAttributionCard } from '@/components/TabPFNAttributionCard';
import { DIORAMA_THEMES, type DioramaTheme, type PetMood } from '@/components/SlothPet3D';
import {
  ArrowLeft,
  ArrowRight,
  Bath,
  BookOpen,
  Coffee,
  Gamepad2,
  Gift,
  Menu as MenuIcon,
  Mic,
  Moon,
  Palette,
  Play,
  Shirt,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  Zap,
  Apple,
  Star,
  FlaskConical,
  Flame,
  Flower2,
  Leaf,
  Droplets,
  Brain,
  Download,
  TriangleAlert,
  Check,
  Terminal,
} from 'lucide-react';
import { CloseButton, IngredientArt, LeafArt, LoadingBar, NapIcon, ParentGate, TreatIcon, plain, useEscape } from '@/components/ui';

const SlothPet3D = dynamic(() => import('@/components/SlothPet3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <LoadingBar />
    </div>
  ),
});

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
const hashString = (s: string) => s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
const friendFor = (seed: string, i: number) => FRIENDS[(hashString(seed) + i) % FRIENDS.length];

const STEP_PROMPTS: Record<number, string> = {
  1: 'Pick a leaf or a flower for my tea!',
  2: 'Now pick a yummy treat to stir in!',
  3: 'How long should I nap while the tea steeps?',
};

function Typewriter({ text }: Readonly<{ text: string }>) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(timer);
          return v;
        }
        return v + 1;
      });
    }, 32);
    return () => clearInterval(timer);
  }, [text]);
  return <>{text.slice(0, n)}</>;
}

function Confetti() {
  const pieces = ['🎉', '⭐', '💖', '✨', '🌈', '🎈'];
  return (
    <div className="fixed inset-0 pointer-events-none z-[55] overflow-hidden" aria-hidden="true">
      {Array.from({ length: 26 }, (_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i * 37) % 100}%`,
            animationDuration: `${3 + (i % 5) * 0.6}s`,
            animationDelay: `${(i % 7) * 0.25}s`,
          }}
        >
          {pieces[i % pieces.length]}
        </span>
      ))}
    </div>
  );
}

const WISH_COLORS = ['var(--mint)', 'var(--daisy)', 'var(--rose)', 'var(--berry)'];

const THEME_ICONS: Record<DioramaTheme, typeof Flame> = {
  classic: Flame,
  sakura: Flower2,
  celestial: Sparkles,
  autumn: Leaf,
  onsen: Droplets,
};

const THEME_DETAILS: Record<DioramaTheme, { tag: string; swatches: string[] }> = {
  classic: {
    tag: '🏮 Golden Fireflies · Cozy Hearth Embers',
    swatches: ['#ea580c', '#fef08a', '#232126', '#4ade80'],
  },
  sakura: {
    tag: '🌸 3D Drifting Petals · Cherry Blossom Mist',
    swatches: ['#fb7185', '#fda4af', '#831843', '#86efac'],
  },
  celestial: {
    tag: '✨ Cosmic Aurora · Diamond Starbursts & Meteors',
    swatches: ['#38bdf8', '#818cf8', '#334155', '#67e8f9'],
  },
  autumn: {
    tag: '🍂 Swirling Leaves · Warm Fireside Sparks',
    swatches: ['#f59e0b', '#dc2626', '#78350f', '#ea580c'],
  },
  onsen: {
    tag: '🫧 Translucent Bubbles · Soothing Hot Spring Steam',
    swatches: ['#2dd4bf', '#14b8a6', '#134e4a', '#34d399'],
  },
};

function Modal({
  title,
  onClose,
  children,
  wide,
}: Readonly<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }>) {
  useEscape(onClose);
  return (
    <div
      className="fixed inset-0 z-[50] flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(12, 6, 32, 0.85)', backdropFilter: 'blur(8px)' }}
      role="dialog"
      aria-modal="true"
      aria-label={plain(title)}
    >
      <div
        className={`surface animate-modal w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative rounded-3xl border-3 border-purple-400/35 shadow-2xl`}
        style={{ background: 'linear-gradient(165deg, rgba(46, 26, 120, 0.96) 0%, rgba(22, 12, 70, 0.98) 100%)' }}
      >
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b-2 border-white/10">
          <h2 className="text-2xl sm:text-3xl font-black text-amber-200 tracking-wide">{title}</h2>
          <CloseButton onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SunnyTeaParty() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentBrew, setCurrentBrew] = useState<BrewItem | null>(null);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [leaf, setLeaf] = useState<Ingredient>(LEAVES[0]);
  const [treat, setTreat] = useState<Ingredient>(TREATS[0]);
  const [napKey, setNapKey] = useState('demo');
  const [now, setNow] = useState(() => Date.now());
  const [tuck, setTuck] = useState<null | 'drink' | 'bed'>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [lootModal, setLootModal] = useState<Loot | null>(null);
  const [noteOverride, setNoteOverride] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Talking Tom features state
  const [petMode, setPetMode] = useState<'tea' | 'bath' | 'snack'>('tea');
  const [showMiniGames, setShowMiniGames] = useState(false);
  const [showTalking, setShowTalking] = useState(false);
  const [extraXP, setExtraXP] = useState(0);

  // Bedtime procedural soundscape & demo fast-forward
  const [soundscape, setSoundscape] = useState<'off' | 'rain' | 'breeze' | 'chimes'>('rain');
  const [isFastForwarding, setIsFastForwarding] = useState(false);

  const [bubble, setBubble] = useState<{ id: number; text: string } | null>(null);
  const [talking, setTalking] = useState(false);
  const [pokeCount, setPokeCount] = useState(0);
  const [floaters, setFloaters] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const [friendNote, setFriendNote] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [confetti, setConfetti] = useState(false);

  const [voiceOn, setVoiceOn] = useState(true);
  const [sfxOn, setSfxOn] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [selectedSticker, setSelectedSticker] = useState<Loot | null>(null);
  const [showCrystalModal, setShowCrystalModal] = useState(false);
  const [showAttributionModal, setShowAttributionModal] = useState(false);
  const [showGrownups, setShowGrownups] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [wishTip, setWishTip] = useState<string | null>(null);
  const [dioramaTheme, setDioramaTheme] = useState<DioramaTheme>('classic');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [outfit, setOutfit] = useState<WardrobeOutfit>(DEFAULT_WARDROBE);
  const [showWardrobeModal, setShowWardrobeModal] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('midnight_theme') as DioramaTheme | null;
      if (savedTheme && DIORAMA_THEMES[savedTheme]) {
        setDioramaTheme(savedTheme);
      }
      const savedOutfit = localStorage.getItem('midnight_wardrobe');
      if (savedOutfit) {
        setOutfit(JSON.parse(savedOutfit));
      }
    } catch {}
  }, []);
  const [brain, setBrain] = useState<{ status: BrainStatus; pct: number }>({ status: 'off', pct: 0 });

  const [sessionPicks, setSessionPicks] = useState(0);
  const [sessionBrews, setSessionBrews] = useState(0);
  const [sessionClaims, setSessionClaims] = useState(0);

  const handleUpdateOutfit = (newOutfit: WardrobeOutfit) => {
    setOutfit(newOutfit);
    try {
      localStorage.setItem('midnight_wardrobe', JSON.stringify(newOutfit));
    } catch {}
  };

  const sayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pokesRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const servedRef = useRef(0);
  const seenBrew = useRef<string | null>(null);
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    speech.enabled = voiceOn;
    if (!voiceOn) speech.stop();
  }, [voiceOn]);
  useEffect(() => {
    sounds.enabled = sfxOn;
  }, [sfxOn]);

  // Sunny says something: speech bubble + (optionally) a cartoon voice that moves the mouth
  const say = useCallback((text: string, opts: { voice?: boolean } = {}) => {
    const id = Date.now() + Math.random();
    setBubble({ id, text });
    clearTimeout(sayTimer.current);
    sayTimer.current = setTimeout(() => setBubble((b) => (b?.id === id ? null : b)), Math.max(4000, text.length * 85));
    if (opts.voice === false) return;
    if (speech.enabled && speech.supported) {
      speech.speak(text, { onStart: () => setTalking(true), onEnd: () => setTalking(false) });
    } else {
      setTalking(true);
      setTimeout(() => setTalking(false), Math.min(2600, text.length * 55));
    }
  }, []);

  const floatEmoji = useCallback((text: string, x?: number, y?: number) => {
    const id = Date.now() + Math.random();
    const fx = x ?? (typeof window === 'undefined' ? 200 : window.innerWidth / 2);
    const fy = y ?? (typeof window === 'undefined' ? 300 : window.innerHeight / 2);
    setFloaters((prev) => [...prev, { id, text, x: fx, y: fy }]);
    setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), 1500);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [userData, brewData] = await Promise.all([fetchMe(), fetchCurrentBrew()]);
      setErrorMsg(null);
      setUser(userData);
      setCurrentBrew(brewData.brew);
      setNow(Date.now());
    } catch (err) {
      console.warn('Could not reach the tea shop:', err);
      setErrorMsg("Sunny can't reach the tea shop. Ask a grown-up to check the internet.");
    }
  }, []);

  useEffect(() => {
    getPlayerId();
    loadData();
  }, [loadData]);

  const isBrewing = currentBrew?.status === 'brewing';
  const isReady = currentBrew?.status === 'ready';
  const isIdle = !currentBrew || currentBrew.status === 'claimed';

  // Bedtime state: when sleeping or tucking in, no other activities are allowed
  const isSleeping = isBrewing || tuck === 'bed';
  const isBedtimeActive = isSleeping || tuck !== null || isStarting;

  // Auto-close any open activities or modals when bedtime/sleep starts
  useEffect(() => {
    if (isBedtimeActive) {
      setPetMode('tea');
      setShowMiniGames(false);
      setShowTalking(false);
    }
  }, [isBedtimeActive]);

  // Manage generative procedural sleep soundscape (rain, breeze, chimes)
  useEffect(() => {
    if (isSleeping && soundscape !== 'off' && sfxOn) {
      sounds.startSleepSoundscape(soundscape);
    } else {
      sounds.stopSleepSoundscape();
    }
    return () => {
      sounds.stopSleepSoundscape();
    };
  }, [isSleeping, soundscape, sfxOn]);

  // Countdown until Sunny wakes up, derived from a clock that ticks once a second while napping
  useEffect(() => {
    if (!isBrewing) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isBrewing]);
  const remainingSeconds =
    isBrewing && currentBrew ? Math.max(0, Math.floor((new Date(currentBrew.ready_time).getTime() - now) / 1000)) : null;
  const timeUp = remainingSeconds === 0;

  useEffect(() => {
    if (!timeUp) return;
    sounds.stopSleepSoundscape();
    sounds.playChime();
    say('Good morning! The tea party is ready!');
    loadData();
  }, [timeUp, loadData, say]);

  // Check in with the server while Sunny naps
  useEffect(() => {
    if (!isBrewing) return;
    const poll = setInterval(loadData, 3000);
    return () => clearInterval(poll);
  }, [isBrewing, loadData]);

  // Derived values
  const target = customerTarget(napKey, [leaf.name, treat.name]);
  const nap = NAPS.find((n) => n.key === napKey) ?? NAPS[0];
  const arrivals = currentBrew?.customer_arrivals ?? [];
  const brewTarget = currentBrew?.customers_target ?? 0;
  const elapsed = currentBrew && remainingSeconds !== null ? currentBrew.duration_seconds - remainingSeconds : 0;
  const served = isReady ? arrivals.length : isBrewing ? arrivals.filter((o) => o <= elapsed).length : 0;
  const brewProgress =
    remainingSeconds !== null && currentBrew?.duration_seconds ? 1 - remainingSeconds / currentBrew.duration_seconds : isReady ? 1 : 0;

  // Friends arrive while Sunny sleeps (shown quietly so nobody wakes up)
  useEffect(() => {
    if (!currentBrew) return;
    if (currentBrew.brew_id !== seenBrew.current) {
      seenBrew.current = currentBrew.brew_id;
      servedRef.current = served;
      return;
    }
    if (served > servedRef.current) {
      const f = friendFor(currentBrew.brew_id, served);
      sounds.playPop();
      floatEmoji(f.icon, window.innerWidth / 2, window.innerHeight * 0.55);
      setFriendNote(`${f.icon} ${f.name} joined the party!`);
      setTimeout(() => setFriendNote(null), 3500);
    }
    servedRef.current = served;
  }, [served, currentBrew, floatEmoji]);

  // Sunny's colors follow the choices
  const shownLeaf = isIdle ? leaf : (LEAVES.find((l) => l.name === currentBrew?.ingredients?.[0]) ?? leaf);
  const shownTreat = isIdle ? treat : (TREATS.find((t) => t.name === currentBrew?.ingredients?.[1]) ?? treat);

  // Sleeping takes top priority: Sunny stays asleep with blanket and nightcap!
  let mood: PetMood = 'idle';
  if (isSleeping) mood = 'sleeping';
  else if (tuck === 'drink') mood = 'eating';
  else if (petMode === 'bath') mood = 'bathing';
  else if (petMode === 'snack') mood = 'eating';
  else if (talking) mood = 'talking';
  else if (isReady) mood = 'happy';
  const night = mood === 'sleeping';

  // Level and stars including mini-games and care rewards
  const invCount = user?.inventory?.length ?? 0;
  const streak = user?.consistency_score ?? 1;
  const bonusTotal = (user?.inventory ?? []).reduce((sum, i) => sum + (i.bonus_xp ?? 0), 0);
  const totalXP = invCount * 250 + streak * 100 + bonusTotal + extraXP;
  const currentXP = totalXP % 1000;
  const playerLevel = Math.max(1, Math.floor(totalXP / 1000) + 1);

  useEffect(() => {
    if (!user) return;
    if (prevLevelRef.current !== null && playerLevel > prevLevelRef.current) {
      setLevelUp(playerLevel);
      setConfetti(true);
      sounds.playAchievement();
      setTimeout(() => {
        setLevelUp(null);
        setConfetti(false);
      }, 3500);
    }
    prevLevelRef.current = playerLevel;
  }, [user, playerLevel]);

  // Brain: Gemma running inside the browser
  const enableBrain = useCallback(async () => {
    setBrain({ status: 'loading', pct: 0 });
    try {
      await loadBrain((pct) => setBrain({ status: 'loading', pct }));
      setBrain({ status: 'ready', pct: 100 });
    } catch (err) {
      console.warn('Could not load the in-browser model:', err);
      setBrain({ status: 'error', pct: 0 });
    }
  }, []);

  // When a prize opens, Sunny's brain writes a note
  useEffect(() => {
    if (!lootModal || !brainReady()) return;
    let cancelled = false;
    const f = friendFor(lootModal.item_name, 0);
    writeNote(f.name, lootModal.item_name, rarityKid(lootModal.rarity).label).then((note) => {
      if (!cancelled && note) setNoteOverride(note);
    });
    return () => {
      cancelled = true;
    };
  }, [lootModal]);

  const note = noteOverride ?? lootModal?.review ?? '';
  useEffect(() => {
    if (lootModal && note) speech.speak(note, { onStart: () => setTalking(true), onEnd: () => setTalking(false) });
  }, [lootModal, note]);

  // ---- Actions ----
  const handleStart = () => {
    sounds.playClick();
    speech.speak(' ');
    setStarted(true);
    if (brainWasEnabled()) enableBrain();
    const hour = new Date().getHours();
    const late = hour >= 19 || hour < 6;
    say(
      late
        ? "Hi friend! It's bedtime, so let's take a bath, make cozy tea, and go to sleep!"
        : "Hi! I'm Sunny the sloth! We can play games, take a bath, or make delicious tea!"
    );
  };

  const onPoke = () => {
    pokesRef.current += 1;
    setPokeCount((n) => n + 1);
    floatEmoji(pick(['💖', '⭐', '✨', '💫']), pointerRef.current.x, pointerRef.current.y);
    if (isBedtimeActive || mood === 'sleeping') {
      sounds.playYawn();
      say(pick(SLEEP_MUMBLES), { voice: false });
      return;
    }
    if (mood === 'bathing') {
      sounds.playBubblePop();
      say('Splish splash! The water is warm and cozy!');
      return;
    }
    sounds.playGiggle();
    say(pokesRef.current % 5 === 0 ? FIFTH_POKE : pick(POKE_LINES));
  };

  const goStep = (n: number) => {
    sounds.playClick();
    setStep(n);
    say(STEP_PROMPTS[n]);
  };

  const chooseLeaf = (item: Ingredient, e: React.MouseEvent) => {
    sounds.playPop();
    setLeaf(item);
    setSessionPicks((n) => Math.max(n, 1));
    floatEmoji(item.icon, e.clientX, e.clientY);
    say(`Ooh, ${item.name}! ${item.blurb}.`);
  };

  const chooseTreat = (item: Ingredient, e: React.MouseEvent) => {
    sounds.playPop();
    setTreat(item);
    setSessionPicks((n) => Math.max(n, 2));
    floatEmoji(item.icon, e.clientX, e.clientY);
    say(`Yum, ${item.name}! ${item.blurb}.`);
  };

  const handleTuckIn = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setErrorMsg(null);
    setPetMode('tea');
    setShowMiniGames(false);
    setShowTalking(false);
    setTuck('drink');
    sounds.playChime();
    say(`Yum yum! ${leaf.name} and ${treat.name}. Yaaawn... I'm so sleepy. Goodnight! You go to sleep too!`);
    setTimeout(() => {
      sounds.playYawn();
      setTuck((t) => (t ? 'bed' : t));
    }, 2400);
    try {
      const minWait = new Promise((r) => setTimeout(r, 5000));
      const [res] = await Promise.all([startBrew([leaf.name, treat.name], napKey), minWait]);
      setCurrentBrew(res.brew);
      setSessionBrews((n) => n + 1);
      await loadData();
    } catch (err) {
      console.warn('Could not start the nap:', err);
      setErrorMsg("Oops! Sunny couldn't start the tea. Ask a grown-up to check the internet.");
      say("Oh no, something went wrong. Let's try again!");
    } finally {
      setTuck(null);
      setIsStarting(false);
    }
  };

  const handleFastForward = async () => {
    if (isFastForwarding) return;
    setIsFastForwarding(true);
    sounds.playClick();
    try {
      await fastForwardBrew();
      sounds.stopSleepSoundscape();
      await loadData();
      say('⚡ Fast-forward complete! Sunny is ready to wake up!');
    } catch (err) {
      console.warn('Could not fast forward:', err);
    } finally {
      setIsFastForwarding(false);
    }
  };

  const handleClaim = async (e: React.MouseEvent) => {
    if (isClaiming) return;
    setIsClaiming(true);
    sounds.playChime();
    floatEmoji('🎁', e.clientX, e.clientY);
    try {
      const res = await claimBrew(currentBrew?.brew_id);
      setNoteOverride(null);
      setLootModal(res.loot);
      setConfetti(true);
      setTimeout(() => setConfetti(false), 5000);
      setSessionClaims((n) => n + 1);
      setCurrentBrew(null);
      setStep(1);
      await loadData();
    } catch (err) {
      console.warn('Could not open the surprise:', err);
      setErrorMsg("Oops! The surprise got stuck. Try again in a moment.");
    } finally {
      setIsClaiming(false);
    }
  };

  const formatTimer = (total: number | null) => {
    if (total === null) return '--:--';
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const wishes = [
    { label: 'Pick leaf + treat', done: sessionPicks >= 2 || isBrewing || isReady },
    { label: 'Take a bubble bath', done: extraXP >= 50 },
    { label: 'Tuck Sunny in', done: sessionBrews > 0 || isBrewing || isReady },
    { label: 'Open the surprise', done: sessionClaims > 0 },
  ];

  return (
    <main className={`relative min-h-screen ${night ? 'night' : ''} theme-${dioramaTheme}`}>
      <div className="sky sky-day" style={{ opacity: night ? 0 : 1 }} />
      <div className="sky sky-night" style={{ opacity: night ? 1 : 0 }} />
      <div className="sky-stars" style={{ opacity: night ? 1 : 0.35 }} aria-hidden="true" />
      <div className="theme-atmosphere-glow" aria-hidden="true" />

      {/* Floating hearts, stars and friends */}
      <div className="fixed inset-0 pointer-events-none z-[56] overflow-hidden" aria-hidden="true">
        {floaters.map((f) => (
          <div key={f.id} className="absolute text-3xl animate-float-up" style={{ left: f.x - 20, top: f.y - 20 }}>
            {f.text}
          </div>
        ))}
      </div>
      {confetti && <Confetti />}

      {levelUp !== null && (
        <div className="fixed inset-0 z-[57] flex items-center justify-center pointer-events-none">
          <div className="surface animate-pop px-10 py-7 text-center" style={{ background: 'var(--surface-solid)' }}>
            <div className="text-4xl font-light">Level {levelUp}</div>
            <div className="mt-1 text-base" style={{ color: 'var(--muted)' }}>
              {getRank(levelUp)}
            </div>
          </div>
        </div>
      )}

      {/* Top bar: level, sound, grown-ups, menu */}
      <header
        inert={!started}
        className="fixed top-0 inset-x-0 z-[45] transition-opacity duration-700"
        style={{
          opacity: !started ? 0 : night ? 0.6 : 1,
          background: 'linear-gradient(to bottom, rgba(32,16,98,0.88) 60%, transparent)',
        }}
      >
        <div className="mx-auto max-w-3xl landscape:md:max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3" aria-label={`Level ${playerLevel}, ${Math.round((currentXP / 1000) * 100)} percent to the next level`}>
            <div className="flex items-center justify-center gap-1 min-w-[56px] h-12 px-2.5 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 border-2 border-white shadow-[0_4px_0_#9a3412,0_6px_12px_rgba(0,0,0,0.3)] text-amber-950 font-black text-lg select-none">
              <span>⭐</span><span>{playerLevel}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-xs font-black tracking-wide text-amber-200 uppercase flex items-center gap-1.5">
                <span>{getRank(playerLevel)}</span>
                <span className="text-white/60">·</span>
                <span className="text-amber-100/90">{Math.round(currentXP)}/1000 XP</span>
              </div>
              <div className="progress-line mt-1 w-28 sm:w-36 h-3.5" role="progressbar" aria-valuenow={Math.round((currentXP / 1000) * 100)}>
                <span style={{ width: `${(currentXP / 1000) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setVoiceOn((v) => !v)}
              aria-label={voiceOn ? 'Turn Sunny’s voice off' : 'Turn Sunny’s voice on'}
              className="icon-btn"
              title={voiceOn ? 'Voice On' : 'Voice Off'}
            >
              {voiceOn ? <Volume2 size={26} strokeWidth={2.2} style={{ color: 'var(--daisy)' }} aria-hidden="true" /> : <VolumeX size={26} strokeWidth={2.2} aria-hidden="true" />}
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setShowGate(true);
              }}
              aria-label="For grown-ups"
              className="icon-btn"
              title="Grown-ups Lock"
            >
              <Users size={26} strokeWidth={2.2} style={{ color: 'var(--mint)' }} aria-hidden="true" />
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setShowMenu(true);
              }}
              aria-label="Open menu"
              className="icon-btn"
              title="Game Menu"
            >
              <MenuIcon size={26} strokeWidth={2.2} style={{ color: 'var(--rose)' }} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-3xl landscape:md:max-w-5xl px-4 sm:px-6 pt-24 pb-48 flex flex-col gap-6 landscape:md:grid landscape:md:grid-cols-2 landscape:md:items-center">
        {errorMsg && started && (
          <div className="surface px-4 py-2.5 text-center landscape:md:col-span-2 rounded-2xl flex items-center justify-center gap-2 font-bold text-rose-200 border-2 border-rose-400/40 bg-rose-950/70 shadow-md text-sm" role="alert">
            <span>⚠️</span> <span>{plain(errorMsg)}</span>
          </div>
        )}

        {/* 3D stage: tap Sunny! */}
        <section
          className="stage-scene relative overflow-hidden h-[52vh] min-h-[340px] max-h-[560px] landscape:md:h-[66vh]"
          onPointerDown={(e) => {
            pointerRef.current = { x: e.clientX, y: e.clientY };
          }}
        >
          <SlothPet3D
            mood={mood}
            furColor={shownLeaf.color}
            accentColor={shownTreat.color}
            pokeCount={pokeCount}
            onPoke={onPoke}
            starlightGlow={currentBrew?.loot?.sensory?.starlight_glow ?? (lootModal?.sensory?.starlight_glow ?? (leaf.name === 'Moon Mint' || treat.name === 'Star Sugar' ? 85 : 50))}
            theme={dioramaTheme}
            wardrobe={outfit}
          />

          {bubble && started && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-20 pointer-events-none">
              <div key={bubble.id} className="bubble px-4 py-2.5 text-center text-base sm:text-lg leading-snug">
                <div className="text-[11px] font-black uppercase text-amber-800 tracking-wider mb-0.5">
                  🦥 Sunny says:
                </div>
                {bubble.text}
              </div>
            </div>
          )}

          {mood === 'sleeping' && (
            <div className="absolute left-[54%] top-[24%] text-3xl font-black pointer-events-none" aria-hidden="true" style={{ color: 'var(--accent)' }}>
              <span className="absolute animate-zzz">💤</span>
              <span className="absolute animate-zzz" style={{ animationDelay: '1.4s' }}>✨</span>
            </div>
          )}

          {started && (
            <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none">
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-xs font-black text-amber-200 shadow-lg">
                {mood === 'sleeping' ? '😴 Shhh... Sunny is sleeping soundly' : mood === 'bathing' ? '🫧 Splish splash! Warm bubble bath!' : '✨ Tap Sunny to cuddle or play! ✨'}
              </div>
            </div>
          )}
        </section>

        <div
          inert={!started}
          className="flex flex-col gap-6 transition-opacity duration-700"
          style={{ opacity: started ? 1 : 0 }}
        >
        {/* ---------- BATH MODE (only when awake) ---------- */}
        {petMode === 'bath' && !isBedtimeActive && (
          <BathMode
            onSay={say}
            onReward={(xp) => {
              setExtraXP((x) => x + xp);
              sounds.playPop();
            }}
            onClose={() => setPetMode('tea')}
          />
        )}

        {/* ---------- SNACK MODE (only when awake) ---------- */}
        {petMode === 'snack' && !isBedtimeActive && (
          <SnackMode
            onFeed={(snack: SnackItem) => {
              setExtraXP((x) => x + snack.xp);
              sounds.playNom();
              say(snack.soundText);
              floatEmoji(snack.icon);
            }}
            onClose={() => setPetMode('tea')}
          />
        )}

        {/* ---------- IDLE: three easy steps for tea ---------- */}
        {petMode === 'tea' && isIdle && !tuck && (
          <section className="animate-modal surface p-4 sm:p-5">
            <div className="flex items-center justify-center gap-2 mb-4" role="img" aria-label={`Step ${step} of 3`}>
              {[
                { n: 1, label: '🍃 Leaf', color: '#10b981' },
                { n: 2, label: '🍬 Treat', color: '#ec4899' },
                { n: 3, label: '😴 Nap', color: '#8b5cf6' },
              ].map(({ n, label, color }) => (
                <div
                  key={n}
                  className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                  style={{
                    background: n === step ? color : n < step ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.35)',
                    color: '#ffffff',
                    border: n === step ? '2px solid #ffffff' : '1.5px solid rgba(255,255,255,0.2)',
                    boxShadow: n === step ? `0 3px 0 rgba(0,0,0,0.3), 0 0 14px ${color}` : 'none',
                    transform: n === step ? 'scale(1.06)' : 'scale(1)',
                  }}
                >
                  {n < step ? '✓' : n} {label}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2.5 mb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-center text-amber-100 drop-shadow-md">
                {step === 1 && '✨ Pick a Leaf or Flower! 🌸'}
                {step === 2 && '✨ Pick a Yummy Treat! 🍯'}
                {step === 3 && '😴 How Long Should Sunny Nap? 🌙'}
              </h2>
              <button
                onClick={() => say(STEP_PROMPTS[step])}
                aria-label="Hear this again"
                className="icon-btn shrink-0"
                style={{ width: 44, height: 44 }}
                title="Hear Sunny speak"
              >
                <Volume2 size={22} strokeWidth={2.2} style={{ color: 'var(--daisy)' }} aria-hidden="true" />
              </button>
            </div>

            {step === 1 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {LEAVES.map((item) => (
                  <button
                    key={item.name}
                    data-selected={leaf.name === item.name}
                    aria-pressed={leaf.name === item.name}
                    style={{ '--sel': item.color } as React.CSSProperties}
                    onClick={(e) => chooseLeaf(item, e)}
                    className="pick-card px-2 py-3.5 flex flex-col items-center gap-1.5 text-center min-h-[148px]"
                  >
                    <LeafArt name={item.name} size={64} />
                    <span className="text-base sm:text-lg font-black leading-tight text-white mt-1">{item.name}</span>
                    <span className="text-[11px] sm:text-xs text-amber-100/80 font-semibold line-clamp-1">{item.blurb}</span>
                    {leaf.name === item.name && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white text-emerald-900 px-2 py-0.5 rounded-full shadow-sm mt-0.5">
                        ✓ Picked!
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {TREATS.map((item) => (
                  <button
                    key={item.name}
                    data-selected={treat.name === item.name}
                    aria-pressed={treat.name === item.name}
                    style={{ '--sel': item.color } as React.CSSProperties}
                    onClick={(e) => chooseTreat(item, e)}
                    className="pick-card px-2 py-3.5 flex flex-col items-center gap-1.5 text-center min-h-[148px]"
                  >
                    <TreatIcon name={item.name} size={64} />
                    <span className="text-base sm:text-lg font-black leading-tight text-white mt-1">{item.name}</span>
                    <span className="text-[11px] sm:text-xs text-amber-100/80 font-semibold line-clamp-1">{item.blurb}</span>
                    {treat.name === item.name && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white text-rose-900 px-2 py-0.5 rounded-full shadow-sm mt-0.5">
                        ✓ Picked!
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {NAPS.map((n) => (
                    <button
                      key={n.key}
                      data-selected={napKey === n.key}
                      aria-pressed={napKey === n.key}
                      style={{ '--sel': '#c9a7ff' } as React.CSSProperties}
                      onClick={() => {
                        sounds.playPop();
                        setNapKey(n.key);
                        say(`${n.label}! ${n.sub === 'all night' ? 'I will sleep all night.' : `I will nap for ${n.sub}.`}`);
                      }}
                      className="pick-card px-3 py-3.5 flex flex-col items-center gap-1.5 text-center min-h-[120px]"
                    >
                      <NapIcon id={n.key} size={50} />
                      <span className="text-base font-black text-white">{n.label}</span>
                      <span className="text-xs font-bold text-amber-200">{n.sub}</span>
                      {napKey === n.key && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-white text-purple-900 px-2 py-0.5 rounded-full shadow-sm mt-0.5">
                          ✓ Chosen!
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-2xl bg-black/35 border border-white/20 text-center">
                  <p className="text-base font-bold text-amber-100">
                    🐾 Sunny hopes <strong className="text-amber-300 font-black text-lg">{target}</strong> {target === 1 ? 'forest friend visits' : 'forest friends visit'} during nap time!
                  </p>
                  <div className="mt-2.5 flex justify-center gap-2" aria-hidden="true">
                    {Array.from({ length: target }, (_, i) => (
                      <span key={i} className="text-xl animate-bounce-soft" style={{ animationDelay: `${i * 0.2}s` }}>
                        {FRIENDS[i % FRIENDS.length].icon}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-white/70">
                    {napKey === 'demo' ? '⚡ Demo Mode: Quick 10-second nap for easy testing!' : '🌟 Longer naps and sweeter recipes bring more magical friends!'}
                  </p>
                </div>
              </>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button onClick={() => goStep(step - 1)} aria-label="Back" className="icon-btn" style={{ width: 56, height: 56 }}>
                  <ArrowLeft size={26} strokeWidth={2.2} aria-hidden="true" />
                </button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <button
                  onClick={() => goStep(step + 1)}
                  aria-label="Next step"
                  className="btn-pill primary"
                  style={{ width: 58, height: 58, padding: 0 }}
                >
                  <ArrowRight size={28} strokeWidth={2.5} aria-hidden="true" />
                </button>
              ) : (
                <button onClick={handleTuckIn} disabled={isStarting} className="btn-pill primary px-8 text-lg sm:text-xl font-black" style={{ minHeight: 58 }}>
                  <Moon size={22} strokeWidth={2.5} aria-hidden="true" />
                  🌙 Tuck Sunny In & Brew! 🍵
                </button>
              )}
            </div>
          </section>
        )}

        {/* Bedtime moment while the tea starts */}
        {tuck && (
          <section className="text-center py-6 surface animate-modal">
            <div className="text-5xl animate-bounce-soft mb-2">🍵🦥</div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-200">
              {tuck === 'drink' ? 'Sipping Warm Tea... Yum! 🍵' : 'Sleepy Time! Goodnight... 💤'}
            </h2>
          </section>
        )}

        {/* ---------- BREWING: Sunny is asleep, cozy bedtime screen ---------- */}
        {isBrewing && !tuck && (
          <section className="text-center py-6 surface animate-modal">
            <div className="text-5xl animate-bounce-soft mb-2">😴💤</div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-200">Shhh... Sunny is Sleeping! 🌙</h2>
            <p className="mt-1 text-sm sm:text-base font-bold text-white/90">
              The cozy tea is steeping quietly under the stars.
            </p>
            <div className="my-5 inline-block px-6 py-2.5 rounded-2xl bg-black/40 border-2 border-amber-300/40 shadow-inner">
              <div className="text-xs uppercase font-black text-amber-300 tracking-wider">⏰ Waking Up In</div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-widest mt-0.5 font-mono">
                {formatTimer(remainingSeconds)}
              </div>
            </div>
            <div
              className="progress-line mx-auto w-48 sm:w-64 h-4"
              role="progressbar"
              aria-label="Sleep progress"
              aria-valuenow={Math.floor(brewProgress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: `${brewProgress * 100}%` }} />
            </div>
            <div
              className="mt-6 flex flex-wrap justify-center gap-2"
              role="img"
              aria-label={`Friends at the party: ${served} of ${brewTarget}`}
            >
              {Array.from({ length: Math.max(brewTarget, arrivals.length) }, (_, i) => {
                const arrived = i < served;
                const f = FRIENDS[i % FRIENDS.length];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: arrived ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.1)',
                      border: arrived ? '2px solid #34d399' : '1.5px solid rgba(255, 255, 255, 0.2)',
                      color: arrived ? '#a7f3d0' : 'rgba(255, 255, 255, 0.5)',
                      boxShadow: arrived ? '0 0 10px rgba(52, 211, 153, 0.4)' : 'none',
                    }}
                  >
                    <span>{f.icon}</span>
                    <span>{f.name}</span>
                    {arrived && <span>✓</span>}
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-sm font-bold text-amber-200 min-h-6" role="status">
              {friendNote ? friendNote : '🌟 Relax and listen to the soothing bedtime sounds...'}
            </p>
            <p className="mt-4 text-xs font-semibold text-white/60">
              Close the game now. Your tea party will be waiting when you wake up!
            </p>
          </section>
        )}

        {/* ---------- READY ---------- */}
        {isReady && !tuck && (
          <section className="text-center py-6 surface animate-modal">
            <div className="text-6xl animate-bounce mb-2">🎁✨</div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-black text-amber-300 drop-shadow-md">
              Hooray! Sunny Woke Up! 🦥🎉
            </h2>
            <p className="mt-2 text-base font-bold text-white/90">
              {served} forest {served === 1 ? 'friend' : 'friends'} joined the bedtime tea party!
            </p>
            <div className="mt-6">
              <button
                onClick={handleClaim}
                disabled={isClaiming}
                className="btn-pill primary px-10 py-4 text-xl sm:text-2xl font-black min-h-[64px] animate-pulse"
              >
                <Gift size={28} strokeWidth={2.5} aria-hidden="true" />
                {isClaiming ? 'Opening Surprise... 🎁' : 'OPEN THE SURPRISE! 🌟'}
              </button>
            </div>
          </section>
        )}

        {/* Wishes: Today's Bedtime Quests */}
        {!isBedtimeActive && (
          <section className="surface p-4 rounded-3xl" aria-label="Today's Bedtime Quests">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <h3 className="text-base font-black uppercase tracking-wider text-amber-200">
                  Today&apos;s Bedtime Quests
                </h3>
              </div>
              <span className="text-xs font-black bg-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full shadow-sm">
                ⭐ +50 XP Each
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {wishes.map((w, wi) => {
                const questIcons = ['🍃', '🛁', '🛏️', '🎁'];
                return (
                  <div
                    key={w.label}
                    className="p-2.5 rounded-2xl flex items-center gap-2 text-left transition-all"
                    style={{
                      background: w.done ? 'rgba(16, 185, 129, 0.28)' : 'rgba(0, 0, 0, 0.28)',
                      border: w.done ? '2px solid #34d399' : '1.5px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <span className="text-2xl shrink-0">{questIcons[wi % questIcons.length]}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white leading-tight">{w.label}</div>
                      <div className="text-[10px] font-black uppercase mt-0.5" style={{ color: w.done ? '#6ee7b7' : 'rgba(255,255,255,0.5)' }}>
                        {w.done ? '✓ Completed!' : 'In Progress'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        </div>
      </div>

      {/* ---------- BOTTOM DOCK (only when awake) ---------- */}
      {!isBedtimeActive && (
        <nav
          inert={!started}
          aria-label="Activities"
          className="fixed z-30 inset-x-3 mx-auto max-w-lg transition-opacity duration-700 surface"
          style={{
            opacity: started ? 1 : 0,
            bottom: 'max(0.75rem, env(safe-area-inset-bottom))',
            borderRadius: 36,
            background: 'linear-gradient(180deg, rgba(45, 24, 115, 0.94) 0%, rgba(25, 12, 75, 0.98) 100%)',
            border: '3px solid rgba(255, 255, 255, 0.32)',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), inset 0 2px 2px rgba(255, 255, 255, 0.4)',
          }}
        >
          <div className="px-2 py-2 grid grid-cols-6 gap-1.5">
            {[
              { key: 'bath', label: 'Bath', emoji: '🛁', Icon: Bath, active: petMode === 'bath', color: '#06b6d4', shadow: '#0891b2' },
              { key: 'snack', label: 'Snack', emoji: '🍓', Icon: Apple, active: petMode === 'snack', color: '#f43f5e', shadow: '#be123c' },
              { key: 'closet', label: 'Closet', emoji: '👗', Icon: Shirt, active: false, color: '#a855f7', shadow: '#7e22ce' },
              { key: 'games', label: 'Games', emoji: '🎮', Icon: Gamepad2, active: false, color: '#10b981', shadow: '#047857' },
              { key: 'talk', label: 'Talk', emoji: '🎤', Icon: Mic, active: false, color: '#f59e0b', shadow: '#b45309' },
              { key: 'tea', label: 'Tea & Bed', emoji: '🍵', Icon: Coffee, active: petMode === 'tea', color: '#ea580c', shadow: '#9a3412' },
            ].map(({ key, label, emoji, Icon, active, color, shadow }) => (
              <button
                key={key}
                onClick={() => {
                  sounds.playClick();
                  if (key === 'bath') {
                    setPetMode('bath');
                    say("Splish splash! Let's take a warm bubble bath! 🫧");
                  } else if (key === 'snack') {
                    setPetMode('snack');
                    say('Yay, snack time! Pick a yummy treat for me! 🍓');
                  } else if (key === 'closet') setShowWardrobeModal(true);
                  else if (key === 'games') setShowMiniGames(true);
                  else if (key === 'talk') setShowTalking(true);
                  else {
                    setPetMode('tea');
                    say("Let's brew bedtime tea for our forest friends! 🍵");
                  }
                }}
                aria-label={label}
                aria-pressed={active}
                className="flex flex-col items-center justify-center gap-1 min-h-[74px] rounded-2xl transition-transform active:scale-90"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white font-black text-2xl transition-all"
                  style={
                    active
                      ? {
                          background: color,
                          boxShadow: `0 4px 0 ${shadow}, 0 0 16px ${color}`,
                          border: '2px solid #ffffff',
                          transform: 'scale(1.1) translateY(-2px)',
                        }
                      : {
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1.5px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 3px 0 rgba(0, 0, 0, 0.3)',
                        }
                  }
                >
                  <span className="leading-none">{emoji}</span>
                </span>
                <span
                  className="text-[11px] font-black leading-none uppercase tracking-tight"
                  style={{ color: active ? '#ffd23f' : 'rgba(255, 255, 255, 0.75)' }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* ---------- MENU ---------- */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[50]"
          style={{ background: 'rgba(15,13,26,0.7)' }}
          onClick={() => setShowMenu(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div
            className="surface animate-modal absolute top-3 right-3 w-[min(22rem,calc(100vw-1.5rem))] p-3"
            style={{ background: 'var(--surface-solid)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Menu</span>
              <CloseButton onClick={() => setShowMenu(false)} />
            </div>
            {[
              { label: 'Sticker book', Icon: BookOpen, hint: String(invCount), run: () => setShowBook(true) },
              { label: 'Themes', Icon: Palette, hint: DIORAMA_THEMES[dioramaTheme]?.name ?? '', run: () => setShowThemeModal(true) },
              { label: 'Forecast', Icon: Sparkles, hint: '', run: () => setShowCrystalModal(true) },
            ].map(({ label, Icon, hint, run }) => (
              <button
                key={label}
                onClick={() => {
                  sounds.playClick();
                  setShowMenu(false);
                  run();
                }}
                className="w-full min-h-14 px-3 flex items-center gap-3 rounded-2xl text-left hover:bg-white/5"
              >
                <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
                <span className="flex-1 text-base">{label}</span>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>{plain(hint)}</span>
              </button>
            ))}
            {isBrewing && (
              <>
                <div className="px-3 pt-3 pb-1 text-sm" style={{ color: 'var(--muted)' }}>Sleep sound</div>
                <div className="flex flex-wrap gap-2 px-3 pb-2">
                  {[
                    { key: 'rain', label: 'Rain' },
                    { key: 'breeze', label: 'Breeze' },
                    { key: 'chimes', label: 'Chimes' },
                    { key: 'off', label: 'Off' },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      aria-pressed={soundscape === mode.key}
                      onClick={() => {
                        sounds.playClick();
                        setSoundscape(mode.key as 'off' | 'rain' | 'breeze' | 'chimes');
                      }}
                      className={`btn-pill px-4 ${soundscape === mode.key ? 'primary' : ''}`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleFastForward();
                  }}
                  disabled={isFastForwarding}
                  className="w-full min-h-14 px-3 flex items-center gap-3 rounded-2xl text-left hover:bg-white/5 disabled:opacity-50"
                >
                  <Zap size={22} strokeWidth={1.5} aria-hidden="true" />
                  <span className="flex-1 text-base">{isFastForwarding ? 'Skipping...' : 'Skip the steep'}</span>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>Demo</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {showGate && (
        <ParentGate
          onClose={() => setShowGate(false)}
          onPass={() => {
            setShowGate(false);
            setShowGrownups(true);
          }}
        />
      )}

      {/* ---------- PRIZE ---------- */}
      {lootModal && (
        <Modal
          title="Sunny's surprise!"
          onClose={() => {
            sounds.playClick();
            speech.stop();
            setLootModal(null);
            setNoteOverride(null);
            setConfetti(false);
            say('Into the sticker book it goes! Want to play more with Sunny?');
          }}
        >
          {(() => {
            const kid = rarityKid(lootModal.rarity);
            const f = friendFor(lootModal.item_name, 0);
            const served2 = lootModal.customers_served ?? 0;
            const tgt = lootModal.customers_target ?? 0;
            return (
              <div className="text-center">
                <div
                  className="inline-block rounded-3xl border-2 px-8 py-5"
                  style={{
                    borderColor: kid.color,
                    background: `color-mix(in srgb, ${kid.color} 12%, transparent)`,
                    boxShadow: `0 0 32px color-mix(in srgb, ${kid.color} 35%, transparent)`,
                  }}
                >
                  <div className="flex justify-center gap-2" style={{ color: kid.color }}>
                    {(lootModal.ingredients ?? []).map((n) => (
                      <IngredientArt key={n} name={n} size={44} />
                    ))}
                  </div>
                  <div className="text-xl font-semibold mt-2">{kid.label} Tea</div>
                  <div className="mt-1 flex justify-center gap-1" style={{ color: kid.color }} role="img" aria-label={`${kid.stars} stars`}>
                    {Array.from({ length: kid.stars }, (_, k) => (
                      <Star key={k} size={20} strokeWidth={1.5} fill="currentColor" aria-hidden="true" />
                    ))}
                  </div>
                </div>

                {tgt > 0 && (
                  <div
                    className="mt-4 rounded-2xl p-3 surface"
                    style={{ borderColor: lootModal.quota_met ? 'var(--mint)' : 'var(--border-strong)' }}
                  >
                    {lootModal.quota_met
                      ? `All ${tgt} friends came! +${bonusXp(served2, tgt)} bonus stars`
                      : `${served2} of ${tgt} friends came. A longer nap invites more friends!`}
                    {!lootModal.quota_met && lootModal.base_rarity && lootModal.base_rarity !== lootModal.rarity && (
                      <div className="text-sm" style={{ color: 'var(--muted)' }}>The tea is a little less sparkly this time, and that is okay!</div>
                    )}
                  </div>
                )}

                <div className="mt-4 rounded-2xl surface p-4 text-left">
                  <div className="text-sm" style={{ color: 'var(--muted)' }}>
                    A note from {f.name}
                  </div>
                  <p className="mt-1 text-lg leading-snug min-h-[3.5rem]">
                    <Typewriter key={note} text={note} />
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => speech.speak(note, { onStart: () => setTalking(true), onEnd: () => setTalking(false) })}
                    className="btn-pill px-5"
                  >
                    <Volume2 size={20} strokeWidth={1.5} aria-hidden="true" />
                    Hear it again
                  </button>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setShowAttributionModal(true);
                    }}
                    className="btn-pill px-5"
                  >
                    <FlaskConical size={20} strokeWidth={1.5} aria-hidden="true" />
                    AI Attribution
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* ---------- MINI-GAMES MODAL (only when awake) ---------- */}
      {showMiniGames && !isBedtimeActive && (
        <Modal title="Sunny's Mini-Games Arcade 🎮" onClose={() => setShowMiniGames(false)} wide>
          <MiniGamesModal
            onScoreReward={(xp) => {
              setExtraXP((x) => x + xp);
              setConfetti(true);
              sounds.playAchievement();
              setTimeout(() => setConfetti(false), 3000);
            }}
            onClose={() => setShowMiniGames(false)}
          />
        </Modal>
      )}

      {/* ---------- TALK TO SUNNY MODAL (only when awake) ---------- */}
      {showTalking && !isBedtimeActive && (
        <Modal title="Talk to Sunny 🦥" onClose={() => setShowTalking(false)}>
          <TalkingSlothModal onSay={say} onSetTalking={setTalking} />
        </Modal>
      )}

      {/* ---------- STICKER BOOK ---------- */}
      {showBook && (
        <Modal title="📖 My Sticker Book! ✨" onClose={() => setShowBook(false)} wide>
          {invCount === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl animate-bounce-soft mb-2">📖✨</div>
              <p className="text-lg font-bold text-amber-100">
                No stickers yet! Make your first cozy tea with Sunny to earn one!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              {[...(user?.inventory ?? [])].reverse().map((item, idx) => {
                const kid = rarityKid(item.rarity);
                return (
                  <button
                    key={`${item.item_name}-${idx}`}
                    onClick={() => {
                      sounds.playPop();
                      setSelectedSticker(item as Loot);
                    }}
                    className="pick-card p-3.5 text-center rounded-2xl flex flex-col items-center justify-between"
                    style={{ '--sel': kid.color } as React.CSSProperties}
                    aria-label={`${kid.label} tea. Tap to view details.`}
                  >
                    <div className="flex justify-center gap-1.5" style={{ color: kid.color }}>
                      {(item.ingredients ?? []).map((n) => (
                        <IngredientArt key={n} name={n} size={38} />
                      ))}
                    </div>
                    <div className="mt-2 font-black text-sm sm:text-base text-white">{item.item_name}</div>
                    <div className="flex justify-center gap-1 mt-1" style={{ color: kid.color }} aria-hidden="true">
                      {Array.from({ length: kid.stars }, (_, k) => (
                        <Star key={k} size={16} strokeWidth={2} fill="currentColor" />
                      ))}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider mt-2 px-2.5 py-0.5 rounded-full text-white" style={{ background: kid.color }}>
                      {kid.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {/* ---------- GROWN-UPS ---------- */}
      {showGrownups && (
        <Modal title="For grown-ups & Hackathon Judges 👪" onClose={() => setShowGrownups(false)} wide>
          <div className="space-y-4 text-base leading-relaxed">
            <div className="p-4 surface" style={{ borderColor: 'var(--accent)' }}>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Zap size={20} strokeWidth={1.5} aria-hidden="true" />
                Judge Demo Mode
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                For quick evaluation: pick <strong>Demo (10 seconds)</strong> in step 3 when choosing nap length, or open the menu and choose <strong>Skip the steep</strong> while Sunny sleeps to test the wake-up, animal friend arrivals, and AI prize loot in seconds.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg">Talking Pet & Bedtime Game for Kids</h3>
              <p>
                Kids can care for Sunny just like Talking Tom: give Sunny a warm bubble bath, feed delicious snacks, play fun sensory mini-games (Bubble Pop, Forest Friends Match, Leaf Catcher), and talk with Sunny! When it is bedtime, kids tuck Sunny in with chamomile tea and go to sleep too.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Open-source AI, safe and free to run</h3>
              <ul className="list-disc pl-5">
                <li>Sunny&apos;s friends write notes with open-weight <strong>Gemma</strong>, running on this device or via Ollama.</li>
                <li>Prize rarity is predicted by open-source <strong>TabPFN</strong>, with a simple fallback when it is not installed.</li>
                <li>Sunny&apos;s voice uses your browser&apos;s built-in speech. Nothing is ever sent to third-party tracking services.</li>
              </ul>
            </div>
            <div className="rounded-2xl surface p-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Brain size={20} strokeWidth={1.5} aria-hidden="true" />
                Sunny&apos;s brain (in-browser Gemma 2B, optional)
              </h3>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                Download Gemma (about 320 MB, one time) to run client-side in the browser via transformers.js. It works offline and nothing ever leaves the device. If device memory is limited (e.g. mobile Safari / low-RAM), Sunny automatically uses the built-in procedural lore.
              </p>
              {brain.status === 'ready' || brainReady() ? (
                <div className="mt-2 font-semibold flex items-center gap-2" style={{ color: 'var(--mint)' }}>
                  <Check size={18} strokeWidth={1.5} aria-hidden="true" />
                  Sunny&apos;s brain is awake
                </div>
              ) : (
                <>
                  <button onClick={enableBrain} disabled={brain.status === 'loading'} className="btn-pill primary mt-3 px-5">
                    <Download size={18} strokeWidth={1.5} aria-hidden="true" />
                    {brain.status === 'loading' ? `Downloading... ${brain.pct}%` : 'Wake up Sunny’s brain'}
                  </button>
                  {brain.status === 'error' && (
                    <div className="mt-2 text-sm p-3 rounded-xl surface flex gap-2" style={{ color: 'var(--danger)' }}>
                      <TriangleAlert size={18} strokeWidth={1.5} className="shrink-0 mt-0.5" aria-hidden="true" />
                      Could not load in-browser weights (common on low-memory/mobile devices). Sunny will keep using the fast built-in procedural notes with zero lag!
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Developer & Judge Disclaimer: Local Ollama Gemma Setup */}
            <div className="rounded-2xl surface p-4">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Terminal size={18} strokeWidth={1.5} aria-hidden="true" />
                Developer &amp; Judge Guide: Local Gemma via Ollama
              </h3>
              <div className="text-sm mt-2 space-y-2 leading-relaxed" style={{ color: 'var(--muted)' }}>
                <p>
                  <strong>Render Free Tier Disclaimer:</strong> Render&apos;s free tier provides 512 MB RAM. This is perfect for the fast 3D graphics and procedural lore generator, but cannot host multi-gigabyte local LLM weights (Gemma / Llama) inside the container.
                </p>
                <p>
                  <strong>Zero-Crash Procedural Fallback:</strong> If no Ollama daemon is detected, the app automatically switches to the built-in procedural lore writer with 0 latency and 0 errors.
                </p>
                <div className="bg-black/50 rounded-xl p-3 font-mono text-[11px] text-amber-300 space-y-1 overflow-x-auto">
                  <div className="text-indigo-300 font-sans font-bold text-xs">How to test with your local Ollama Gemma:</div>
                  <div># 1. Run local Gemma on your machine</div>
                  <div>ollama run gemma2:2b</div>
                  <div className="text-indigo-400"># or: ollama run llama3.2:1b</div>
                  <div className="pt-1 text-slate-300"># 2. When running locally (npm run dev), the app connects to http://localhost:11434 automatically!</div>
                  <div className="text-slate-300"># 3. If testing against your Render deployed web app, tunnel Ollama:</div>
                  <div>ngrok http 11434</div>
                  <div className="text-slate-300"># Then set OLLAMA_HOST in your Render Environment to your ngrok URL!</div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setVoiceOn((v) => !v)} aria-pressed={voiceOn} className="btn-pill px-5">
                {voiceOn ? <Volume2 size={18} strokeWidth={1.5} aria-hidden="true" /> : <VolumeX size={18} strokeWidth={1.5} aria-hidden="true" />}
                {voiceOn ? 'Voice on' : 'Voice off'}
              </button>
              <button onClick={() => setSfxOn((v) => !v)} aria-pressed={sfxOn} className="btn-pill px-5">
                {sfxOn ? <Volume2 size={18} strokeWidth={1.5} aria-hidden="true" /> : <VolumeX size={18} strokeWidth={1.5} aria-hidden="true" />}
                {sfxOn ? 'Sounds on' : 'Sounds off'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- DRESS-UP WARDROBE CLOSET MODAL ---------- */}
      {showWardrobeModal && (
        <WardrobeModal
          currentOutfit={outfit}
          onSaveOutfit={handleUpdateOutfit}
          onSay={say}
          onFloatEmoji={floatEmoji}
          onClose={() => setShowWardrobeModal(false)}
          furColor={shownLeaf.color}
          accentColor={shownTreat.color}
          theme={dioramaTheme}
        />
      )}

      {/* ---------- 3D DIORAMA THEME SELECTION MODAL ---------- */}
      {showThemeModal && (
        <Modal title="🎨 Choose Atmosphere & Diorama Theme" onClose={() => setShowThemeModal(false)}>
          <div className="space-y-3.5">
            <p className="text-sm leading-relaxed text-center" style={{ color: 'var(--muted)' }}>
              Transform Sunny&apos;s tea party nook with seasonal lanterns, animated background particles, kettle styles, and atmospheric lighting!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.values(DIORAMA_THEMES) as Array<typeof DIORAMA_THEMES[keyof typeof DIORAMA_THEMES]>).map((th, index) => {
                const isSelected = dioramaTheme === th.id;
                const details = THEME_DETAILS[th.id];
                return (
                  <button
                    key={th.id}
                    onClick={(e) => {
                      sounds.playClick();
                      setDioramaTheme(th.id);
                      floatEmoji(th.icon, e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight / 2);
                      try {
                        localStorage.setItem('midnight_theme', th.id);
                      } catch {}
                      say(`Welcome to the ${th.name}! ${th.icon}`);
                    }}
                    data-selected={isSelected}
                    aria-pressed={isSelected}
                    className={`pick-card p-3 text-left flex items-start gap-3 ${index === 4 ? 'sm:col-span-2' : ''}`}
                  >
                    <span className="mt-0.5" style={{ color: 'var(--accent)' }}>
                      {(() => {
                        const ThemeIcon = THEME_ICONS[th.id] ?? Sparkles;
                        return <ThemeIcon size={28} strokeWidth={1.5} aria-hidden="true" />;
                      })()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-base flex items-center justify-between">
                        <span>{th.name}</span>
                        {isSelected && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: 'var(--accent-ink)' }}>
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                        {plain(details?.tag ?? '')}
                      </div>
                      <div className="text-sm mt-1 leading-snug line-clamp-2">
                        {plain(th.description)}
                      </div>
                      {/* Mini Palette Swatch */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>Palette</span>
                        <div className="flex items-center gap-1">
                          {details?.swatches.map((color, idx) => (
                            <span
                              key={idx}
                              className="w-3.5 h-3.5 rounded-full inline-block"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- TABPFN AI ALCHEMIST MODAL ---------- */}
      {showCrystalModal && (
        <Modal title="🔮 TabPFN AI Alchemist Lab" onClose={() => setShowCrystalModal(false)} wide>
          <div className="space-y-3">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Explore live in-context Bayesian probability distributions and multi-task sensory flavor regression predicted by <strong>TabPFN</strong> for your current recipe:
            </p>
            <AlchemistCrystalBall
              leafName={leaf.name}
              treatName={treat.name}
              napKey={napKey}
              streak={streak}
              careXP={extraXP}
              onSelectNap={(key) => setNapKey(key)}
            />
          </div>
        </Modal>
      )}

      {/* ---------- TABPFN ATTRIBUTION POPUP MODAL (Loot claim) ---------- */}
      {showAttributionModal && lootModal && (
        <Modal title="🔬 TabPFN AI Attribution & Flavors" onClose={() => setShowAttributionModal(false)} wide>
          <div className="space-y-3">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              Transparent Explainable AI (XAI) feature attribution breakdown for your <strong>{lootModal.item_name}</strong>:
            </p>
            <TabPFNAttributionCard loot={lootModal} defaultExpanded={true} />
          </div>
        </Modal>
      )}

      {/* ---------- TABPFN STICKER DETAIL POPUP MODAL (Sticker book) ---------- */}
      {selectedSticker && (
        <Modal title={`🍵 ${selectedSticker.item_name}`} onClose={() => setSelectedSticker(null)} wide>
          <div className="space-y-3">
            <div className="text-center p-4 surface">
              <div className="flex justify-center gap-2" style={{ color: 'var(--accent)' }}>
                {(selectedSticker.ingredients ?? []).map((n) => (
                  <IngredientArt key={n} name={n} size={40} />
                ))}
              </div>
              <div className="text-base font-semibold mt-2">{selectedSticker.item_name}</div>
              <div className="text-sm mt-0.5 italic" style={{ color: 'var(--muted)' }}>&ldquo;{selectedSticker.review}&rdquo;</div>
            </div>
            <TabPFNAttributionCard loot={selectedSticker} defaultExpanded={true} />
          </div>
        </Modal>
      )}

      {/* ---------- TITLE SCREEN: wordmark over the live Sunny ---------- */}
      {!started && (
        <div
          className="fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center text-center px-5 pt-16 pb-12"
          style={{ background: 'linear-gradient(to top, rgba(28,14,80,0.95) 60%, transparent)' }}
        >
          <div className="flex items-center gap-2 mb-2 animate-bounce-soft">
            <span className="text-3xl">⭐</span>
            <span className="text-4xl">🌙</span>
            <span className="text-3xl">✨</span>
          </div>
          <h1 className="wordmark text-4xl sm:text-6xl font-black drop-shadow-xl">
            The Midnight Steeper
          </h1>
          <p className="mt-2 text-base sm:text-lg font-black text-amber-200">
            🦥 Cozy 3D Bedtime Tea Party with Sunny the Sloth! 🍵
          </p>
          <button
            onClick={handleStart}
            className="btn-pill primary mt-6 px-12 py-4 text-2xl font-black min-h-[66px] shadow-[0_8px_0_#9a3412,0_16px_30px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-transform"
          >
            <Play size={28} strokeWidth={3} aria-hidden="true" />
            LET&apos;S PLAY! 🌟
          </button>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs font-black uppercase text-amber-100/90 tracking-wide">
            <span className="px-3.5 py-1 rounded-full bg-white/10 border border-white/20">✨ 100% Free</span>
            <span className="px-3.5 py-1 rounded-full bg-white/10 border border-white/20">🔒 Kid Safe</span>
            <span className="px-3.5 py-1 rounded-full bg-white/10 border border-white/20">🌙 Bedtime Story</span>
          </div>
        </div>
      )}
    </main>
  );
}
