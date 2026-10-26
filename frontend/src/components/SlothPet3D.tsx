'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

export type PetMood = 'idle' | 'talking' | 'sleeping' | 'happy' | 'eating' | 'bathing' | 'playing';

export type DioramaTheme = 'classic' | 'sakura' | 'celestial' | 'autumn' | 'onsen';

export interface ThemeConfig {
  id: DioramaTheme;
  name: string;
  icon: string;
  description: string;
  lanternPaper: string;
  lanternEmissive: string;
  lanternLight: string;
  kettle: string;
  coal: string;
  coalEmissive: string;
  stone: string;
  branch: string;
  leaves: string;
  terracotta: string;
  petals: string;
  deckBark: string;
  deckTop: string;
  keyLight: string;
  fillLight: string;
  rimLight: string;
  sparkleColor: string;
}

export const DIORAMA_THEMES: Record<DioramaTheme, ThemeConfig> = {
  classic: {
    id: 'classic',
    name: 'Midnight Tea House',
    icon: '🏮',
    description: 'Traditional cast-iron kettle, warm paper lantern, glowing hearth coals & chamomile aroma',
    lanternPaper: '#fffbeb',
    lanternEmissive: '#fef08a',
    lanternLight: '#fef08a',
    kettle: '#232126',
    coal: '#ea580c',
    coalEmissive: '#f97316',
    stone: '#475569',
    branch: '#5c3d28',
    leaves: '#4ade80',
    terracotta: '#c2410c',
    petals: '#fde047',
    deckBark: '#452b1b',
    deckTop: '#8a6547',
    keyLight: '#fff7ed',
    fillLight: '#c7d2fe',
    rimLight: '#fef08a',
    sparkleColor: '#fef08a',
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura Garden',
    icon: '🌸',
    description: 'Drifting cherry blossoms, rosy kettle, soft pink lantern glow & fresh jade tea leaves',
    lanternPaper: '#ffe4e6',
    lanternEmissive: '#fda4af',
    lanternLight: '#f43f5e',
    kettle: '#831843',
    coal: '#f43f5e',
    coalEmissive: '#fb7185',
    stone: '#64748b',
    branch: '#4c2e35',
    leaves: '#86efac',
    terracotta: '#e11d48',
    petals: '#fda4af',
    deckBark: '#3d2330',
    deckTop: '#b58498',
    keyLight: '#fff1f2',
    fillLight: '#fbcfe8',
    rimLight: '#f472b6',
    sparkleColor: '#f472b6',
  },
  celestial: {
    id: 'celestial',
    name: 'Celestial Starlight',
    icon: '✨',
    description: 'Cosmic indigo night, silver lunar kettle, glowing cyan lantern & shimmering star shards',
    lanternPaper: '#cffafe',
    lanternEmissive: '#38bdf8',
    lanternLight: '#0ea5e9',
    kettle: '#334155',
    coal: '#0284c7',
    coalEmissive: '#38bdf8',
    stone: '#1e293b',
    branch: '#1e1e38',
    leaves: '#7dd3fc',
    terracotta: '#1e3a8a',
    petals: '#67e8f9',
    deckBark: '#15192c',
    deckTop: '#57658c',
    keyLight: '#e0f2fe',
    fillLight: '#818cf8',
    rimLight: '#38bdf8',
    sparkleColor: '#38bdf8',
  },
  autumn: {
    id: 'autumn',
    name: 'Autumn Fireside',
    icon: '🍂',
    description: 'Crisp fallen maple leaves, copper kettle, toasted firewood embers & harvest spices',
    lanternPaper: '#fef3c7',
    lanternEmissive: '#f59e0b',
    lanternLight: '#d97706',
    kettle: '#78350f',
    coal: '#b45309',
    coalEmissive: '#f59e0b',
    stone: '#57534e',
    branch: '#3f1b0a',
    leaves: '#ea580c',
    terracotta: '#9a3412',
    petals: '#f97316',
    deckBark: '#381c0f',
    deckTop: '#99613e',
    keyLight: '#ffedd5',
    fillLight: '#fed7aa',
    rimLight: '#fbbf24',
    sparkleColor: '#f59e0b',
  },
  onsen: {
    id: 'onsen',
    name: 'Zen Mineral Onsen',
    icon: '🫧',
    description: 'Misty hot spring steam, river jade kettle, bamboo green leaves & soothing mineral waters',
    lanternPaper: '#ccfbf1',
    lanternEmissive: '#14b8a6',
    lanternLight: '#0d9488',
    kettle: '#134e4a',
    coal: '#0f766e',
    coalEmissive: '#2dd4bf',
    stone: '#334155',
    branch: '#1c342c',
    leaves: '#34d399',
    terracotta: '#115e59',
    petals: '#5eead4',
    deckBark: '#1a2923',
    deckTop: '#5c8776',
    keyLight: '#f0fdfa',
    fillLight: '#a7f3d0',
    rimLight: '#2dd4bf',
    sparkleColor: '#2dd4bf',
  },
};

interface SlothPet3DProps {
  mood: PetMood;
  /** Fur color (follows the leaf the child picks) */
  furColor: string;
  /** Accent color for the cap, blanket, rug and tea (follows the treat) */
  accentColor: string;
  /** Increment to trigger a poke reaction */
  pokeCount: number;
  onPoke: () => void;
  starlightGlow?: number;
  theme?: DioramaTheme;
}

const damp = THREE.MathUtils.damp;

const FIREFLIES_CONFIG = [
  { base: [1.3, -0.5, 0.8], speed: 0.9, phase: 0.0 },
  { base: [-1.4, -0.6, 0.8], speed: 1.1, phase: 1.5 },
  { base: [1.7, 0.3, 0.5], speed: 0.75, phase: 2.8 },
  { base: [-1.1, 0.8, -0.2], speed: 1.25, phase: 4.1 },
  { base: [0.5, 1.8, 0.4], speed: 0.85, phase: 5.2 },
  { base: [-0.7, 1.6, 0.6], speed: 1.05, phase: 3.4 },
  { base: [0.0, -0.8, 1.2], speed: 0.7, phase: 2.1 },
];

