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
  iconFor,
  rarityKid,
  getRank,
  POKE_LINES,
  SLEEP_MUMBLES,
  FIFTH_POKE,
  SnackItem,
} from '@/lib/kidsContent';
import { brainWasEnabled, brainReady, loadBrain, writeNote, BrainStatus } from '@/lib/browserAI';
import Fireflies from '@/components/Fireflies';
import ProgressRing from '@/components/ProgressRing';
import BathMode from '@/components/BathMode';
import SnackMode from '@/components/SnackMode';
import MiniGamesModal from '@/components/MiniGamesModal';
import TalkingSlothModal from '@/components/TalkingSlothModal';
import { AlchemistCrystalBall } from '@/components/AlchemistCrystalBall';
import { TabPFNAttributionCard } from '@/components/TabPFNAttributionCard';
import { DIORAMA_THEMES, type DioramaTheme, type PetMood } from '@/components/SlothPet3D';

const SlothPet3D = dynamic(() => import('@/components/SlothPet3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-lg font-semibold">
      <div className="text-6xl animate-bounce-soft">🦥</div>
      <span className="mt-2">Sunny is waking up...</span>
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

function Modal({
  title,
  onClose,
  children,
  wide,
}: Readonly<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }>) {
  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-3 bg-purple-950/45 backdrop-blur-sm">
      <div className={`toy-card animate-modal w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative`}>
        <button
          onClick={onClose}
          aria-label="Close"
          className="btn-chunky blue absolute top-3 right-3 w-11 h-11 sm:w-12 sm:h-12 text-xl flex items-center justify-center"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold pr-14 mb-4">{title}</h2>
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
  const [dioramaTheme, setDioramaTheme] = useState<DioramaTheme>('classic');
  const [showThemeModal, setShowThemeModal] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('midnight_theme') as DioramaTheme | null;
      if (savedTheme && DIORAMA_THEMES[savedTheme]) {
        setDioramaTheme(savedTheme);
      }
    } catch {}
  }, []);
  const [brain, setBrain] = useState<{ status: BrainStatus; pct: number }>({ status: 'off', pct: 0 });

  const [sessionPicks, setSessionPicks] = useState(0);
  const [sessionBrews, setSessionBrews] = useState(0);
  const [sessionClaims, setSessionClaims] = useState(0);

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

  const comboIcons = (ingredients?: string[]) => (ingredients ?? []).map(iconFor).join('');

  return (
    <main className={`relative min-h-screen ${night ? 'night' : ''}`}>
      <div className="sky sky-day" style={{ opacity: night ? 0 : 1 }} />
      <div className="sky sky-night" style={{ opacity: night ? 1 : 0 }} />
      <div className="sky-stars" style={{ opacity: night ? 1 : 0 }} />
      <Fireflies night={night} />

      {/* Floating hearts, stars and friends */}
      <div className="fixed inset-0 pointer-events-none z-[56] overflow-hidden" aria-hidden="true">
        {floaters.map((f) => (
          <div key={f.id} className="absolute text-4xl animate-float-up" style={{ left: f.x - 20, top: f.y - 20 }}>
            {f.text}
          </div>
        ))}
      </div>
      {confetti && <Confetti />}

      {levelUp !== null && (
        <div className="fixed inset-0 z-[57] flex items-center justify-center pointer-events-none">
          <div className="toy-card animate-pop px-8 py-6 text-center">
            <div className="text-5xl">🌟</div>
            <div className="text-3xl font-bold">Level {levelUp}!</div>
            <div className="text-lg font-semibold">You are now a {getRank(levelUp)}</div>
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto w-full max-w-3xl px-3 sm:px-5 py-3 flex flex-col gap-4">
        {/* Top bar */}
        <header className="toy-card px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-4xl">🦥</span>
            <div className="min-w-0">
              <div className="font-bold text-base sm:text-lg leading-tight truncate">Sunny the Talking Sloth</div>
              <div className="text-sm font-medium opacity-80 truncate">
                Level {playerLevel} · {getRank(playerLevel)}
              </div>
              <div className="mt-1 h-2.5 w-36 rounded-full bg-black/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-400 via-amber-300 to-sky-400 transition-all duration-700"
                  style={{ width: `${(currentXP / 1000) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isBrewing && (
              <button
                onClick={handleFastForward}
                disabled={isFastForwarding}
                aria-label="Fast-Forward Steep for demo"
                className="btn-chunky yellow h-11 sm:h-12 px-2.5 sm:px-3 text-xs sm:text-sm font-bold flex items-center gap-1 animate-pulse"
                title="⚡ Fast-forward sleep timer (Judge Demo Mode)"
              >
                ⚡ <span className="hidden sm:inline">{isFastForwarding ? 'Skipping...' : 'Fast-Forward'}</span>
              </button>
            )}
            <button
              onClick={() => {
                sounds.playClick();
                setShowCrystalModal(true);
              }}
              aria-label="TabPFN AI Alchemist Forecast"
              className="btn-chunky purple w-11 h-11 sm:w-12 sm:h-12 text-xl flex items-center justify-center hover:scale-105"
              title="🔮 TabPFN AI Alchemist Forecast & Odds"
            >
              🔮
            </button>
            <button
              onClick={() => setVoiceOn((v) => !v)}
              aria-label={voiceOn ? 'Turn Sunny’s voice off' : 'Turn Sunny’s voice on'}
              className={`btn-chunky ${voiceOn ? 'green' : 'purple'} w-11 h-11 sm:w-12 sm:h-12 text-xl flex items-center justify-center`}
            >
              {voiceOn ? '🔊' : '🔇'}
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setShowBook(true);
              }}
              aria-label="Open sticker book"
              className="btn-chunky yellow h-12 px-3 text-xl flex items-center gap-1"
            >
              📖<span className="text-base font-bold">{invCount}</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setShowGrownups(true);
              }}
              aria-label="For grown-ups"
              className="btn-chunky blue w-11 h-11 sm:w-12 sm:h-12 text-xl flex items-center justify-center"
            >
              👪
            </button>
          </div>
        </header>

        {errorMsg && (
          <div className="toy-card px-4 py-3 text-center font-semibold bg-amber-100" role="alert">
            🙈 {errorMsg}
          </div>
        )}

        {/* 3D stage: tap Sunny! */}
        <section
          className="toy-card relative overflow-hidden h-[46vh] min-h-[310px] max-h-[460px]"
          onPointerDown={(e) => {
            pointerRef.current = { x: e.clientX, y: e.clientY };
          }}
        >
          {/* 3D Diorama Theme Switcher Badge */}
          <button
            onClick={() => {
              sounds.playClick();
              setShowThemeModal(true);
            }}
            aria-label="Change 3D Diorama Theme"
            className="absolute top-3 right-3 z-20 btn-chunky purple py-1 px-2.5 sm:px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95"
            title="Switch 3D Diorama Atmosphere Theme"
          >
            <span className="text-base sm:text-lg">{DIORAMA_THEMES[dioramaTheme]?.icon || '🎨'}</span>
            <span className="hidden sm:inline">{DIORAMA_THEMES[dioramaTheme]?.name || 'Theme'}</span>
            <span className="text-[10px] opacity-75">🎨</span>
          </button>

          <SlothPet3D
            mood={mood}
            furColor={shownLeaf.color}
            accentColor={shownTreat.color}
            pokeCount={pokeCount}
            onPoke={onPoke}
            starlightGlow={currentBrew?.loot?.sensory?.starlight_glow ?? (lootModal?.sensory?.starlight_glow ?? (leaf.name === 'Moon Mint' || treat.name === 'Star Sugar' ? 85 : 50))}
            theme={dioramaTheme}
          />

          {bubble && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[88%] max-w-md z-20 pointer-events-none">
              <div key={bubble.id} className="bubble px-4 py-3 text-center text-lg font-semibold leading-snug">
                {bubble.text}
              </div>
            </div>
          )}

          {mood === 'sleeping' && (
            <div className="absolute left-[56%] top-[28%] text-3xl font-bold text-sky-100 pointer-events-none" aria-hidden="true">
              <span className="absolute animate-zzz">Z</span>
              <span className="absolute animate-zzz" style={{ animationDelay: '1s' }}>z</span>
              <span className="absolute animate-zzz" style={{ animationDelay: '2s' }}>z</span>
            </div>
          )}

          <div className="absolute bottom-2 left-0 right-0 text-center text-sm font-semibold opacity-80 pointer-events-none">
            {mood === 'sleeping'
              ? '💤 Shh... Sunny is sleeping peacefully'
              : mood === 'bathing'
              ? '🛁 Splish splash! Sunny is enjoying the bath!'
              : '👆 Tap or tickle Sunny!'}
          </div>
        </section>

        {/* Activity Navigation Bar (Active only when awake; calm bedtime notice when sleeping) */}
        {isBedtimeActive ? (
          <div className="toy-card px-4 py-3.5 text-center bg-indigo-950/60 border-indigo-300/40 text-indigo-100 flex items-center justify-center gap-3 select-none">
            <span className="text-3xl animate-bounce-soft">🌙</span>
            <div className="text-left">
              <div className="font-bold text-sm sm:text-base text-white">Shhh... Sunny is sleeping soundly 💤</div>
              <div className="text-xs sm:text-sm text-indigo-200">
                No baths, snacks, or games right now. Time for you to sleep too!
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
            <button
              onClick={() => {
                sounds.playClick();
                setPetMode('bath');
                say("Splish splash! Let's take a warm bubble bath! 🛁");
              }}
              aria-label="Bath time"
              className={`btn-chunky p-2 sm:p-2.5 flex flex-col items-center justify-center gap-1 ${
                petMode === 'bath' ? 'blue ring-4 ring-sky-300 scale-105' : 'purple'
              }`}
            >
              <span className="text-2xl sm:text-3xl">🛁</span>
              <span className="text-xs sm:text-sm font-bold">Bath</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setPetMode('snack');
                say("Yay, snack time! Pick a yummy treat for me! 🍓");
              }}
              aria-label="Snack time"
              className={`btn-chunky p-2 sm:p-2.5 flex flex-col items-center justify-center gap-1 ${
                petMode === 'snack' ? 'yellow ring-4 ring-amber-300 scale-105' : 'purple'
              }`}
            >
              <span className="text-2xl sm:text-3xl">🍓</span>
              <span className="text-xs sm:text-sm font-bold">Snack</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setShowMiniGames(true);
              }}
              aria-label="Mini games"
              className="btn-chunky green p-2 sm:p-2.5 flex flex-col items-center justify-center gap-1 hover:scale-105"
            >
              <span className="text-2xl sm:text-3xl">🎮</span>
              <span className="text-xs sm:text-sm font-bold">Games</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setShowTalking(true);
              }}
              aria-label="Talk to Sunny"
              className="btn-chunky purple p-2 sm:p-2.5 flex flex-col items-center justify-center gap-1 hover:scale-105"
            >
              <span className="text-2xl sm:text-3xl">🎤</span>
              <span className="text-xs sm:text-sm font-bold">Talk</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setPetMode('tea');
                say("Let's brew bedtime tea for our forest friends! 🍵");
              }}
              aria-label="Bedtime tea"
              className={`btn-chunky p-2 sm:p-2.5 flex flex-col items-center justify-center gap-1 ${
                petMode === 'tea' ? 'blue ring-4 ring-indigo-300 scale-105' : 'purple'
              }`}
            >
              <span className="text-2xl sm:text-3xl">🍵</span>
              <span className="text-xs sm:text-sm font-bold">Tea & Bed</span>
            </button>
          </div>
        )}

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
          <section className="toy-card p-4 sm:p-6">
            <div className="flex items-center justify-center gap-2 mb-3" aria-label={`Step ${step} of 3`}>
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg border-4 border-white ${
                    n === step ? 'bg-pink-400 text-white scale-110' : n < step ? 'bg-emerald-400 text-white' : 'bg-white/70'
                  }`}
                >
                  {n < step ? '✓' : n}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-xl sm:text-2xl font-bold">
                {step === 1 && '1. Pick a leaf or flower 🌸'}
                {step === 2 && '2. Pick a yummy treat 🍯'}
                {step === 3 && '3. How long is Sunny\'s nap? 😴'}
              </h2>
              <button
                onClick={() => say(STEP_PROMPTS[step])}
                aria-label="Hear this again"
                className="btn-chunky blue w-11 h-11 text-lg shrink-0 flex items-center justify-center"
              >
                🔊
              </button>
            </div>

            {step === 1 && (
              <div className="grid grid-cols-3 gap-3">
                {LEAVES.map((item) => (
                  <button
                    key={item.name}
                    data-selected={leaf.name === item.name}
                    style={{ '--sel': item.color } as React.CSSProperties}
                    onClick={(e) => chooseLeaf(item, e)}
                    className="pick-card p-2 sm:p-3 text-center text-[#3b2a63]"
                  >
                    <div className="text-4xl sm:text-5xl">{item.icon}</div>
                    <div className="mt-1 text-sm sm:text-base font-semibold leading-tight">{item.name}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-3 gap-3">
                {TREATS.map((item) => (
                  <button
                    key={item.name}
                    data-selected={treat.name === item.name}
                    style={{ '--sel': item.color } as React.CSSProperties}
                    onClick={(e) => chooseTreat(item, e)}
                    className="pick-card p-2 sm:p-3 text-center text-[#3b2a63]"
                  >
                    <div className="text-4xl sm:text-5xl">{item.icon}</div>
                    <div className="mt-1 text-sm sm:text-base font-semibold leading-tight">{item.name}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {NAPS.map((n) => (
                    <button
                      key={n.key}
                      data-selected={napKey === n.key}
                      style={{ '--sel': '#9b7bff' } as React.CSSProperties}
                      onClick={() => {
                        sounds.playPop();
                        setNapKey(n.key);
                        say(`${n.label}! ${n.sub === 'all night' ? 'I will sleep all night.' : `I will nap for ${n.sub}.`}`);
                      }}
                      className="pick-card p-3 text-center text-[#3b2a63]"
                    >
                      <div className="text-4xl">{n.icon}</div>
                      <div className="font-bold">{n.label}</div>
                      <div className="text-sm font-medium opacity-75">{n.sub}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl bg-white/70 border-4 border-white p-3 text-center text-[#3b2a63]">
                  <div className="font-semibold">
                    Sunny hopes <strong>{target}</strong> friends visit during the {nap.label.toLowerCase()}!
                  </div>
                  <div className="mt-1 text-2xl tracking-wide">
                    {FRIENDS.slice(0, target).map((f) => f.icon).join(' ')}
                  </div>
                  <div className="mt-1 text-sm opacity-80">
                    {napKey === 'demo' ? '⚡ Judge Demo Mode: full steep runs in 10 seconds!' : 'Longer naps and yummier mixes bring more friends.'}
                  </div>
                </div>

                {/* TabPFN Alchemist Forecast Popup Trigger */}
                <div className="mt-3.5 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setShowCrystalModal(true);
                    }}
                    className="btn-chunky purple py-2 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 hover:scale-105"
                  >
                    <span className="text-lg">🔮</span>
                    <span>Peek at TabPFN Forecast</span>
                  </button>
                </div>
              </>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              {step > 1 ? (
                <button onClick={() => goStep(step - 1)} className="btn-chunky blue px-5 py-3 text-lg">
                  ← Back
                </button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <button onClick={() => goStep(step + 1)} className="btn-chunky green px-7 py-3 text-lg">
                  Next →
                </button>
              ) : (
                <button onClick={handleTuckIn} disabled={isStarting} className="btn-chunky yellow animate-glow px-6 py-4 text-xl">
                  🌙 Tuck Sunny in!
                </button>
              )}
            </div>
          </section>
        )}

        {/* Bedtime moment while the tea starts */}
        {tuck && (
          <section className="toy-card p-6 text-center">
            <div className="text-5xl animate-bounce-soft">{tuck === 'drink' ? '🍵' : '🌙'}</div>
            <h2 className="mt-2 text-2xl font-bold">{tuck === 'drink' ? 'Sunny is sipping tea...' : 'Sleepy time!'}</h2>
          </section>
        )}

        {/* ---------- BREWING: Sunny is asleep ---------- */}
        {isBrewing && !tuck && (
          <section className="toy-card p-4 sm:p-6 text-center">
            <ProgressRing progress={brewProgress} size={250}>
              <div className="text-sm font-semibold opacity-80">Sunny wakes up in</div>
              <div className="text-5xl font-bold tracking-wide">{formatTimer(remainingSeconds)}</div>
              <div className="text-sm font-semibold opacity-80">{Math.floor(brewProgress * 100)}% asleep 💤</div>
            </ProgressRing>

            {/* Judge Demo Fast-Forward Button */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleFastForward}
                disabled={isFastForwarding}
                className="btn-chunky yellow px-5 py-2.5 text-sm sm:text-base font-bold flex items-center gap-2 hover:scale-105"
                title="Fast-forwards sleep timer so judges can immediately test the morning surprise"
              >
                ⚡ {isFastForwarding ? 'Fast-Forwarding...' : 'Fast-Forward Steep (Judge Demo)'}
              </button>
            </div>

            {/* Bedtime Generative Sleep Soundscape Machine */}
            <div className="mt-4 rounded-2xl bg-indigo-900/40 border-2 border-indigo-300/40 p-3 text-center">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2 flex items-center justify-center gap-1.5">
                <span>✨</span>
                <span>Procedural Lofi Sleep Soundscape</span>
                <span>✨</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {[
                  { key: 'rain', label: '🌧️ Gentle Rain' },
                  { key: 'breeze', label: '🍃 Forest Breeze' },
                  { key: 'chimes', label: '🎶 Twilight Chimes' },
                  { key: 'off', label: '🔇 Off' },
                ].map((mode) => (
                  <button
                    key={mode.key}
                    onClick={() => {
                      sounds.playClick();
                      setSoundscape(mode.key as 'off' | 'rain' | 'breeze' | 'chimes');
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                      soundscape === mode.key
                        ? 'bg-sky-400 text-sky-950 shadow-md scale-105'
                        : 'bg-white/20 text-white/90 hover:bg-white/30'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="font-bold text-lg">
                Friends at the party: {served} of {brewTarget}
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {Array.from({ length: Math.max(brewTarget, arrivals.length) }, (_, i) => {
                  const f = friendFor(currentBrew?.brew_id ?? '', i + 1);
                  const here = i < served;
                  return (
                    <div
                      key={i}
                      className={`w-14 h-14 rounded-2xl border-4 flex items-center justify-center text-3xl ${
                        here ? 'bg-white border-pink-300 animate-pop' : 'border-dashed border-current/30 opacity-60'
                      }`}
                    >
                      {here ? f.icon : '?'}
                    </div>
                  );
                })}
              </div>
              <div className="h-7 mt-2 font-semibold text-pink-500">{friendNote}</div>
              {served >= brewTarget && brewTarget > 0 && <div className="font-bold text-emerald-500">All the friends came! 🎉</div>}
            </div>

            <div className="mt-4 rounded-2xl bg-white/20 border-4 border-white/60 p-4 text-lg font-semibold">
              🌙 Shhh... Sunny is sleeping. <br />
              Time for <u>you</u> to go to sleep too! <br />
              <span className="text-base font-medium opacity-90">Close the game now. Your tea will be ready when you come back.</span>
            </div>
          </section>
        )}

        {/* ---------- READY ---------- */}
        {isReady && !tuck && (
          <section className="toy-card p-6 text-center">
            <div className="text-6xl animate-bounce-soft">🎁</div>
            <h2 className="text-2xl font-bold mt-2">Sunny woke up!</h2>
            <p className="font-medium opacity-90 mb-4">
              {served} {served === 1 ? 'friend' : 'friends'} came to the party. Open your surprise!
            </p>
            <button onClick={handleClaim} disabled={isClaiming} className="btn-chunky yellow animate-glow px-8 py-4 text-xl">
              {isClaiming ? 'Opening...' : '🎁 Open the surprise!'}
            </button>
          </section>
        )}

        {/* Wishes */}
        <section className="toy-card px-4 py-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <span className="font-bold">Today&apos;s wishes:</span>
          {wishes.map((w) => (
            <span key={w.label} className={`font-semibold ${w.done ? 'text-emerald-500' : 'opacity-80'}`}>
              {w.done ? '⭐' : '☆'} {w.label}
            </span>
          ))}
        </section>

        <footer className="text-center text-sm font-semibold opacity-70 pb-4">
          Sunny the Sloth · Talking Pet & Mini-Games · slow and steady wins the nap 🦥
        </footer>
      </div>

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
                  className="inline-block rounded-3xl border-4 px-6 py-4 bg-white/80 text-[#3b2a63]"
                  style={{ borderColor: kid.color, boxShadow: `0 0 0 6px ${kid.color}55` }}
                >
                  <div className="text-5xl">{comboIcons(lootModal.ingredients) || '🍵'}</div>
                  <div className="text-xl font-bold mt-1">{kid.label} Tea</div>
                  <div className="text-2xl">{'⭐'.repeat(kid.stars)}</div>
                </div>

                {tgt > 0 && (
                  <div
                    className={`mt-4 rounded-2xl p-3 border-4 font-semibold ${
                      lootModal.quota_met ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-amber-100 border-amber-300 text-amber-800'
                    }`}
                  >
                    {lootModal.quota_met
                      ? `🎉 All ${tgt} friends came! +${bonusXp(served2, tgt)} bonus stars`
                      : `${served2} of ${tgt} friends came. A longer nap invites more friends!`}
                    {!lootModal.quota_met && lootModal.base_rarity && lootModal.base_rarity !== lootModal.rarity && (
                      <div className="text-sm font-medium">The tea is a little less sparkly this time, and that is okay!</div>
                    )}
                  </div>
                )}

                <div className="mt-4 rounded-2xl bg-white/80 border-4 border-pink-200 p-4 text-left text-[#3b2a63]">
                  <div className="font-bold mb-1">
                    {f.icon} A note from {f.name}:
                  </div>
                  <p className="text-lg font-medium leading-snug min-h-[3.5rem]">
                    <Typewriter key={note} text={note} />
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => speech.speak(note, { onStart: () => setTalking(true), onEnd: () => setTalking(false) })}
                    className="btn-chunky blue px-5 py-3 text-lg"
                  >
                    🔊 Hear it again
                  </button>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setShowAttributionModal(true);
                    }}
                    className="btn-chunky purple px-4 py-3 text-base flex items-center gap-1.5"
                  >
                    <span>🔬</span>
                    <span>AI Attribution</span>
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
        <Modal title="My sticker book 📖" onClose={() => setShowBook(false)} wide>
          {invCount === 0 ? (
            <p className="text-center text-lg font-medium py-8">
              No stickers yet! Make your first tea with Sunny to get one. 🦥
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[...(user?.inventory ?? [])].reverse().map((item, idx) => {
                const kid = rarityKid(item.rarity);
                return (
                  <button
                    key={`${item.item_name}-${idx}`}
                    onClick={() => {
                      sounds.playPop();
                      setSelectedSticker(item as Loot);
                    }}
                    className="rounded-3xl border-4 p-3 text-center bg-white/85 text-[#3b2a63] cursor-pointer hover:-rotate-1 transition"
                    style={{ borderColor: kid.color }}
                    aria-label={`${kid.label} tea. Tap to view TabPFN sensory profile.`}
                  >
                    <div className="text-4xl">{comboIcons(item.ingredients) || '🍵'}</div>
                    <div className="font-bold">{kid.label}</div>
                    <div>{'⭐'.repeat(kid.stars)}</div>
                    <div className="text-xs font-semibold opacity-70 mt-1">🔬 View AI Profile</div>
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
          <div className="space-y-4 text-base font-medium leading-relaxed">
            <div className="p-3 bg-amber-100 rounded-2xl border-2 border-amber-300 text-amber-950">
              <h3 className="font-bold text-lg flex items-center gap-1.5">
                <span>⚡</span>
                <span>Judge Demo Mode</span>
              </h3>
              <p className="text-sm mt-1">
                For quick hackathon evaluation: Select <strong>⚡ Judge Demo (10 seconds)</strong> in Step 3 when picking nap length, or tap the <strong>⚡ Fast-Forward</strong> button while Sunny sleeps to test the wake-up, animal friend arrivals, and AI prize loot in seconds!
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg">Talking Pet & Bedtime Game for Kids</h3>
              <p>
                Kids can care for Sunny just like Talking Tom: give Sunny a warm bubble bath, feed delicious snacks, play fun sensory mini-games (Bubble Pop, Forest Friends Match, Leaf Catcher), and talk with Sunny! When it is bedtime, kids tuck Sunny in with chamomile tea and go to sleep too.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg">Open-source AI, safe and free to run</h3>
              <ul className="list-disc pl-5">
                <li>Sunny&apos;s friends write notes with open-weight <strong>Gemma</strong>, running on this device or via Ollama.</li>
                <li>Prize rarity is predicted by open-source <strong>TabPFN</strong>, with a simple fallback when it is not installed.</li>
                <li>Sunny&apos;s voice uses your browser&apos;s built-in speech. Nothing is ever sent to third-party tracking services.</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-white/70 border-4 border-white p-4 text-[#3b2a63]">
              <h3 className="font-bold text-lg">🧠 Sunny&apos;s brain (In-Browser Gemma 2B, optional)</h3>
              <p className="text-sm">
                Download Gemma (about 320 MB, one time) to run client-side in the browser via transformers.js. It works offline and nothing ever leaves the device. If device memory is limited (e.g. mobile Safari / low-RAM), Sunny automatically uses the built-in procedural lore.
              </p>
              {brain.status === 'ready' || brainReady() ? (
                <div className="mt-2 font-bold text-emerald-600">✅ Sunny&apos;s brain is awake!</div>
              ) : (
                <>
                  <button onClick={enableBrain} disabled={brain.status === 'loading'} className="btn-chunky purple mt-3 px-5 py-3">
                    {brain.status === 'loading' ? `Downloading... ${brain.pct}%` : '⬇ Wake up Sunny’s brain'}
                  </button>
                  {brain.status === 'error' && (
                    <div className="mt-2 text-xs font-semibold text-amber-700 bg-amber-100 p-2 rounded-xl border border-amber-300">
                      ⚠️ Could not load in-browser weights (common on low-memory/mobile devices). Sunny will keep using the fast built-in procedural notes with zero lag!
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Developer & Judge Disclaimer: Local Ollama Gemma Setup */}
            <div className="rounded-2xl bg-indigo-950/80 border-2 border-indigo-400/40 p-4 text-indigo-100">
              <h3 className="font-bold text-base text-amber-200 flex items-center gap-1.5">
                <span>💻</span>
                <span>Developer & Judge Guide: Local Gemma via Ollama</span>
              </h3>
              <div className="text-xs mt-2 space-y-2 text-indigo-200/90 leading-relaxed">
                <p>
                  <strong>☁️ Render Free Tier Disclaimer:</strong> Render&apos;s free tier provides 512 MB RAM. This is perfect for the fast 3D graphics and procedural lore generator, but cannot host multi-gigabyte local LLM weights (Gemma / Llama) inside the container.
                </p>
                <p>
                  <strong>✨ Zero-Crash Procedural Fallback:</strong> If no Ollama daemon is detected, the app automatically switches to the built-in procedural lore writer with 0 latency and 0 errors.
                </p>
                <div className="bg-black/50 rounded-xl p-3 font-mono text-[11px] text-amber-300 space-y-1 overflow-x-auto">
                  <div className="text-indigo-300 font-sans font-bold text-xs">🚀 How to test with your local Ollama Gemma:</div>
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
              <button onClick={() => setVoiceOn((v) => !v)} className="btn-chunky green px-4 py-2">
                {voiceOn ? '🔊 Voice on' : '🔇 Voice off'}
              </button>
              <button onClick={() => setSfxOn((v) => !v)} className="btn-chunky blue px-4 py-2">
                {sfxOn ? '🎵 Sounds on' : '🔕 Sounds off'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ---------- 3D DIORAMA THEME SELECTION MODAL ---------- */}
      {showThemeModal && (
        <Modal title="🎨 Choose 3D Diorama Theme" onClose={() => setShowThemeModal(false)}>
          <div className="space-y-3.5">
            <p className="text-xs sm:text-sm text-[#3b2a63] font-medium leading-relaxed text-center">
              Transform Sunny&apos;s tea party nook with seasonal lanterns, glowing embers, kettle styles, and atmospheric lighting!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.values(DIORAMA_THEMES) as Array<typeof DIORAMA_THEMES[keyof typeof DIORAMA_THEMES]>).map((th) => {
                const isSelected = dioramaTheme === th.id;
                return (
                  <button
                    key={th.id}
                    onClick={() => {
                      sounds.playClick();
                      setDioramaTheme(th.id);
                      try {
                        localStorage.setItem('midnight_theme', th.id);
                      } catch {}
                      say(`Welcome to the ${th.name}! ${th.icon}`);
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-purple-600/25 border-purple-500 ring-2 ring-purple-300 scale-[1.02]'
                        : 'bg-white/70 border-indigo-200 hover:border-indigo-400 hover:bg-white/90'
                    }`}
                  >
                    <span className="text-3xl">{th.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm sm:text-base text-[#3b2a63] flex items-center justify-between">
                        <span>{th.name}</span>
                        {isSelected && (
                          <span className="text-[11px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full shadow-sm">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#3b2a63]/80 mt-0.5 leading-snug line-clamp-2">
                        {th.description}
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
            <p className="text-xs sm:text-sm text-[#3b2a63] font-medium leading-relaxed">
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
            <p className="text-xs sm:text-sm text-[#3b2a63] font-medium leading-relaxed">
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
            <div className="text-center p-3 bg-white/80 rounded-2xl border-2 border-indigo-200">
              <div className="text-4xl">{comboIcons(selectedSticker.ingredients) || '🍵'}</div>
              <div className="text-base font-bold mt-1 text-[#3b2a63]">{selectedSticker.item_name}</div>
              <div className="text-xs font-semibold opacity-80 mt-0.5 italic">&ldquo;{selectedSticker.review}&rdquo;</div>
            </div>
            <TabPFNAttributionCard loot={selectedSticker} defaultExpanded={true} />
          </div>
        </Modal>
      )}

      {/* ---------- TITLE SCREEN ---------- */}
      {!started && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center text-center px-5 bg-gradient-to-b from-pink-200 via-purple-200 to-sky-200">
          <div className="text-8xl animate-bounce-soft drop-shadow-lg">🦥</div>
          <h1 className="mt-4 text-4xl sm:text-6xl font-bold bg-gradient-to-r from-pink-500 via-amber-400 to-sky-500 bg-clip-text text-transparent">
            The Midnight Steeper
          </h1>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#6c4fd1]">Sunny the Talking Sloth</p>
          <p className="mt-3 text-xl font-semibold text-[#3b2a63]">Take bubble baths, play mini-games, and make bedtime tea! 🛁🎮🌙</p>
          <button onClick={handleStart} className="btn-chunky green animate-glow mt-10 px-12 py-5 text-3xl">
            ▶ Play!
          </button>
          <p className="mt-6 text-sm font-semibold text-[#3b2a63]/70">No ads · No accounts · 100% Kid Safe</p>
        </div>
      )}
    </main>
  );
}
