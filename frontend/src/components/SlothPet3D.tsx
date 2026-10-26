'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

export type PetMood = 'idle' | 'talking' | 'sleeping' | 'happy' | 'eating' | 'bathing' | 'playing';

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
}

const damp = THREE.MathUtils.damp;

// Initial positions and harmonic trajectories for drifting celestial fireflies (Package D)
const FIREFLIES_CONFIG = [
  { base: [1.4, -0.4, 0.9], speed: 0.9, phase: 0.0 },
  { base: [-1.5, -0.6, 0.8], speed: 1.1, phase: 1.5 },
  { base: [1.8, 0.4, 0.5], speed: 0.75, phase: 2.8 },
  { base: [-1.2, 0.8, -0.2], speed: 1.25, phase: 4.1 },
  { base: [0.6, 1.8, 0.4], speed: 0.85, phase: 5.2 },
  { base: [-0.8, 1.6, 0.6], speed: 1.05, phase: 3.4 },
  { base: [0.0, -1.0, 1.2], speed: 0.7, phase: 2.1 },
];

function Pet({ mood, furColor, accentColor, pokeCount, onPoke, starlightGlow }: SlothPet3DProps) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Group>(null);
  const eyeR = useRef<THREE.Group>(null);
  const pupilL = useRef<THREE.Group>(null);
  const pupilR = useRef<THREE.Group>(null);
  const smile = useRef<THREE.Mesh>(null);
  const openMouth = useRef<THREE.Mesh>(null);
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
  const seat = useRef<THREE.Group>(null);

  // Package A: Environmental Props refs
  const kettle = useRef<THREE.Group>(null);
  const lantern = useRef<THREE.Group>(null);
  const sprout = useRef<THREE.Group>(null);
  const steamPuffsKettle = useRef<(THREE.Mesh | null)[]>([]);
  const steamPuffsCup = useRef<(THREE.Mesh | null)[]>([]);

  // Package C: Spring Physics Refs (Ears & Nightcap Pompom)
  const earL = useRef<THREE.Group>(null);
  const earR = useRef<THREE.Group>(null);
  const pompom = useRef<THREE.Group>(null);
  const earSpringL = useRef({ pos: 0, vel: 0 });
  const earSpringR = useRef({ pos: 0, vel: 0 });
  const pompomSpring = useRef({ pos: 0, vel: 0 });

  // Package C: Sloth Yawn & Stretch Idle Cycle
  const nextYawnTime = useRef(16);
  const yawnActive = useRef(false);
  const yawnProgress = useRef(0);

  // Package B: Camera Bedtime Framing & Parallax State
  const camLookAtY = useRef(0.95);

  // Package D: Bath Water Ripples & Firefly References
  const bathRipples = useRef<(THREE.Mesh | null)[]>([]);
  const fireflyRefs = useRef<(THREE.Group | null)[]>([]);
  const fireflyScatter = useRef<{ x: number; y: number }[]>(
    FIREFLIES_CONFIG.map(() => ({ x: 0, y: 0 }))
  );

  const lastPoke = useRef(pokeCount);
  const squash = useRef(0);
  const nextBlink = useRef(2);
  const blinkUntil = useRef(0);

  // High-fidelity physical and procedural materials
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
        color: '#fef3c7',
        roughness: 0.88,
        metalness: 0.0,
        sheen: 0.65,
        sheenRoughness: 0.5,
        sheenColor: new THREE.Color('#ffffff'),
      }),
      patch: new THREE.MeshPhysicalMaterial({
        roughness: 0.85,
        metalness: 0.02,
        sheen: 0.4,
        sheenRoughness: 0.55,
        sheenColor: new THREE.Color('#fde047'),
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
      dark: new THREE.MeshStandardMaterial({ color: '#261b2e', roughness: 0.45 }),
      nose: new THREE.MeshStandardMaterial({ color: '#1e1424', roughness: 0.6 }),
      pink: new THREE.MeshStandardMaterial({ color: '#fca5a5', roughness: 0.85 }),
      claw: new THREE.MeshStandardMaterial({ color: '#fef9e7', roughness: 0.35, metalness: 0.05 }),
      gold: new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.28, metalness: 0.85 }),
      woodBark: new THREE.MeshStandardMaterial({ color: '#5a3d28', roughness: 0.95 }),
      woodTop: new THREE.MeshStandardMaterial({ color: '#bfa07a', roughness: 0.85 }),
      mouth: new THREE.MeshStandardMaterial({ color: '#881337', roughness: 0.6 }),
      moon: new THREE.MeshStandardMaterial({ color: '#fffbeb', emissive: '#fef08a', emissiveIntensity: 1.1 }),
      water: new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        roughness: 0.05,
        transparent: true,
        opacity: 0.8,
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
      // Package A Materials:
      iron: new THREE.MeshStandardMaterial({ color: '#232126', roughness: 0.65, metalness: 0.75 }),
      coal: new THREE.MeshStandardMaterial({ color: '#ea580c', emissive: '#f97316', emissiveIntensity: 1.6 }),
      stone: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9 }),
      lanternPaper: new THREE.MeshStandardMaterial({
        color: '#fffbeb',
        emissive: '#fef08a',
        emissiveIntensity: 0.85,
        roughness: 0.6,
      }),
      lanternWood: new THREE.MeshStandardMaterial({ color: '#382216', roughness: 0.6 }),
      branch: new THREE.MeshStandardMaterial({ color: '#6c4c37', roughness: 0.95 }),
      leafGreen: new THREE.MeshStandardMaterial({ color: '#4ade80', roughness: 0.55 }),
      terracotta: new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.85 }),
      steam: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.35,
        roughness: 0.2,
      }),
      // Package D Materials:
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

  // Hooke's Law Spring Physics Helper for Package C
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

    // Package B: Smooth Material & Velvet Sheen Transitions
    mats.fur.color.lerp(furTarget, 0.1);
    mats.fur.sheenColor.copy(mats.fur.color).lerp(tmp.set('#ffffff'), 0.35);
    mats.belly.color.copy(mats.fur.color).lerp(tmp.set('#fffbeb'), 0.72);
    mats.patch.color.copy(mats.fur.color).multiplyScalar(0.42);
    mats.accent.color.lerp(accentTarget, 0.1);
    mats.accent.emissive.copy(mats.accent.color);
    mats.accent.sheenColor.copy(mats.accent.color).lerp(tmp.set('#ffffff'), 0.4);

    // Package B: 3D Window Shadowbox Parallax & Cinematic Bedtime Zoom
    const targetCamX = sleeping ? pointer.x * 0.25 : pointer.x * 0.55;
    const targetCamY = sleeping ? 1.05 + pointer.y * 0.15 : 1.35 + pointer.y * 0.35;
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

    // Package C: Languid Sloth Yawn & Stretch Idle Cycle
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
        yawnArmL = k * -2.25;
        yawnArmR = k * 2.25;
        yawnHeadPitch = k * -0.24;
        yawnMouth = k * 0.85;
        yawnSquint = k;
      } else if (yp < 0.7) {
        const tremor = Math.sin(t * 24) * 0.025;
        yawnArmL = -2.25 + tremor;
        yawnArmR = 2.25 - tremor;
        yawnHeadPitch = -0.24;
        yawnMouth = 0.85;
        yawnSquint = 1;
      } else if (yp < 1.0) {
        const k = 1 - Math.sin(((yp - 0.7) / 0.3) * (Math.PI / 2));
        yawnArmL = k * -2.25;
        yawnArmR = k * 2.25;
        yawnHeadPitch = k * -0.24;
        yawnMouth = k * 0.85;
        yawnSquint = k * 0.7;
      } else {
        yawnActive.current = false;
        nextYawnTime.current = t + 24 + ((Math.cos(t * 7) + 1) / 2) * 12;
      }
    }

    // Root movement
    if (root.current) {
      const hop = happy || playing ? Math.abs(Math.sin(t * (playing ? 4.5 : 3.2))) * 0.25 : 0;
      const bathBob = bathing ? Math.sin(t * 2.2) * 0.06 - 0.22 : 0;
      root.current.position.y = damp(root.current.position.y, (sleeping ? -0.18 : 0) + hop + bathBob + s * 0.1, 8, dt);
      root.current.scale.set(1 - wobble * 0.08, 1 + wobble * 0.14, 1 - wobble * 0.08);
      root.current.rotation.z = damp(
        root.current.rotation.z,
        sleeping ? 0.08 : playing ? Math.sin(t * 3.5) * 0.07 : Math.sin(t * 1.2) * 0.015,
        4,
        dt
      );
    }

    // Breathing rhythm
    if (body.current) {
      const breath = Math.sin(t * (sleeping ? 1.0 : 1.8)) * 0.02;
      body.current.scale.set(1 + breath, 1.03 + breath * 1.2, 0.98 + breath);
    }

    // Head tracking
    if (head.current) {
      head.current.rotation.y = damp(
        head.current.rotation.y,
        sleeping ? 0 : bathing ? Math.sin(t * 1.4) * 0.12 : pointer.x * 0.35,
        5,
        dt
      );
      const baseHeadX = sleeping ? 0.25 : bathing ? -0.08 : -pointer.y * 0.18;
      head.current.rotation.x = damp(head.current.rotation.x, baseHeadX + yawnHeadPitch, 5, dt);
      head.current.position.y = 1.42 + Math.sin(t * 1.8) * 0.012;
    }

    // Ear & Pompom Spring Physics Simulation
    const headRotY = head.current ? head.current.rotation.y : 0;
    const earTarget = headRotY * 0.3;
    const earJiggleL = stepSpring(earSpringL.current, earTarget, 75, 7.5, dt);
    const earJiggleR = stepSpring(earSpringR.current, -earTarget, 75, 7.5, dt);

    if (earL.current) {
      earL.current.rotation.z = earJiggleL * 0.35;
      earL.current.rotation.y = -0.35 + earJiggleL * 0.25;
    }
    if (earR.current) {
      earR.current.rotation.z = earJiggleR * 0.35;
      earR.current.rotation.y = 0.35 + earJiggleR * 0.25;
    }

    const pompomOffset = stepSpring(pompomSpring.current, 0, 50, 5.5, dt);
    if (pompom.current) {
      pompom.current.position.x = 0.15 + pompomOffset * 0.04;
      pompom.current.position.y = 0.65 + Math.sin(t * 2.5) * 0.02 + Math.abs(pompomOffset) * 0.025;
      pompom.current.rotation.z = pompomOffset * 0.3;
    }

    // Blinking & Yawn Squint
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
        p.current.position.x = damp(p.current.position.x, pointer.x * 0.03, 8, dt);
        p.current.position.y = damp(p.current.position.y, pointer.y * 0.025, 8, dt);
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
    if (smile.current) smile.current.visible = open < 0.08;
    if (openMouth.current) {
      openMouth.current.visible = open >= 0.08;
      openMouth.current.scale.set(1, 0.3 + open * 0.9, 1);
    }

    // Arms
    if (armL.current) {
      const targetL = playing
        ? -2.1 + Math.sin(t * 6) * 0.25
        : bathing
        ? -0.6 + Math.sin(t * 3.2) * 0.15
        : talking
        ? -0.85 + Math.sin(t * 6) * 0.2
        : yawnActive.current
        ? yawnArmL
        : -0.28;
      armL.current.rotation.z = damp(armL.current.rotation.z, targetL, 6, dt);
    }
    if (armR.current) {
      const targetR = playing
        ? 2.1 - Math.cos(t * 6) * 0.25
        : bathing
        ? 0.6 - Math.cos(t * 3.2) * 0.15
        : happy
        ? 2.2 + Math.sin(t * 8) * 0.3
        : eating
        ? 1.65
        : talking
        ? 0.85 - Math.sin(t * 5) * 0.2
        : yawnActive.current
        ? yawnArmR
        : 0.28;
      armR.current.rotation.z = damp(armR.current.rotation.z, targetR, 6, dt);
    }

    // Props transitions
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
    popTo(seat.current, !bathing);
    popTo(kettle.current, !bathing);
    popTo(sprout.current, !bathing);

    if (cup.current) cup.current.position.y = 0.92 + Math.sin(t * 3) * 0.06;
    if (duck.current) {
      duck.current.position.y = -0.55 + Math.sin(t * 3.2) * 0.05;
      duck.current.rotation.y = Math.sin(t * 1.8) * 0.25;
    }

    // Package A: Overhead Paper Lantern swaying
    if (lantern.current) {
      lantern.current.rotation.z = Math.sin(t * 1.4) * 0.05;
      lantern.current.rotation.x = Math.cos(t * 1.0) * 0.035;
    }

    // Package A: Curly rising steam from kettle spout
    steamPuffsKettle.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const offset = idx * 0.25;
      const progress = ((t * 0.45 + offset) % 1.0);
      mesh.position.y = 0.35 + progress * 0.75;
      mesh.position.x = 0.28 + Math.sin(t * 2.2 + idx * 1.4) * 0.06 * (1 + progress);
      mesh.position.z = Math.cos(t * 1.8 + idx) * 0.04;
      const sc = 0.04 + progress * 0.14;
      mesh.scale.set(sc, sc, sc);
      mesh.visible = !bathing;
    });

    // Package A: Curly rising steam from teacup
    steamPuffsCup.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const offset = idx * 0.33;
      const progress = ((t * 0.5 + offset) % 1.0);
      mesh.position.y = 0.18 + progress * 0.65;
      mesh.position.x = Math.sin(t * 2.5 + idx * 1.8) * 0.05 * (1 + progress);
      mesh.position.z = Math.cos(t * 2.0 + idx) * 0.03;
      const sc = 0.035 + progress * 0.12;
      mesh.scale.set(sc, sc, sc);
      mesh.visible = eating;
    });

    // Package D: Concentric Bath Wave Ripples expanding from the rubber ducky
    bathRipples.current.forEach((mesh, idx) => {
      if (!mesh) return;
      if (!bathing) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      const offset = idx * 0.33;
      const prog = (t * 0.55 + offset) % 1.0;
      const sc = 0.2 + prog * 2.4;
      mesh.scale.set(sc, sc, 1);
      const alpha = Math.sin(prog * Math.PI) * 0.45;
      mesh.scale.set(sc, sc, sc);
      if (mesh.material && 'opacity' in mesh.material) {
        (mesh.material as THREE.Material & { opacity: number }).opacity = alpha;
      }
    });

    // Package D: Interactive Drifting Fireflies / Bio-luminescent Embers
    const scenePointerX = pointer.x * 2.6;
    const scenePointerY = pointer.y * 1.8;

    fireflyRefs.current.forEach((group, idx) => {
      if (!group) return;
      const cfg = FIREFLIES_CONFIG[idx];
      const scatter = fireflyScatter.current[idx];

      // Natural harmonic floating orbit
      const orbitX = cfg.base[0] + Math.sin(t * cfg.speed + cfg.phase) * 0.45;
      const orbitY = cfg.base[1] + Math.cos(t * cfg.speed * 1.25 + cfg.phase) * 0.35;
      const orbitZ = cfg.base[2] + Math.sin(t * cfg.speed * 0.75 + cfg.phase) * 0.4;

      // Pointer interactive evasion (soft scatter on hover/tap)
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

      // Organic pulsing glow
      const pulse = 0.035 + (Math.sin(t * 3.5 + cfg.phase) * 0.5 + 0.5) * 0.025;
      group.scale.set(pulse, pulse, pulse);
    });

    if (ambient.current) ambient.current.intensity = damp(ambient.current.intensity, sleeping ? 0.6 : 1.1, 3, dt);
  });

  return (
    <>
      {/* Pixar-style Studio 3-Point Lighting */}
      <ambientLight ref={ambient} intensity={1.1} />
      {/* Key Light: warm sunlight */}
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#fff7ed" />
      {/* Fill Light: soft lavender twilight */}
      <directionalLight position={[-4, 3, 3]} intensity={0.7} color="#c7d2fe" />
      {/* Rim / Silhouette Light: creates the classy soft furry outline */}
      <directionalLight position={[0, 4, -5]} intensity={1.8} color="#fef08a" />

      {/* Ground Contact Shadow: anchors Sunny to the world */}
      <ContactShadows position={[0, -1.82, 0]} opacity={0.45} scale={7} blur={2.2} far={4} />

      {/* Package A: Overhead Birch Branch & Swaying Paper Moon Lantern */}
      <group position={[-2.7, 2.7, -0.6]}>
        {/* Birch Branch Arch */}
        <mesh position={[0.4, -0.15, 0]} rotation={[0, 0, -0.45]}>
          <cylinderGeometry args={[0.07, 0.11, 1.4, 16]} />
          <primitive object={mats.branch} attach="material" />
        </mesh>
        <mesh position={[1.1, -0.45, 0.1]} rotation={[0, 0, -0.75]}>
          <cylinderGeometry args={[0.05, 0.07, 0.8, 16]} />
          <primitive object={mats.branch} attach="material" />
        </mesh>
        {/* Delicate Birch Leaves */}
        {[-0.2, 0.3, 0.8, 1.2].map((lx, i) => (
          <mesh key={i} position={[lx, -0.1 - i * 0.25, 0.15]} rotation={[0.2, 0.4, -0.5 + i * 0.3]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <primitive object={mats.leafGreen} attach="material" />
          </mesh>
        ))}

        {/* Swaying Lantern Group */}
        <group ref={lantern} position={[1.35, -0.65, 0.15]}>
          {/* Suspension Cord */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.6, 8]} />
            <primitive object={mats.dark} attach="material" />
          </mesh>
          {/* Top Wooden Cap */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.06, 20]} />
            <primitive object={mats.lanternWood} attach="material" />
          </mesh>
          {/* Ribbed Paper Lantern Body */}
          <mesh position={[0, -0.26, 0]}>
            <sphereGeometry args={[0.28, 24, 20]} />
            <primitive object={mats.lanternPaper} attach="material" />
          </mesh>
          {/* Bottom Wooden Collar */}
          <mesh position={[0, -0.52, 0]}>
            <cylinderGeometry args={[0.16, 0.14, 0.05, 20]} />
            <primitive object={mats.lanternWood} attach="material" />
          </mesh>
          {/* Silk Tassel */}
          <mesh position={[0, -0.66, 0]}>
            <coneGeometry args={[0.045, 0.22, 12]} />
            <primitive object={mats.pink} attach="material" />
          </mesh>
          {/* Cozy Warm Lantern Glow Light */}
          <pointLight position={[0, -0.26, 0]} intensity={10} color="#fef08a" distance={4.2} />
        </group>
      </group>

      {/* Package A: Cast-Iron Japanese Tetsubin (Tea Kettle) & Warming Stove */}
      <group ref={kettle} position={[1.9, -1.35, 0.35]}>
        {/* Stone Trivet Base */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.42, 0.46, 0.1, 24]} />
          <primitive object={mats.stone} attach="material" />
        </mesh>
        {/* Glowing Charcoal Fire Embers */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.03, 20]} />
          <primitive object={mats.coal} attach="material" />
        </mesh>
        {/* Cast-Iron Kettle Body */}
        <mesh position={[0, 0.22, 0]} scale={[1, 0.78, 1]}>
          <sphereGeometry args={[0.28, 24, 24]} />
          <primitive object={mats.iron} attach="material" />
        </mesh>
        {/* Kettle Lid & Gold Knob */}
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.15, 0.17, 0.04, 20]} />
          <primitive object={mats.iron} attach="material" />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <primitive object={mats.gold} attach="material" />
        </mesh>
        {/* Curved Pour Spout */}
        <mesh position={[0.26, 0.28, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.035, 0.055, 0.22, 14]} />
          <primitive object={mats.iron} attach="material" />
        </mesh>
        {/* Overhead Arched Iron Handle */}
        <mesh position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.24, 0.02, 10, 24, Math.PI]} />
          <primitive object={mats.iron} attach="material" />
        </mesh>

        {/* Rising Curly Steam from Kettle Spout */}
        {[0, 1, 2, 3].map((idx) => (
          <mesh
            key={idx}
            ref={(el) => {
              steamPuffsKettle.current[idx] = el;
            }}
            position={[0.34, 0.38, 0]}
          >
            <sphereGeometry args={[0.4, 12, 12]} />
            <primitive object={mats.steam} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Package A: Potted Botanical Herb Sprout & Terracotta Pot */}
      <group ref={sprout} position={[-1.85, -1.38, 0.4]}>
        {/* Terracotta Pot */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.14, 0.24, 20]} />
          <primitive object={mats.terracotta} attach="material" />
        </mesh>
        {/* Pot Rim */}
        <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.028, 10, 24]} />
          <primitive object={mats.terracotta} attach="material" />
        </mesh>
        {/* Rich Soil */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.03, 16]} />
          <primitive object={mats.dark} attach="material" />
        </mesh>
        {/* Delicate Green Sprout Stem */}
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.018, 0.025, 0.24, 10]} />
          <primitive object={mats.leafGreen} attach="material" />
        </mesh>
        {/* 3 Curved Tea Leaves */}
        {[-0.4, 0.4, 0].map((rot, i) => (
          <mesh
            key={i}
            position={[i === 0 ? -0.06 : i === 1 ? 0.06 : 0, 0.28 + i * 0.04, i === 2 ? 0.06 : 0]}
            rotation={[0.3, 0.2 + i * 0.8, rot]}
            scale={[0.8, 1.2, 0.3]}
          >
            <sphereGeometry args={[0.08, 12, 12]} />
            <primitive object={mats.leafGreen} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Polished Natural Wood Tea Stump / Log Seat */}
      <group ref={seat} position={[0, -1.5, 0]}>
        {/* Main Log Bark */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.7, 1.85, 0.65, 36]} />
          <primitive object={mats.woodBark} attach="material" />
        </mesh>
        {/* Top Growth Rings */}
        <mesh position={[0, 0.33, 0]}>
          <cylinderGeometry args={[1.68, 1.68, 0.02, 36]} />
          <primitive object={mats.woodTop} attach="material" />
        </mesh>
        {/* Cozy Woven Outer Cushion Ring */}
        <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.08, 12, 36]} />
          <primitive object={mats.accent} attach="material" />
        </mesh>
        {/* Scattered Botanical Tea Petals */}
        {[
          [0.85, 0.36, 0.6, 0.2],
          [-0.7, 0.36, 0.75, -0.4],
          [0.95, 0.36, -0.45, 0.8],
          [-0.9, 0.36, -0.5, 1.2],
        ].map(([px, py, pz, pr], idx) => (
          <mesh key={idx} position={[px, py, pz]} rotation={[0, pr, 0]} scale={[1, 0.2, 1.4]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <primitive object={mats.accent} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Celestial Crescent Moon & Star (Bedtime) */}
      <group ref={moon} position={[-2.6, 2.5, -1.5]} scale={0}>
        <mesh>
          <sphereGeometry args={[0.55, 32, 32]} />
          <primitive object={mats.moon} attach="material" />
        </mesh>
        {/* Little golden star companion */}
        <mesh position={[0.75, -0.3, 0.2]} scale={0.25}>
          <octahedronGeometry args={[0.6, 0]} />
          <primitive object={mats.gold} attach="material" />
        </mesh>
      </group>

      {/* Luxury Clawfoot Bathtub (Bath Mode) */}
      <group ref={tub} position={[0, -1.05, 0]} scale={0}>
        {/* White Porcelain Tub Body */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.8, 1.45, 0.95, 40]} />
          <primitive object={mats.ceramic} attach="material" />
        </mesh>
        {/* Rolled Porcelain Rim */}
        <mesh position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.78, 0.08, 16, 40]} />
          <primitive object={mats.white} attach="material" />
        </mesh>
        {/* Antique Gold Lion-Paw Claw Feet */}
        {[-1.25, 1.25].map((x) =>
          [-0.8, 0.8].map((z) => (
            <group key={`${x}-${z}`} position={[x * 0.9, -0.52, z * 0.9]}>
              <mesh rotation={[0, 0, 0]}>
                <sphereGeometry args={[0.13, 14, 14]} />
                <primitive object={mats.gold} attach="material" />
              </mesh>
              {[-0.04, 0, 0.04].map((tx) => (
                <mesh key={tx} position={[tx, -0.08, 0.08]} rotation={[0.4, 0, 0]}>
                  <coneGeometry args={[0.025, 0.09, 8]} />
                  <primitive object={mats.gold} attach="material" />
                </mesh>
              ))}
            </group>
          ))
        )}
        {/* Vintage Swan-Neck Gold Faucet */}
        <group position={[0, 0.65, -1.75]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.05, 0.35, 16]} />
            <primitive object={mats.gold} attach="material" />
          </mesh>
          <mesh position={[0, 0.22, 0.1]} rotation={[Math.PI / 3, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.22, 16]} />
            <primitive object={mats.gold} attach="material" />
          </mesh>
        </group>
        {/* Translucent Bath Water */}
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[1.68, 1.68, 0.04, 40]} />
          <primitive object={mats.water} attach="material" />
        </mesh>
        {/* Iridescent Foam Bubble Clusters */}
        {[
          [-0.85, 0.38, 0.55, 0.2],
          [-0.35, 0.38, -0.6, 0.24],
          [0.4, 0.38, 0.65, 0.22],
          [0.85, 0.38, -0.4, 0.18],
          [-0.1, 0.38, 0.8, 0.16],
          [0.7, 0.38, 0.35, 0.19],
        ].map(([bx, by, bz, br], idx) => (
          <mesh key={idx} position={[bx, by, bz]}>
            <sphereGeometry args={[br, 16, 16]} />
            <primitive object={mats.bubbleWhite} attach="material" />
          </mesh>
        ))}

        {/* Package D: Animated Concentric Bath Wave Ripples */}
        {[0, 1, 2].map((idx) => (
          <mesh
            key={idx}
            ref={(el) => {
              bathRipples.current[idx] = el;
            }}
            position={[1.05, 0.33, 0.7]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.08, 0.14, 32]} />
            <primitive object={mats.rippleMat} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Floating Rubber Ducky */}
      <group ref={duck} position={[1.05, -0.55, 0.7]} scale={0}>
        <mesh>
          <sphereGeometry args={[0.2, 20, 20]} />
          <primitive object={mats.duck} attach="material" />
        </mesh>
        <mesh position={[0.08, 0.15, 0.04]}>
          <sphereGeometry args={[0.13, 20, 20]} />
          <primitive object={mats.duck} attach="material" />
        </mesh>
        {/* Ducky Beak */}
        <mesh position={[0.22, 0.13, 0.04]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.065, 0.13, 16]} />
          <primitive object={mats.orange} attach="material" />
        </mesh>
        {/* Ducky Eye */}
        <mesh position={[0.12, 0.19, 0.13]} scale={0.7}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <primitive object={mats.dark} attach="material" />
        </mesh>
      </group>

      {/* Package D: Drifting Interactive Celestial Fireflies / Glowing Embers */}
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
          <pointLight color="#fef08a" intensity={0.8} distance={1.2} />
        </group>
      ))}

      {/* Main Sloth Character: Sunny */}
      <group
        ref={root}
        position={[0, -0.65, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPoke();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Sculpted Anatomical Body with Velvet Fur */}
        <group ref={body}>
          {/* Main Torso: organic pear shape with shoulders */}
          <mesh position={[0, 0.05, 0]} scale={[0.98, 1.15, 0.92]}>
            <sphereGeometry args={[1, 48, 48]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Soft Cream Fur Chest Bib */}
          <mesh position={[0, 0.02, 0.62]} scale={[0.9, 1.05, 0.45]}>
            <sphereGeometry args={[0.76, 36, 36]} />
            <primitive object={mats.belly} attach="material" />
          </mesh>
        </group>

        {/* Seated Hind Thighs and Paws */}
        {[-0.52, 0.52].map((x) => (
          <group key={x} position={[x, -0.88, 0.35]}>
            <mesh scale={[1, 0.72, 1.15]}>
              <sphereGeometry args={[0.38, 24, 24]} />
              <primitive object={mats.fur} attach="material" />
            </mesh>
            {/* 3 Little Hind Claws */}
            {[-0.08, 0, 0.08].map((cx) => (
              <mesh key={cx} position={[cx, -0.15, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.03, 0.12, 10]} />
                <primitive object={mats.claw} attach="material" />
              </mesh>
            ))}
          </group>
        ))}

        {/* Curved Sloth Forearms with Iconic Three Claws */}
        <group ref={armL} position={[-0.92, 0.52, 0.25]} rotation={[0, 0, -0.28]}>
          {/* Upper Arm & Elbow */}
          <mesh position={[0, -0.48, 0]}>
            <capsuleGeometry args={[0.16, 0.75, 12, 24]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Paw Base */}
          <mesh position={[0, -0.98, 0.04]} scale={[1, 0.8, 0.9]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* 3 Curved Keratin Claws */}
          {[-0.07, 0, 0.07].map((x) => (
            <mesh key={x} position={[x, -1.16, 0.08]} rotation={[-0.25, 0, Math.PI]}>
              <coneGeometry args={[0.035, 0.2, 12]} />
              <primitive object={mats.claw} attach="material" />
            </mesh>
          ))}
        </group>

        <group ref={armR} position={[0.92, 0.52, 0.25]} rotation={[0, 0, 0.28]}>
          {/* Upper Arm & Elbow */}
          <mesh position={[0, -0.48, 0]}>
            <capsuleGeometry args={[0.16, 0.75, 12, 24]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Paw Base */}
          <mesh position={[0, -0.98, 0.04]} scale={[1, 0.8, 0.9]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* 3 Curved Keratin Claws */}
          {[-0.07, 0, 0.07].map((x) => (
            <mesh key={x} position={[x, -1.16, 0.08]} rotation={[-0.25, 0, Math.PI]}>
              <coneGeometry args={[0.035, 0.2, 12]} />
              <primitive object={mats.claw} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Expressive Anatomical Head */}
        <group ref={head} position={[0, 1.42, 0]}>
          {/* Cranial Vault (Skull) */}
          <mesh scale={[1.08, 0.98, 1.05]}>
            <sphereGeometry args={[0.88, 48, 48]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>

          {/* Package C: Velvety Ears with Spring Physics */}
          <group ref={earL} position={[-0.76, 0.18, -0.05]} rotation={[0, -0.35, 0]}>
            <mesh scale={[1, 1.2, 0.5]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <primitive object={mats.fur} attach="material" />
            </mesh>
            <mesh position={[0.02, 0, 0.05]} scale={[0.7, 0.85, 0.4]}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <primitive object={mats.belly} attach="material" />
            </mesh>
          </group>

          <group ref={earR} position={[0.76, 0.18, -0.05]} rotation={[0, 0.35, 0]}>
            <mesh scale={[1, 1.2, 0.5]}>
              <sphereGeometry args={[0.18, 16, 16]} />
              <primitive object={mats.fur} attach="material" />
            </mesh>
            <mesh position={[-0.02, 0, 0.05]} scale={[0.7, 0.85, 0.4]}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <primitive object={mats.belly} attach="material" />
            </mesh>
          </group>

          {/* Cream Facial Heart Mask */}
          <mesh position={[0, -0.06, 0.52]} scale={[0.96, 0.82, 0.46]}>
            <sphereGeometry args={[0.82, 40, 40]} />
            <primitive object={mats.belly} attach="material" />
          </mesh>

          {/* Iconic Sloth Eye Bands and Eyes */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.44, 0.02, 0.74]}>
              {/* Slanted Eye Mask Patch */}
              <mesh rotation={[0, side * 0.15, side * -0.38]} scale={[1.1, 1.6, 0.4]}>
                <sphereGeometry args={[0.18, 24, 24]} />
                <primitive object={mats.patch} attach="material" />
              </mesh>

              {/* Eye & Pupil */}
              <group ref={side < 0 ? eyeL : eyeR} position={[0, 0, 0.04]}>
                {/* Sclera */}
                <mesh scale={[1, 1.12, 0.55]}>
                  <sphereGeometry args={[0.11, 24, 24]} />
                  <primitive object={mats.white} attach="material" />
                </mesh>
                {/* Deep Pupil */}
                <group ref={side < 0 ? pupilL : pupilR} position={[0, 0, 0.045]}>
                  <mesh scale={[1, 1.08, 0.5]}>
                    <sphereGeometry args={[0.068, 20, 20]} />
                    <primitive object={mats.dark} attach="material" />
                  </mesh>
                  {/* Soulful Dual Specular Catchlights */}
                  <mesh position={[0.024, 0.028, 0.035]}>
                    <sphereGeometry args={[0.018, 12, 12]} />
                    <primitive object={mats.white} attach="material" />
                  </mesh>
                  <mesh position={[-0.015, -0.02, 0.035]}>
                    <sphereGeometry args={[0.009, 10, 10]} />
                    <primitive object={mats.white} attach="material" />
                  </mesh>
                </group>
              </group>
            </group>
          ))}

          {/* Rounded Sloth Snout & Nose */}
          <group position={[0, -0.14, 0.96]}>
            {/* Snout Bridge */}
            <mesh position={[0, 0, -0.05]} scale={[1.1, 0.85, 0.5]}>
              <sphereGeometry args={[0.14, 20, 20]} />
              <primitive object={mats.belly} attach="material" />
            </mesh>
            {/* Black Nose */}
            <mesh scale={[1.25, 0.85, 0.75]}>
              <sphereGeometry args={[0.082, 20, 20]} />
              <primitive object={mats.nose} attach="material" />
            </mesh>
            {/* Dual Nostril Indentations */}
            {[-0.028, 0.028].map((nx) => (
              <mesh key={nx} position={[nx, -0.02, 0.055]} scale={[0.6, 1, 0.5]}>
                <sphereGeometry args={[0.014, 10, 10]} />
                <primitive object={mats.dark} attach="material" />
              </mesh>
            ))}
          </group>

          {/* Gentle Smile Line */}
          <mesh ref={smile} position={[0, -0.25, 0.94]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.125, 0.02, 10, 24, Math.PI]} />
            <primitive object={mats.dark} attach="material" />
          </mesh>

          {/* Open Mouth */}
          <mesh ref={openMouth} position={[0, -0.3, 0.91]} visible={false}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <primitive object={mats.mouth} attach="material" />
          </mesh>

          {/* Rosy Cheeks */}
          {[-0.54, 0.54].map((x) => (
            <mesh key={x} position={[x, -0.18, 0.74]} scale={[1.2, 0.75, 0.35]}>
              <sphereGeometry args={[0.11, 20, 20]} />
              <primitive object={mats.pink} attach="material" />
            </mesh>
          ))}

          {/* Velvet Nightcap (Bedtime Mode) */}
          <group ref={cap} position={[0.1, 0.78, 0]} rotation={[0, 0, -0.32]} scale={0}>
            {/* Cap Cone */}
            <mesh>
              <coneGeometry args={[0.58, 1.15, 32]} />
              <primitive object={mats.accent} attach="material" />
            </mesh>
            {/* White Trim Rim */}
            <mesh position={[0, -0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.56, 0.07, 16, 32]} />
              <primitive object={mats.white} attach="material" />
            </mesh>
            {/* Package C: Fluffy Pompom with Spring Inertia */}
            <group ref={pompom} position={[0.15, 0.65, 0]}>
              <mesh>
                <sphereGeometry args={[0.15, 20, 20]} />
                <primitive object={mats.white} attach="material" />
              </mesh>
            </group>
          </group>

          {/* Bubbly Shower Cap (Bath Mode) */}
          <group ref={showerCap} position={[0, 0.75, 0.04]} scale={0}>
            <mesh scale={[1.14, 0.58, 1.14]}>
              <sphereGeometry args={[0.82, 36, 28]} />
              <primitive object={mats.showerCapMat} attach="material" />
            </mesh>
            {/* Ruffled Shower Cap Hem */}
            <mesh position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.88, 0.06, 14, 36]} />
              <primitive object={mats.white} attach="material" />
            </mesh>
          </group>
        </group>

        {/* Vintage Ceramic Teacup & Saucer (Sipping Mode) */}
        <group ref={cup} position={[0.58, 0.92, 1.05]} scale={0}>
          {/* Saucer */}
          <mesh position={[0, -0.16, 0]}>
            <cylinderGeometry args={[0.3, 0.2, 0.03, 32]} />
            <primitive object={mats.ceramic} attach="material" />
          </mesh>
          {/* Cup Body */}
          <mesh>
            <cylinderGeometry args={[0.22, 0.16, 0.28, 32]} />
            <primitive object={mats.ceramic} attach="material" />
          </mesh>
          {/* Gold Rim */}
          <mesh position={[0, 0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.015, 12, 32]} />
            <primitive object={mats.gold} attach="material" />
          </mesh>
          {/* Steaming Botanical Tea Liquid */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.04, 32]} />
            <primitive object={mats.accent} attach="material" />
          </mesh>
          {/* Delicate Handle */}
          <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.085, 0.025, 12, 20]} />
            <primitive object={mats.ceramic} attach="material" />
          </mesh>

          {/* Rising Steam from Teacup */}
          {[0, 1, 2].map((idx) => (
            <mesh
              key={idx}
              ref={(el) => {
                steamPuffsCup.current[idx] = el;
              }}
              position={[0, 0.18, 0]}
            >
              <sphereGeometry args={[0.3, 10, 10]} />
              <primitive object={mats.steam} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Luxury Bedtime Pillow & Waffle-Knit Blanket */}
        <mesh ref={pillow} position={[0, 1.15, -0.65]} scale={0}>
          <sphereGeometry args={[0.92, 32, 32]} />
          <primitive object={mats.white} attach="material" />
        </mesh>
        <group ref={blanket} position={[0, -0.42, 0.65]} scale={0}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.58, 1.55, 16, 32]} />
            <primitive object={mats.accent} attach="material" />
          </mesh>
          {/* Turned-down Plush Trim */}
          <mesh position={[0, 0.52, 0.05]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.1, 1.5, 12, 24]} />
            <primitive object={mats.white} attach="material" />
          </mesh>
        </group>
      </group>

      {/* Radiant Golden Celestial Sparkles */}
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
            : '#fef08a'
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