function Pet({ mood, furColor, accentColor, pokeCount, onPoke, starlightGlow, theme = 'classic' }: SlothPet3DProps) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Mesh>(null);
  const eyeL = useRef<THREE.Group>(null);
  const eyeR = useRef<THREE.Group>(null);
  const pupilL = useRef<THREE.Group>(null);
  const pupilR = useRef<THREE.Group>(null);
  const smile = useRef<THREE.Mesh>(null);
  const openMouth = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const cup = useRef<THREE.Group>(null);
  const cap = useRef<THREE.Group>(null);
  const showerCap = useRef<THREE.Group>(null);
  const tub = useRef<THREE.Group>(null);
  const duck = useRef<THREE.Group>(null);
  const blanket = useRef<THREE.Group>(null);
  const pillow = useRef<THREE.Mesh>(null);
  const moon = useRef<THREE.Group>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const platform = useRef<THREE.Group>(null);
  const branchGroup = useRef<THREE.Group>(null);

  // Lights for dynamic diorama themes
  const keyLight = useRef<THREE.DirectionalLight>(null);
  const fillLight = useRef<THREE.DirectionalLight>(null);
  const rimLight = useRef<THREE.DirectionalLight>(null);
  const lanternLight = useRef<THREE.PointLight>(null);

  // Props
  const kettle = useRef<THREE.Group>(null);
  const lantern = useRef<THREE.Group>(null);
  const sprout = useRef<THREE.Group>(null);
  const steamPuffsKettle = useRef<(THREE.Mesh | null)[]>([]);
  const steamPuffsCup = useRef<(THREE.Mesh | null)[]>([]);

  // Springs
  const earL = useRef<THREE.Group>(null);
  const earR = useRef<THREE.Group>(null);
  const pompom = useRef<THREE.Group>(null);
  const earSpringL = useRef({ pos: 0, vel: 0 });
  const earSpringR = useRef({ pos: 0, vel: 0 });
  const pompomSpring = useRef({ pos: 0, vel: 0 });

  // Yawn & Idle Cycle
  const nextYawnTime = useRef(18);
  const yawnActive = useRef(false);
  const yawnProgress = useRef(0);

  // Camera State
  const camLookAtY = useRef(0.95);

  // Bath Ripples & Fireflies
  const bathRipples = useRef<(THREE.Mesh | null)[]>([]);
  const fireflyRefs = useRef<(THREE.Group | null)[]>([]);
  const fireflyScatter = useRef<{ x: number; y: number }[]>(
    FIREFLIES_CONFIG.map(() => ({ x: 0, y: 0 }))
  );

  const lastPoke = useRef(pokeCount);
  const squash = useRef(0);
  const nextBlink = useRef(2);
  const blinkUntil = useRef(0);

  // Materials with Velvet Sheen
  const mats = useMemo(
    () => ({
      fur: new THREE.MeshPhysicalMaterial({
        roughness: 0.82,
        metalness: 0.02,
        sheen: 0.95,
        sheenRoughness: 0.45,
        sheenColor: new THREE.Color('#fde047'),
      }),
      belly: new THREE.MeshPhysicalMaterial({
        color: '#fffbeb',
        roughness: 0.88,
        metalness: 0.0,
        sheen: 0.65,
        sheenRoughness: 0.5,
        sheenColor: new THREE.Color('#ffffff'),
      }),
      eyeBand: new THREE.MeshStandardMaterial({
        color: '#2b1810',
        roughness: 0.75,
      }),
      accent: new THREE.MeshPhysicalMaterial({
        roughness: 0.52,
        sheen: 0.9,
        sheenRoughness: 0.35,
        sheenColor: new THREE.Color('#ffffff'),
        emissiveIntensity: 0.2,
      }),
      white: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2, metalness: 0.05 }),
      ceramic: new THREE.MeshStandardMaterial({ color: '#fdfbf7', roughness: 0.15, metalness: 0.08 }),
      dark: new THREE.MeshStandardMaterial({ color: '#1e1424', roughness: 0.45 }),
      nose: new THREE.MeshStandardMaterial({ color: '#180e20', roughness: 0.5 }),
      pink: new THREE.MeshStandardMaterial({ color: '#fca5a5', roughness: 0.85 }),
      tongue: new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.6 }),
      claw: new THREE.MeshStandardMaterial({ color: '#fef9e7', roughness: 0.35, metalness: 0.08 }),
      pawPad: new THREE.MeshStandardMaterial({ color: '#231626', roughness: 0.85 }),
      gold: new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.28, metalness: 0.85 }),
      deckBark: new THREE.MeshStandardMaterial({ color: '#452b1b', roughness: 0.95 }),
      deckTop: new THREE.MeshStandardMaterial({ color: '#8a6547', roughness: 0.85 }),
      stone: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9 }),
      mouth: new THREE.MeshStandardMaterial({ color: '#581c87', roughness: 0.6 }),
      moon: new THREE.MeshStandardMaterial({ color: '#fffbeb', emissive: '#fef08a', emissiveIntensity: 1.1 }),
      water: new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        roughness: 0.05,
        transparent: true,
        opacity: 0.82,
        emissive: '#0284c7',
        emissiveIntensity: 0.2,
      }),
      duck: new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.35 }),
      orange: new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.4 }),
      bubbleWhite: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 0.1,
        transparent: true,
        opacity: 0.88,
      }),
      showerCapMat: new THREE.MeshStandardMaterial({
        color: '#7dd3fc',
        roughness: 0.35,
        emissive: '#0ea5e9',
        emissiveIntensity: 0.15,
      }),
      iron: new THREE.MeshStandardMaterial({ color: '#232126', roughness: 0.65, metalness: 0.75 }),
      coal: new THREE.MeshStandardMaterial({ color: '#ea580c', emissive: '#f97316', emissiveIntensity: 1.6 }),
      lanternPaper: new THREE.MeshStandardMaterial({
        color: '#fffbeb',
        emissive: '#fef08a',
        emissiveIntensity: 0.85,
        roughness: 0.6,
      }),
      lanternWood: new THREE.MeshStandardMaterial({ color: '#382216', roughness: 0.6 }),
      branch: new THREE.MeshStandardMaterial({ color: '#5c3d28', roughness: 0.95 }),
      leafGreen: new THREE.MeshStandardMaterial({ color: '#4ade80', roughness: 0.55 }),
      terracotta: new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.85 }),
      petalMat: new THREE.MeshStandardMaterial({ color: '#fde047', roughness: 0.75 }),
      steam: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.35,
        roughness: 0.2,
      }),
      rippleMat: new THREE.MeshBasicMaterial({
        color: '#bae6fd',
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      }),
      fireflyMat: new THREE.MeshBasicMaterial({
        color: '#fef08a',
      }),
    }),
    []
  );

  const furTarget = useMemo(() => new THREE.Color(furColor), [furColor]);
  const accentTarget = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  const tmp = useMemo(() => new THREE.Color(), []);

  const stepSpring = (spring: { pos: number; vel: number }, target: number, stiffness: number, dampingFactor: number, dt: number) => {
    const force = -stiffness * (spring.pos - target) - dampingFactor * spring.vel;
    spring.vel += force * dt;
    spring.pos += spring.vel * dt;
    return spring.pos;
  };

  useFrame(({ camera, clock, pointer }, dt) => {
    const t = clock.elapsedTime;
    const sleeping = mood === 'sleeping';
    const happy = mood === 'happy';
    const talking = mood === 'talking';
    const eating = mood === 'eating';
    const bathing = mood === 'bathing';
    const playing = mood === 'playing';
    const idle = mood === 'idle';

    // Update Theme Colors smoothly
    const activeTheme = DIORAMA_THEMES[theme] || DIORAMA_THEMES.classic;

    mats.lanternPaper.color.lerp(tmp.set(activeTheme.lanternPaper), 0.08);
    mats.lanternPaper.emissive.lerp(tmp.set(activeTheme.lanternEmissive), 0.08);
    mats.iron.color.lerp(tmp.set(activeTheme.kettle), 0.08);
    mats.coal.color.lerp(tmp.set(activeTheme.coal), 0.08);
    mats.coal.emissive.lerp(tmp.set(activeTheme.coalEmissive), 0.08);
    mats.stone.color.lerp(tmp.set(activeTheme.stone), 0.08);
    mats.branch.color.lerp(tmp.set(activeTheme.branch), 0.08);
    mats.leafGreen.color.lerp(tmp.set(activeTheme.leaves), 0.08);
    mats.terracotta.color.lerp(tmp.set(activeTheme.terracotta), 0.08);
    mats.petalMat.color.lerp(tmp.set(activeTheme.petals), 0.08);
    mats.deckBark.color.lerp(tmp.set(activeTheme.deckBark), 0.08);
    mats.deckTop.color.lerp(tmp.set(activeTheme.deckTop), 0.08);

    if (lanternLight.current) lanternLight.current.color.lerp(tmp.set(activeTheme.lanternLight), 0.08);
    if (keyLight.current) keyLight.current.color.lerp(tmp.set(activeTheme.keyLight), 0.08);
    if (fillLight.current) fillLight.current.color.lerp(tmp.set(activeTheme.fillLight), 0.08);
    if (rimLight.current) rimLight.current.color.lerp(tmp.set(activeTheme.rimLight), 0.08);

    // Sloth Fur & Accent Colors
    mats.fur.color.lerp(furTarget, 0.1);
    mats.fur.sheenColor.copy(mats.fur.color).lerp(tmp.set('#ffffff'), 0.35);
    mats.belly.color.copy(mats.fur.color).lerp(tmp.set('#fffbeb'), 0.72);
    mats.accent.color.lerp(accentTarget, 0.1);
    mats.accent.emissive.copy(mats.accent.color);
    mats.accent.sheenColor.copy(mats.accent.color).lerp(tmp.set('#ffffff'), 0.4);

    // Shadowbox Parallax & Bedtime Zoom
    const targetCamX = sleeping ? pointer.x * 0.25 : pointer.x * 0.45;
    const targetCamY = sleeping ? 1.05 + pointer.y * 0.15 : 1.35 + pointer.y * 0.25;
    const targetCamZ = sleeping ? 8.1 : 9.2;
    const targetLookY = sleeping ? 0.75 : 0.95;

    camera.position.x = damp(camera.position.x, targetCamX, 4, dt);
    camera.position.y = damp(camera.position.y, targetCamY, 4, dt);
    camera.position.z = damp(camera.position.z, targetCamZ, 3, dt);

    camLookAtY.current = damp(camLookAtY.current, targetLookY, 4, dt);
    camera.lookAt(0, camLookAtY.current, 0);

    // Poke reaction
    if (pokeCount !== lastPoke.current) {
      lastPoke.current = pokeCount;
      squash.current = 1;
      pompomSpring.current.vel += 9.5;
      earSpringL.current.vel += 6.5;
      earSpringR.current.vel -= 6.5;
      yawnActive.current = false;
    }
    squash.current = Math.max(0, squash.current - dt * 1.8);
    const s = squash.current;
    const wobble = Math.sin((1 - s) * 16) * s;

    // Sloth Yawn Cycle
    if (idle) {
      if (!yawnActive.current && t > nextYawnTime.current) {
        yawnActive.current = true;
        yawnProgress.current = 0;
      }
    } else {
      yawnActive.current = false;
      nextYawnTime.current = t + 22 + ((Math.sin(t * 5) + 1) / 2) * 8;
    }

    let yawnArmL = 0;
    let yawnArmR = 0;
    let yawnHeadPitch = 0;
    let yawnMouth = 0;
    let yawnSquint = 0;

    if (yawnActive.current) {
      yawnProgress.current += dt / 4.6;
      const yp = yawnProgress.current;

      if (yp < 0.35) {
        const k = Math.sin((yp / 0.35) * (Math.PI / 2));
        yawnArmL = k * -2.1;
        yawnArmR = k * 2.1;
        yawnHeadPitch = k * -0.22;
        yawnMouth = k * 0.85;
        yawnSquint = k;
      } else if (yp < 0.7) {
        const tremor = Math.sin(t * 24) * 0.025;
        yawnArmL = -2.1 + tremor;
        yawnArmR = 2.1 - tremor;
        yawnHeadPitch = -0.22;
        yawnMouth = 0.85;
        yawnSquint = 1;
      } else if (yp < 1.0) {
        const k = 1 - Math.sin(((yp - 0.7) / 0.3) * (Math.PI / 2));
        yawnArmL = k * -2.1;
        yawnArmR = k * 2.1;
        yawnHeadPitch = k * -0.22;
        yawnMouth = k * 0.85;
        yawnSquint = k * 0.7;
      } else {
        yawnActive.current = false;
        nextYawnTime.current = t + 24 + ((Math.cos(t * 7) + 1) / 2) * 12;
      }
    }

    // Root movement
    if (root.current) {
      const hop = happy || playing ? Math.abs(Math.sin(t * (playing ? 4.5 : 3.2))) * 0.22 : 0;
      const bathBob = bathing ? Math.sin(t * 2.2) * 0.05 - 0.28 : 0;
      const baseY = -0.72;
      root.current.position.y = damp(root.current.position.y, baseY + (sleeping ? -0.15 : 0) + hop + bathBob + s * 0.08, 8, dt);
      root.current.scale.set(1 - wobble * 0.06, 1 + wobble * 0.12, 1 - wobble * 0.06);
      root.current.rotation.z = damp(
        root.current.rotation.z,
        sleeping ? 0.06 : playing ? Math.sin(t * 3.5) * 0.06 : Math.sin(t * 1.2) * 0.012,
        4,
        dt
      );
    }

    // Breathing rhythm
    if (body.current) {
      const breath = Math.sin(t * (sleeping ? 1.0 : 1.8)) * 0.02;
      body.current.scale.set(1 + breath, 1.02 + breath * 1.1, 0.98 + breath);
    }

    // Head tracking with anatomical neck stability
    if (head.current) {
      head.current.rotation.y = damp(
        head.current.rotation.y,
        sleeping ? 0 : bathing ? Math.sin(t * 1.4) * 0.1 : pointer.x * 0.3,
        5,
        dt
      );
      const baseHeadX = sleeping ? 0.22 : bathing ? -0.06 : -pointer.y * 0.15;
      head.current.rotation.x = damp(head.current.rotation.x, baseHeadX + yawnHeadPitch, 5, dt);
      head.current.position.y = 1.28 + Math.sin(t * 1.8) * 0.01;
    }

    if (neck.current) {
      neck.current.rotation.y = damp(neck.current.rotation.y, head.current ? head.current.rotation.y * 0.5 : 0, 5, dt);
      neck.current.rotation.x = damp(neck.current.rotation.x, head.current ? head.current.rotation.x * 0.4 : 0, 5, dt);
    }

    // Ear & Pompom Spring Physics
    const headRotY = head.current ? head.current.rotation.y : 0;
    const earTarget = headRotY * 0.25;
    const earJiggleL = stepSpring(earSpringL.current, earTarget, 75, 7.5, dt);
    const earJiggleR = stepSpring(earSpringR.current, -earTarget, 75, 7.5, dt);

    if (earL.current) {
      earL.current.rotation.z = earJiggleL * 0.3;
      earL.current.rotation.y = -0.3 + earJiggleL * 0.2;
    }
    if (earR.current) {
      earR.current.rotation.z = earJiggleR * 0.3;
      earR.current.rotation.y = 0.3 + earJiggleR * 0.2;
    }

    const pompomOffset = stepSpring(pompomSpring.current, 0, 50, 5.5, dt);
    if (pompom.current) {
      pompom.current.position.x = 0.14 + pompomOffset * 0.03;
      pompom.current.position.y = 0.62 + Math.sin(t * 2.5) * 0.02 + Math.abs(pompomOffset) * 0.02;
      pompom.current.rotation.z = pompomOffset * 0.28;
    }

    // Blinking
    if (t > nextBlink.current) {
      blinkUntil.current = t + 0.15;
      nextBlink.current = t + 2.5 + ((Math.sin(t * 13) + 1) / 2) * 3.0;
    }
    const closed = sleeping || (bathing && Math.sin(t * 1.4) > 0.4) ? 1 : t < blinkUntil.current ? 1 : yawnSquint > 0.35 ? 1 : 0;
    [eyeL, eyeR].forEach((e) => {
      if (e.current) e.current.scale.y = damp(e.current.scale.y, 1 - 0.94 * closed, 30, dt);
    });
    [pupilL, pupilR].forEach((p) => {
      if (p.current) {
        p.current.position.x = damp(p.current.position.x, pointer.x * 0.025, 8, dt);
        p.current.position.y = damp(p.current.position.y, pointer.y * 0.02, 8, dt);
      }
    });

    // Mouth animation
    const open = talking
      ? 0.35 + 0.65 * Math.abs(Math.sin(t * 16))
      : eating
      ? 0.5
      : happy || playing
      ? 0.4
      : bathing
      ? 0.2
      : yawnActive.current
      ? yawnMouth
      : 0;
    if (smile.current) smile.current.visible = open < 0.1;
    if (openMouth.current) {
      openMouth.current.visible = open >= 0.1;
      openMouth.current.scale.set(1, 0.4 + open * 0.8, 1);
    }

    // Curved Sloth Arms
    if (armL.current) {
      const targetL = playing
        ? -1.9 + Math.sin(t * 6) * 0.22
        : bathing
        ? -0.55 + Math.sin(t * 3.2) * 0.12
        : talking
        ? -0.75 + Math.sin(t * 6) * 0.18
        : yawnActive.current
        ? yawnArmL
        : -0.32;
      armL.current.rotation.z = damp(armL.current.rotation.z, targetL, 6, dt);
    }
    if (armR.current) {
      const targetR = playing
        ? 1.9 - Math.cos(t * 6) * 0.22
        : bathing
        ? 0.55 - Math.cos(t * 3.2) * 0.12
        : happy
        ? 2.0 + Math.sin(t * 8) * 0.25
        : eating
        ? 1.55
        : talking
        ? 0.75 - Math.sin(t * 5) * 0.18
        : yawnActive.current
        ? yawnArmR
        : 0.32;
      armR.current.rotation.z = damp(armR.current.rotation.z, targetR, 6, dt);
    }

    // Props Transitions
    const popTo = (obj: THREE.Object3D | null, on: boolean) => {
      if (!obj) return;
      const v = damp(obj.scale.x, on ? 1 : 0, 7, dt);
      obj.scale.setScalar(v);
      obj.visible = v > 0.02;
    };
    popTo(cap.current, sleeping);
    popTo(blanket.current, sleeping);
    popTo(pillow.current, sleeping);
    popTo(moon.current, sleeping);
    popTo(cup.current, eating);
    popTo(showerCap.current, bathing);
    popTo(tub.current, bathing);
    popTo(duck.current, bathing);
    popTo(platform.current, !bathing);
    popTo(branchGroup.current, !bathing);

    if (cup.current) cup.current.position.y = 0.85 + Math.sin(t * 3) * 0.05;
    if (duck.current) {
      duck.current.position.y = -0.48 + Math.sin(t * 3.2) * 0.04;
      duck.current.rotation.y = Math.sin(t * 1.8) * 0.2;
    }

    if (lantern.current) {
      lantern.current.rotation.z = Math.sin(t * 1.4) * 0.04;
      lantern.current.rotation.x = Math.cos(t * 1.0) * 0.03;
    }

    // Steam
    steamPuffsKettle.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const offset = idx * 0.25;
      const progress = ((t * 0.45 + offset) % 1.0);
      mesh.position.y = 0.32 + progress * 0.65;
      mesh.position.x = 0.24 + Math.sin(t * 2.2 + idx * 1.4) * 0.05 * (1 + progress);
      mesh.position.z = Math.cos(t * 1.8 + idx) * 0.035;
      const sc = 0.04 + progress * 0.12;
      mesh.scale.set(sc, sc, sc);
      mesh.visible = !bathing;
    });

    steamPuffsCup.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const offset = idx * 0.33;
      const progress = ((t * 0.5 + offset) % 1.0);
      mesh.position.y = 0.16 + progress * 0.55;
      mesh.position.x = Math.sin(t * 2.5 + idx * 1.8) * 0.04 * (1 + progress);
      mesh.position.z = Math.cos(t * 2.0 + idx) * 0.025;
      const sc = 0.03 + progress * 0.1;
      mesh.scale.set(sc, sc, sc);
      mesh.visible = eating;
    });

    // Bath Ripples
    bathRipples.current.forEach((mesh, idx) => {
      if (!mesh) return;
      if (!bathing) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      const offset = idx * 0.33;
      const prog = (t * 0.55 + offset) % 1.0;
      const sc = 0.2 + prog * 2.2;
      mesh.scale.set(sc, sc, sc);
      const alpha = Math.sin(prog * Math.PI) * 0.45;
      if (mesh.material && 'opacity' in mesh.material) {
        (mesh.material as THREE.Material & { opacity: number }).opacity = alpha;
      }
    });

    // Fireflies
    const scenePointerX = pointer.x * 2.4;
    const scenePointerY = pointer.y * 1.6;

    fireflyRefs.current.forEach((group, idx) => {
      if (!group) return;
      const cfg = FIREFLIES_CONFIG[idx];
      const scatter = fireflyScatter.current[idx];

      const orbitX = cfg.base[0] + Math.sin(t * cfg.speed + cfg.phase) * 0.4;
      const orbitY = cfg.base[1] + Math.cos(t * cfg.speed * 1.25 + cfg.phase) * 0.3;
      const orbitZ = cfg.base[2] + Math.sin(t * cfg.speed * 0.75 + cfg.phase) * 0.35;

      const dx = orbitX - scenePointerX;
      const dy = orbitY - scenePointerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1.1) {
        const repelForce = (1.1 - dist) * 1.4;
        scatter.x = damp(scatter.x, (dx / (dist + 0.001)) * repelForce, 5, dt);
        scatter.y = damp(scatter.y, (dy / (dist + 0.001)) * repelForce, 5, dt);
      } else {
        scatter.x = damp(scatter.x, 0, 2.5, dt);
        scatter.y = damp(scatter.y, 0, 2.5, dt);
      }

      group.position.set(orbitX + scatter.x, orbitY + scatter.y, orbitZ);
      const pulse = 0.035 + (Math.sin(t * 3.5 + cfg.phase) * 0.5 + 0.5) * 0.02;
      group.scale.set(pulse, pulse, pulse);
    });

    if (ambient.current) ambient.current.intensity = damp(ambient.current.intensity, sleeping ? 0.6 : 1.1, 3, dt);
  });

  const activeTheme = DIORAMA_THEMES[theme] || DIORAMA_THEMES.classic;

  return (
    <>
      {/* Pixar-style Studio 3-Point Lighting */}
      <ambientLight ref={ambient} intensity={1.1} />
      <directionalLight ref={keyLight} position={[4, 6, 5]} intensity={1.5} color={activeTheme.keyLight} />
      <directionalLight ref={fillLight} position={[-4, 3, 3]} intensity={0.7} color={activeTheme.fillLight} />
      <directionalLight ref={rimLight} position={[0, 4, -5]} intensity={1.8} color={activeTheme.rimLight} />

      {/* Ground Contact Shadow */}
      <ContactShadows position={[0, -1.68, 0]} opacity={0.5} scale={7.5} blur={2.2} far={4} />

      {/* Unified Diorama Platform: Tea Deck, Stove Hearth, and Herb Stand */}
      <group ref={platform} position={[0, -1.6, 0]}>
        {/* Main Circular Wooden Deck Base */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[2.55, 2.7, 0.28, 48]} />
          <primitive object={mats.deckBark} attach="material" />
        </mesh>
        <mesh position={[0, 0.23, 0]}>
          <cylinderGeometry args={[2.53, 2.53, 0.02, 48]} />
          <primitive object={mats.deckTop} attach="material" />
        </mesh>

        {/* Sunny's Central Log Stool */}
        <group position={[0, 0.24, 0]}>
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[1.35, 1.48, 0.44, 36]} />
            <primitive object={mats.deckBark} attach="material" />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[1.34, 1.34, 0.02, 36]} />
            <primitive object={mats.deckTop} attach="material" />
          </mesh>
          {/* Woven Cushion Ring */}
          <mesh position={[0, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.07, 12, 36]} />
            <primitive object={mats.accent} attach="material" />
          </mesh>
          {/* Scattered Botanical Tea Petals */}
          {[
            [0.72, 0.47, 0.5, 0.2],
            [-0.6, 0.47, 0.65, -0.4],
            [0.85, 0.47, -0.35, 0.8],
            [-0.75, 0.47, -0.4, 1.2],
          ].map(([px, py, pz, pr], idx) => (
            <mesh key={idx} position={[px, py, pz]} rotation={[0, pr, 0]} scale={[1, 0.2, 1.4]}>
              <sphereGeometry args={[0.055, 10, 10]} />
              <primitive object={mats.petalMat} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Right Side Stove Hearth: Slate Trivet & Japanese Tetsubin Kettle */}
        <group ref={kettle} position={[1.72, 0.24, 0.2]}>
          {/* Chiseled Stone Trivet Base (Firmly Grounded on Deck) */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.45, 0.5, 0.12, 24]} />
            <primitive object={mats.stone} attach="material" />
          </mesh>
          {/* Glowing Charcoal Fire Embers */}
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.36, 0.36, 0.03, 20]} />
            <primitive object={mats.coal} attach="material" />
          </mesh>
          {/* Cast-Iron Kettle Body */}
          <mesh position={[0, 0.36, 0]} scale={[1, 0.8, 1]}>
            <sphereGeometry args={[0.27, 24, 24]} />
            <primitive object={mats.iron} attach="material" />
          </mesh>
          {/* Kettle Lid & Gold Knob */}
          <mesh position={[0, 0.56, 0]}>
            <cylinderGeometry args={[0.14, 0.16, 0.04, 20]} />
            <primitive object={mats.iron} attach="material" />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <primitive object={mats.gold} attach="material" />
          </mesh>
          {/* Curved Pour Spout */}
          <mesh position={[0.25, 0.42, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <cylinderGeometry args={[0.035, 0.05, 0.2, 14]} />
            <primitive object={mats.iron} attach="material" />
          </mesh>
          {/* Overhead Arched Iron Handle */}
          <mesh position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.02, 10, 24, Math.PI]} />
            <primitive object={mats.iron} attach="material" />
          </mesh>

          {/* Steam from Kettle */}
          {[0, 1, 2, 3].map((idx) => (
            <mesh
              key={idx}
              ref={(el) => {
                steamPuffsKettle.current[idx] = el;
              }}
              position={[0.32, 0.52, 0]}
            >
              <sphereGeometry args={[0.4, 12, 12]} />
              <primitive object={mats.steam} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Left Side Herb Station: Wooden Stand & Terracotta Sprout */}
        <group ref={sprout} position={[-1.72, 0.24, 0.2]}>
          {/* Rustic Wood Pedestal (Firmly Grounded on Deck) */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.32, 0.36, 0.16, 20]} />
            <primitive object={mats.deckBark} attach="material" />
          </mesh>
          {/* Terracotta Pot */}
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.2, 0.14, 0.24, 20]} />
            <primitive object={mats.terracotta} attach="material" />
          </mesh>
          <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.026, 10, 24]} />
            <primitive object={mats.terracotta} attach="material" />
          </mesh>
          {/* Potting Soil */}
          <mesh position={[0, 0.36, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.03, 16]} />
            <primitive object={mats.dark} attach="material" />
          </mesh>
          {/* Green Sprout Stem */}
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.018, 0.024, 0.24, 10]} />
            <primitive object={mats.leafGreen} attach="material" />
          </mesh>
          {/* Budding Tea Leaves */}
          {[-0.4, 0.4, 0].map((rot, i) => (
            <mesh
              key={i}
              position={[i === 0 ? -0.06 : i === 1 ? 0.06 : 0, 0.56 + i * 0.04, i === 2 ? 0.06 : 0]}
              rotation={[0.3, 0.2 + i * 0.8, rot]}
              scale={[0.8, 1.2, 0.3]}
            >
              <sphereGeometry args={[0.08, 12, 12]} />
              <primitive object={mats.leafGreen} attach="material" />
            </mesh>
          ))}
        </group>
      </group>

      {/* Natural Birch Branch Arch & Swaying Paper Moon Lantern */}
      <group ref={branchGroup} position={[-2.4, 2.5, -0.6]}>
        {/* Support Trunk rising from the deck */}
        <mesh position={[0, -1.4, 0]}>
          <cylinderGeometry args={[0.09, 0.12, 2.6, 16]} />
          <primitive object={mats.branch} attach="material" />
        </mesh>
        {/* Overhead Branch Arch */}
        <mesh position={[0.4, 0.05, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.07, 0.09, 1.3, 16]} />
          <primitive object={mats.branch} attach="material" />
        </mesh>
        <mesh position={[1.1, -0.25, 0.1]} rotation={[0, 0, -0.75]}>
          <cylinderGeometry args={[0.05, 0.07, 0.8, 16]} />
          <primitive object={mats.branch} attach="material" />
        </mesh>
        {/* Birch Leaf Clusters */}
        {[-0.1, 0.4, 0.9, 1.25].map((lx, i) => (
          <mesh key={i} position={[lx, 0.1 - i * 0.22, 0.15]} rotation={[0.2, 0.4, -0.5 + i * 0.3]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <primitive object={mats.leafGreen} attach="material" />
          </mesh>
        ))}

        {/* Swaying Lantern */}
        <group ref={lantern} position={[1.3, -0.45, 0.15]}>
          <mesh position={[0, 0.26, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.52, 8]} />
            <primitive object={mats.dark} attach="material" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.06, 20]} />
            <primitive object={mats.lanternWood} attach="material" />
          </mesh>
          <mesh position={[0, -0.24, 0]}>
            <sphereGeometry args={[0.27, 24, 20]} />
            <primitive object={mats.lanternPaper} attach="material" />
          </mesh>
          <mesh position={[0, -0.48, 0]}>
            <cylinderGeometry args={[0.15, 0.14, 0.05, 20]} />
            <primitive object={mats.lanternWood} attach="material" />
          </mesh>
          <mesh position={[0, -0.62, 0]}>
            <coneGeometry args={[0.045, 0.22, 12]} />
            <primitive object={mats.pink} attach="material" />
          </mesh>
          <pointLight ref={lanternLight} position={[0, -0.24, 0]} intensity={9} color={activeTheme.lanternLight} distance={4} />
        </group>
      </group>

      {/* Main Sloth Character: Sunny (Anatomically Connected) */}
      <group
        ref={root}
        position={[0, -0.72, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPoke();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Sculpted Anatomical Torso with Shoulders and Belly */}
        <group ref={body}>
          {/* Main Torso */}
          <mesh position={[0, 0.1, 0]} scale={[0.96, 1.1, 0.9]}>
            <sphereGeometry args={[0.95, 48, 48]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Cream Fur Belly Bib */}
          <mesh position={[0, 0.08, 0.58]} scale={[0.88, 1.0, 0.42]}>
            <sphereGeometry args={[0.78, 36, 36]} />
            <primitive object={mats.belly} attach="material" />
          </mesh>
          {/* Anatomical Shoulder Girdle / Clavicle Crest (Bridges Torso to Arms) */}
          <mesh position={[0, 0.76, 0.05]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.24, 1.15, 16, 24]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
        </group>

        {/* Anatomical Neck Column (Bridges Torso to Skull, Eliminating Floating Gaps) */}
        <mesh ref={neck} position={[0, 0.96, -0.02]}>
          <cylinderGeometry args={[0.48, 0.62, 0.44, 32]} />
          <primitive object={mats.fur} attach="material" />
        </mesh>

        {/* Hind Thighs and Paws Resting on Cushion */}
        {[-0.5, 0.5].map((x) => (
          <group key={x} position={[x, -0.78, 0.32]}>
            <mesh scale={[1, 0.72, 1.12]}>
              <sphereGeometry args={[0.36, 24, 24]} />
              <primitive object={mats.fur} attach="material" />
            </mesh>
            {/* Paw Sole */}
            <mesh position={[0, -0.16, 0.28]} scale={[0.8, 0.3, 1]}>
              <sphereGeometry args={[0.12, 14, 14]} />
              <primitive object={mats.pawPad} attach="material" />
            </mesh>
            {/* 3 Hind Claws */}
            {[-0.07, 0, 0.07].map((cx) => (
              <mesh key={cx} position={[cx, -0.15, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.028, 0.12, 10]} />
                <primitive object={mats.claw} attach="material" />
              </mesh>
            ))}
          </group>
        ))}

        {/* Organic Curved Sloth Forearms with Ball-and-Socket Shoulders */}
        <group ref={armL} position={[-0.82, 0.68, 0.15]} rotation={[0, 0, -0.32]}>
          {/* Shoulder Ball Joint (Seamlessly Fused with Torso) */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.22, 20, 20]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Upper Arm */}
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.16, 0.52, 12, 24]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Elbow Joint */}
          <mesh position={[0, -0.6, 0.02]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Forearm (Gently Angled Forward) */}
          <mesh position={[0, -0.84, 0.06]} rotation={[0.15, 0, 0]}>
            <capsuleGeometry args={[0.14, 0.42, 12, 24]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Rounded Furry Paw / Wrist */}
          <mesh position={[0, -1.08, 0.1]} scale={[1, 0.8, 0.9]}>
            <sphereGeometry args={[0.14, 18, 18]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Palm Pad */}
          <mesh position={[0, -1.1, 0.08]} scale={[0.8, 0.3, 0.9]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <primitive object={mats.pawPad} attach="material" />
          </mesh>
          {/* 3 Curved Keratin Claws Rooted into Knuckles */}
          {[-0.065, 0, 0.065].map((x) => (
            <mesh key={x} position={[x, -1.18, 0.14]} rotation={[-0.35, 0, Math.PI]}>
              <coneGeometry args={[0.032, 0.22, 12]} />
              <primitive object={mats.claw} attach="material" />
            </mesh>
          ))}
        </group>

        <group ref={armR} position={[0.82, 0.68, 0.15]} rotation={[0, 0, 0.32]}>
          {/* Shoulder Ball Joint */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.22, 20, 20]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Upper Arm */}
          <mesh position={[0, -0.3, 0]}>
            <capsuleGeometry args={[0.16, 0.52, 12, 24]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Elbow Joint */}
          <mesh position={[0, -0.6, 0.02]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Forearm */}
          <mesh position={[0, -0.84, 0.06]} rotation={[0.15, 0, 0]}>
            <capsuleGeometry args={[0.14, 0.42, 12, 24]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Rounded Furry Paw */}
          <mesh position={[0, -1.08, 0.1]} scale={[1, 0.8, 0.9]}>
            <sphereGeometry args={[0.14, 18, 18]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Palm Pad */}
          <mesh position={[0, -1.1, 0.08]} scale={[0.8, 0.3, 0.9]}>
            <sphereGeometry args={[0.09, 12, 12]} />
            <primitive object={mats.pawPad} attach="material" />
          </mesh>
          {/* 3 Curved Keratin Claws Rooted into Knuckles */}
          {[-0.065, 0, 0.065].map((x) => (
            <mesh key={x} position={[x, -1.18, 0.14]} rotation={[-0.35, 0, Math.PI]}>
              <coneGeometry args={[0.032, 0.22, 12]} />
              <primitive object={mats.claw} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Expressive Anatomical Head */}
        <group ref={head} position={[0, 1.28, 0]}>
          {/* Cranial Vault (Skull) */}
          <mesh scale={[1.06, 0.96, 1.04]}>
            <sphereGeometry args={[0.85, 48, 48]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>

          {/* Soft Cream Facial Mask */}
          <mesh position={[0, -0.05, 0.52]} scale={[0.94, 0.82, 0.46]}>
            <sphereGeometry args={[0.8, 40, 40]} />
            <primitive object={mats.belly} attach="material" />
          </mesh>

          {/* Spring Velvety Sloth Ears nestled at the sides of the cranium */}
          <group ref={earL} position={[-0.72, 0.16, -0.1]} rotation={[0, -0.3, 0]}>
            <mesh scale={[1, 1.2, 0.5]}>
              <sphereGeometry args={[0.17, 16, 16]} />
              <primitive object={mats.fur} attach="material" />
            </mesh>
            <mesh position={[0.02, 0, 0.04]} scale={[0.7, 0.85, 0.4]}>
              <sphereGeometry args={[0.11, 12, 12]} />
              <primitive object={mats.pink} attach="material" />
            </mesh>
          </group>

          <group ref={earR} position={[0.72, 0.16, -0.1]} rotation={[0, 0.3, 0]}>
            <mesh scale={[1, 1.2, 0.5]}>
              <sphereGeometry args={[0.17, 16, 16]} />
              <primitive object={mats.fur} attach="material" />
            </mesh>
            <mesh position={[-0.02, 0, 0.04]} scale={[0.7, 0.85, 0.4]}>
              <sphereGeometry args={[0.11, 12, 12]} />
              <primitive object={mats.pink} attach="material" />
            </mesh>
          </group>

          {/* Classic Sloth Chocolate Eye Bands & Soulful Eyes */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.42, 0.02, 0.72]}>
              {/* Rich Espresso Sloth Mask Band */}
              <mesh rotation={[0, side * 0.15, side * -0.36]} scale={[1.1, 1.55, 0.4]}>
                <sphereGeometry args={[0.17, 24, 24]} />
                <primitive object={mats.eyeBand} attach="material" />
              </mesh>

              {/* Eye & Pupil */}
              <group ref={side < 0 ? eyeL : eyeR} position={[0, 0, 0.04]}>
                <mesh scale={[1, 1.1, 0.55]}>
                  <sphereGeometry args={[0.105, 24, 24]} />
                  <primitive object={mats.white} attach="material" />
                </mesh>
                <group ref={side < 0 ? pupilL : pupilR} position={[0, 0, 0.04]}>
                  <mesh scale={[1, 1.06, 0.5]}>
                    <sphereGeometry args={[0.065, 20, 20]} />
                    <primitive object={mats.dark} attach="material" />
                  </mesh>
                  {/* Dual Specular Catchlights */}
                  <mesh position={[0.022, 0.026, 0.035]}>
                    <sphereGeometry args={[0.016, 12, 12]} />
                    <primitive object={mats.white} attach="material" />
                  </mesh>
                  <mesh position={[-0.014, -0.018, 0.035]}>
                    <sphereGeometry args={[0.008, 10, 10]} />
                    <primitive object={mats.white} attach="material" />
                  </mesh>
                </group>
              </group>
            </group>
          ))}

          {/* Rounded Sloth Snout & Nose */}
          <group position={[0, -0.14, 0.94]}>
            <mesh position={[0, 0, -0.05]} scale={[1.1, 0.85, 0.5]}>
              <sphereGeometry args={[0.14, 20, 20]} />
              <primitive object={mats.belly} attach="material" />
            </mesh>
            <mesh scale={[1.2, 0.82, 0.7]}>
              <sphereGeometry args={[0.08, 20, 20]} />
              <primitive object={mats.nose} attach="material" />
            </mesh>
            {[-0.026, 0.026].map((nx) => (
              <mesh key={nx} position={[nx, -0.018, 0.052]} scale={[0.6, 1, 0.5]}>
                <sphereGeometry args={[0.013, 10, 10]} />
                <primitive object={mats.dark} attach="material" />
              </mesh>
            ))}
          </group>

          {/* Gentle Smile Line */}
          <mesh ref={smile} position={[0, -0.24, 0.92]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.12, 0.018, 10, 24, Math.PI]} />
            <primitive object={mats.dark} attach="material" />
          </mesh>

          {/* Open Mouth with Tongue */}
          <group ref={openMouth} position={[0, -0.28, 0.89]} visible={false}>
            <mesh>
              <sphereGeometry args={[0.095, 16, 16]} />
              <primitive object={mats.mouth} attach="material" />
            </mesh>
            <mesh position={[0, -0.03, 0.04]} scale={[0.8, 0.5, 0.8]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <primitive object={mats.tongue} attach="material" />
            </mesh>
          </group>

          {/* Rosy Cheeks */}
          {[-0.52, 0.52].map((x) => (
            <mesh key={x} position={[x, -0.16, 0.72]} scale={[1.2, 0.75, 0.35]}>
              <sphereGeometry args={[0.1, 20, 20]} />
              <primitive object={mats.pink} attach="material" />
            </mesh>
          ))}

          {/* Velvet Nightcap (Bedtime Mode) */}
          <group ref={cap} position={[0.08, 0.74, 0]} rotation={[0, 0, -0.32]} scale={0}>
            <mesh>
              <coneGeometry args={[0.56, 1.12, 32]} />
              <primitive object={mats.accent} attach="material" />
            </mesh>
            <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.54, 0.065, 16, 32]} />
              <primitive object={mats.white} attach="material" />
            </mesh>
            <group ref={pompom} position={[0.14, 0.62, 0]}>
              <mesh>
                <sphereGeometry args={[0.14, 20, 20]} />
                <primitive object={mats.white} attach="material" />
              </mesh>
            </group>
          </group>

          {/* Ruffled Shower Cap (Bath Mode - Snugly Fitted to Cranium) */}
          <group ref={showerCap} position={[0, 0.42, 0.02]} scale={0}>
            <mesh scale={[1.08, 0.58, 1.08]}>
              <sphereGeometry args={[0.84, 36, 28]} />
              <primitive object={mats.showerCapMat} attach="material" />
            </mesh>
            <mesh position={[0, -0.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.86, 0.055, 14, 36]} />
              <primitive object={mats.white} attach="material" />
            </mesh>
          </group>
        </group>

        {/* Teacup & Saucer (Sipping Mode) */}
        <group ref={cup} position={[0.52, 0.86, 0.95]} scale={0}>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.28, 0.18, 0.03, 32]} />
            <primitive object={mats.ceramic} attach="material" />
          </mesh>
          <mesh>
            <cylinderGeometry args={[0.2, 0.15, 0.26, 32]} />
            <primitive object={mats.ceramic} attach="material" />
          </mesh>
          <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.2, 0.014, 12, 32]} />
            <primitive object={mats.gold} attach="material" />
          </mesh>
          <mesh position={[0, 0.09, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.03, 32]} />
            <primitive object={mats.accent} attach="material" />
          </mesh>
          <mesh position={[0.22, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.075, 0.022, 12, 20]} />
            <primitive object={mats.ceramic} attach="material" />
          </mesh>

          {/* Rising Steam */}
          {[0, 1, 2].map((idx) => (
            <mesh
              key={idx}
              ref={(el) => {
                steamPuffsCup.current[idx] = el;
              }}
              position={[0, 0.16, 0]}
            >
              <sphereGeometry args={[0.28, 10, 10]} />
              <primitive object={mats.steam} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Bedtime Pillow & Waffle-Knit Blanket */}
        <mesh ref={pillow} position={[0, 1.1, -0.65]} scale={0}>
          <sphereGeometry args={[0.9, 32, 32]} />
          <primitive object={mats.white} attach="material" />
        </mesh>
        <group ref={blanket} position={[0, -0.38, 0.62]} scale={0}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.56, 1.5, 16, 32]} />
            <primitive object={mats.accent} attach="material" />
          </mesh>
          <mesh position={[0, 0.5, 0.05]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.095, 1.45, 12, 24]} />
            <primitive object={mats.white} attach="material" />
          </mesh>
        </group>
      </group>

      {/* Luxury Clawfoot Bathtub (Firmly Grounded on Deck) */}
      <group ref={tub} position={[0, -1.22, 0]} scale={0}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.75, 1.4, 0.88, 40]} />
          <primitive object={mats.ceramic} attach="material" />
        </mesh>
        <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.73, 0.075, 16, 40]} />
          <primitive object={mats.white} attach="material" />
        </mesh>
        {/* Antique Gold Feet Resting on Ground */}
        {[-1.2, 1.2].map((x) =>
          [-0.75, 0.75].map((z) => (
            <group key={`${x}-${z}`} position={[x * 0.9, -0.48, z * 0.9]}>
              <mesh>
                <sphereGeometry args={[0.12, 14, 14]} />
                <primitive object={mats.gold} attach="material" />
              </mesh>
              {[-0.035, 0, 0.035].map((tx) => (
                <mesh key={tx} position={[tx, -0.07, 0.07]} rotation={[0.4, 0, 0]}>
                  <coneGeometry args={[0.024, 0.08, 8]} />
                  <primitive object={mats.gold} attach="material" />
                </mesh>
              ))}
            </group>
          ))
        )}
        {/* Swan-Neck Gold Faucet */}
        <group position={[0, 0.6, -1.68]} rotation={[0, Math.PI, 0]}>
          <mesh>
            <cylinderGeometry args={[0.038, 0.048, 0.32, 16]} />
            <primitive object={mats.gold} attach="material" />
          </mesh>
          <mesh position={[0, 0.2, 0.09]} rotation={[Math.PI / 3, 0, 0]}>
            <cylinderGeometry args={[0.032, 0.032, 0.2, 16]} />
            <primitive object={mats.gold} attach="material" />
          </mesh>
        </group>
        {/* Bath Water */}
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[1.62, 1.62, 0.04, 40]} />
          <primitive object={mats.water} attach="material" />
        </mesh>
        {/* Bubble Clusters */}
        {[
          [-0.8, 0.34, 0.5, 0.18],
          [-0.3, 0.34, -0.55, 0.22],
          [0.35, 0.34, 0.6, 0.2],
          [0.8, 0.34, -0.35, 0.16],
          [-0.08, 0.34, 0.75, 0.15],
          [0.65, 0.34, 0.3, 0.17],
        ].map(([bx, by, bz, br], idx) => (
          <mesh key={idx} position={[bx, by, bz]}>
            <sphereGeometry args={[br, 16, 16]} />
            <primitive object={mats.bubbleWhite} attach="material" />
          </mesh>
        ))}

        {/* Concentric Ripples */}
        {[0, 1, 2].map((idx) => (
          <mesh
            key={idx}
            ref={(el) => {
              bathRipples.current[idx] = el;
            }}
            position={[0.95, 0.29, 0.6]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.07, 0.13, 32]} />
            <primitive object={mats.rippleMat} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Floating Rubber Ducky */}
      <group ref={duck} position={[0.95, -0.48, 0.6]} scale={0}>
        <mesh>
          <sphereGeometry args={[0.18, 20, 20]} />
          <primitive object={mats.duck} attach="material" />
        </mesh>
        <mesh position={[0.07, 0.14, 0.03]}>
          <sphereGeometry args={[0.12, 20, 20]} />
          <primitive object={mats.duck} attach="material" />
        </mesh>
        <mesh position={[0.2, 0.12, 0.03]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.06, 0.12, 16]} />
          <primitive object={mats.orange} attach="material" />
        </mesh>
        <mesh position={[0.11, 0.17, 0.11]} scale={0.7}>
          <sphereGeometry args={[0.024, 10, 10]} />
          <primitive object={mats.dark} attach="material" />
        </mesh>
      </group>

      {/* Crescent Moon & Star */}
      <group ref={moon} position={[-2.5, 2.4, -1.4]} scale={0}>
        <mesh>
          <sphereGeometry args={[0.52, 32, 32]} />
          <primitive object={mats.moon} attach="material" />
        </mesh>
        <mesh position={[0.7, -0.28, 0.2]} scale={0.24}>
          <octahedronGeometry args={[0.55, 0]} />
          <primitive object={mats.gold} attach="material" />
        </mesh>
      </group>

      {/* Drifting Fireflies */}
      {FIREFLIES_CONFIG.map((_, idx) => (
        <group
          key={idx}
          ref={(el) => {
            fireflyRefs.current[idx] = el;
          }}
        >
          <mesh>
            <sphereGeometry args={[1, 12, 12]} />
            <primitive object={mats.fireflyMat} attach="material" />
          </mesh>
          <pointLight color={activeTheme.sparkleColor} intensity={0.75} distance={1.1} />
        </group>
      ))}

      {/* Golden Celestial Sparkles */}
      <Sparkles
        count={starlightGlow && starlightGlow > 60 ? 80 : mood === 'sleeping' ? 32 : mood === 'bathing' ? 65 : 48}
        scale={[7, 5, 3]}
        size={starlightGlow && starlightGlow > 75 ? 6 : mood === 'sleeping' ? 3 : mood === 'bathing' ? 6 : 4.5}
        speed={mood === 'bathing' ? 0.7 : 0.4}
        color={
          starlightGlow && starlightGlow > 70
            ? '#fde047'
            : mood === 'sleeping'
            ? '#c7d2fe'
            : mood === 'bathing'
            ? '#7dd3fc'
            : activeTheme.sparkleColor
        }
      />
    </>
  );
}

export default function SlothPet3D(props: SlothPet3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.35, 9.2], fov: 35 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        camera.lookAt(0, 0.95, 0);
      }}
      style={{ touchAction: 'manipulation' }}
    >
      <Pet {...props} />
    </Canvas>
  );
}
