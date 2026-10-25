'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
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
}

const damp = THREE.MathUtils.damp;
const CANDY = ['#ff6b9d', '#ffd93d', '#6bcbff', '#9b8cff', '#7dffb3', '#ff9a5a'];

// Floating decorations: [x, y, z, shape, colorIndex, size]
const DECOR: [number, number, number, 'ico' | 'octa' | 'torus' | 'bubble', number, number][] = [
  [-3.1, 1.6, -0.5, 'ico', 0, 0.3],
  [3.0, 1.9, -0.8, 'octa', 1, 0.32],
  [-2.8, -0.4, 0.2, 'torus', 2, 0.26],
  [3.2, 0.2, 0.3, 'ico', 3, 0.26],
  [-1.9, 2.6, -1.2, 'bubble', 4, 0.28],
  [2.1, 2.7, -1.0, 'torus', 5, 0.24],
  [-3.4, 0.7, -1, 'octa', 3, 0.22],
  [3.5, 1.0, -1.2, 'bubble', 2, 0.3],
];

function Pet({ mood, furColor, accentColor, pokeCount, onPoke }: SlothPet3DProps) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
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
  const blanket = useRef<THREE.Mesh>(null);
  const pillow = useRef<THREE.Mesh>(null);
  const moon = useRef<THREE.Mesh>(null);
  const ambient = useRef<THREE.AmbientLight>(null);

  const lastPoke = useRef(pokeCount);
  const squash = useRef(0);
  const nextBlink = useRef(2);
  const blinkUntil = useRef(0);

  // Shared materials so the fur and accent colors can glide to new values
  const mats = useMemo(
    () => ({
      fur: new THREE.MeshStandardMaterial({ roughness: 0.85 }),
      belly: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
      patch: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
      accent: new THREE.MeshStandardMaterial({ roughness: 0.6, emissiveIntensity: 0.25 }),
      white: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 }),
      dark: new THREE.MeshStandardMaterial({ color: '#2b1d3a', roughness: 0.4 }),
      pink: new THREE.MeshStandardMaterial({ color: '#ff9ec4', roughness: 0.8, emissive: '#ff6fa5', emissiveIntensity: 0.25 }),
      claw: new THREE.MeshStandardMaterial({ color: '#fff4d6', roughness: 0.5 }),
      mouth: new THREE.MeshStandardMaterial({ color: '#7a1f3d', roughness: 0.6 }),
      moon: new THREE.MeshStandardMaterial({ color: '#fff3b0', emissive: '#ffe680', emissiveIntensity: 1.2 }),
      water: new THREE.MeshStandardMaterial({ color: '#4dc3ff', roughness: 0.1, transparent: true, opacity: 0.82, emissive: '#1692ff', emissiveIntensity: 0.25 }),
      duck: new THREE.MeshStandardMaterial({ color: '#ffd000', roughness: 0.4 }),
      orange: new THREE.MeshStandardMaterial({ color: '#ff6600', roughness: 0.5 }),
      bubbleWhite: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.15, transparent: true, opacity: 0.9 }),
      showerCapMat: new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.4, emissive: '#0284c7', emissiveIntensity: 0.2 }),
    }),
    []
  );
  const furTarget = useMemo(() => new THREE.Color(furColor), [furColor]);
  const accentTarget = useMemo(() => new THREE.Color(accentColor), [accentColor]);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock, pointer }, dt) => {
    const t = clock.elapsedTime;
    const sleeping = mood === 'sleeping';
    const happy = mood === 'happy';
    const talking = mood === 'talking';
    const eating = mood === 'eating';
    const bathing = mood === 'bathing';
    const playing = mood === 'playing';

    // Colors glide toward their targets
    mats.fur.color.lerp(furTarget, 0.1);
    mats.belly.color.copy(mats.fur.color).lerp(tmp.set('#ffffff'), 0.6);
    mats.patch.color.copy(mats.fur.color).multiplyScalar(0.45);
    mats.accent.color.lerp(accentTarget, 0.1);
    mats.accent.emissive.copy(mats.accent.color);

    // Poke: squash and wobble
    if (pokeCount !== lastPoke.current) {
      lastPoke.current = pokeCount;
      squash.current = 1;
    }
    squash.current = Math.max(0, squash.current - dt * 1.8);
    const s = squash.current;
    const wobble = Math.sin((1 - s) * 16) * s;

    if (root.current) {
      const hop = (happy || playing) ? Math.abs(Math.sin(t * (playing ? 4.5 : 3.2))) * 0.28 : 0;
      const bathBob = bathing ? Math.sin(t * 2.2) * 0.08 - 0.25 : 0;
      root.current.position.y = damp(root.current.position.y, (sleeping ? -0.2 : 0) + hop + bathBob + s * 0.12, 8, dt);
      root.current.scale.set(1 - wobble * 0.08, 1 + wobble * 0.14, 1 - wobble * 0.08);
      root.current.rotation.z = damp(root.current.rotation.z, sleeping ? 0.1 : (playing ? Math.sin(t * 3.5) * 0.08 : Math.sin(t * 1.3) * 0.02), 4, dt);
    }
    if (body.current) {
      const breath = Math.sin(t * (sleeping ? 1.1 : 1.9)) * 0.025;
      body.current.scale.set(1 + breath, 1.05 + breath * 1.4, 0.95 + breath);
    }

    // Head follows the finger unless asleep
    if (head.current) {
      head.current.rotation.y = damp(head.current.rotation.y, sleeping ? 0 : (bathing ? Math.sin(t * 1.5) * 0.15 : pointer.x * 0.4), 5, dt);
      head.current.rotation.x = damp(head.current.rotation.x, sleeping ? 0.3 : (bathing ? -0.1 : -pointer.y * 0.22), 5, dt);
      head.current.position.y = 1.45 + Math.sin(t * 1.9) * 0.015;
    }

    // Blinking and sleepy eyes
    if (t > nextBlink.current) {
      blinkUntil.current = t + 0.14;
      nextBlink.current = t + 2.5 + ((Math.sin(t * 12.9898) + 1) / 2) * 2.5;
    }
    const closed = sleeping || (bathing && Math.sin(t * 1.5) > 0.3) ? 1 : (t < blinkUntil.current ? 1 : 0);
    [eyeL, eyeR].forEach((e) => {
      if (e.current) e.current.scale.y = damp(e.current.scale.y, 1 - 0.93 * closed, 30, dt);
    });
    [pupilL, pupilR].forEach((p) => {
      if (p.current) {
        p.current.position.x = damp(p.current.position.x, pointer.x * 0.035, 8, dt);
        p.current.position.y = damp(p.current.position.y, pointer.y * 0.03, 8, dt);
      }
    });

    // Mouth: smile at rest, open when talking, eating or cheering
    const open = talking ? 0.35 + 0.65 * Math.abs(Math.sin(t * 16)) : eating ? 0.5 : (happy || playing) ? 0.45 : bathing ? 0.2 : 0;
    if (smile.current) smile.current.visible = open < 0.08;
    if (openMouth.current) {
      openMouth.current.visible = open >= 0.08;
      openMouth.current.scale.set(1, 0.3 + open * 0.9, 1);
    }

    // Arms
    if (armL.current) {
      const targetL = playing
        ? -2.1 + Math.sin(t * 6) * 0.3
        : bathing
        ? -0.55 + Math.sin(t * 3.5) * 0.18
        : talking
        ? -0.9 + Math.sin(t * 6) * 0.25
        : -0.28;
      armL.current.rotation.z = damp(armL.current.rotation.z, targetL, 6, dt);
    }
    if (armR.current) {
      const targetR = playing
        ? 2.1 - Math.cos(t * 6) * 0.3
        : bathing
        ? 0.55 - Math.cos(t * 3.5) * 0.18
        : happy
        ? 2.3 + Math.sin(t * 8) * 0.35
        : eating
        ? 1.7
        : talking
        ? 0.9 - Math.sin(t * 5) * 0.25
        : 0.28;
      armR.current.rotation.z = damp(armR.current.rotation.z, targetR, 6, dt);
    }

    // Props pop in and out
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

    if (cup.current) cup.current.position.y = 0.95 + Math.sin(t * 3) * 0.08;
    if (duck.current) {
      duck.current.position.y = -0.55 + Math.sin(t * 3.5) * 0.06;
      duck.current.rotation.y = Math.sin(t * 1.8) * 0.3;
    }

    if (ambient.current) ambient.current.intensity = damp(ambient.current.intensity, sleeping ? 0.55 : 1.15, 3, dt);
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={1.15} />
      <directionalLight position={[3, 5, 6]} intensity={1.6} />
      <pointLight position={[-4, 2, 3]} intensity={25} color="#ff9ad5" />
      <pointLight position={[4, 1, 2]} intensity={20} color="#7fd8ff" />

      {/* Cozy rug */}
      <mesh position={[0, -1.78, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[2.3, 2.3, 0.1, 48]} />
        <primitive object={mats.accent} attach="material" />
      </mesh>
      <mesh position={[0, -1.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.95, 0.05, 8, 48]} />
        <primitive object={mats.white} attach="material" />
      </mesh>

      {/* Moon appears at bedtime */}
      <mesh ref={moon} position={[-2.7, 2.4, -1.5]} scale={0}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <primitive object={mats.moon} attach="material" />
      </mesh>

      {/* Bathtub and Water */}
      <group ref={tub} position={[0, -1.05, 0]} scale={0}>
        {/* Outer Tub rim */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[1.75, 1.45, 0.9, 36]} />
          <primitive object={mats.white} attach="material" />
        </mesh>
        {/* Tub inner water surface */}
        <mesh position={[0, 0.32, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[1.65, 1.65, 0.05, 36]} />
          <primitive object={mats.water} attach="material" />
        </mesh>
        {/* Foamy Soap Bubbles on water surface */}
        {[-0.9, -0.4, 0.3, 0.8, -0.1].map((bx, idx) => (
          <mesh key={idx} position={[bx, 0.38, (idx % 2 === 0 ? 0.6 : -0.5)]}>
            <sphereGeometry args={[0.18 + (idx % 3) * 0.06, 16, 16]} />
            <primitive object={mats.bubbleWhite} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Floating Rubber Ducky for bath time */}
      <group ref={duck} position={[1.05, -0.55, 0.7]} scale={0}>
        <mesh>
          <sphereGeometry args={[0.22, 16, 16]} />
          <primitive object={mats.duck} attach="material" />
        </mesh>
        <mesh position={[0.08, 0.16, 0.05]}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <primitive object={mats.duck} attach="material" />
        </mesh>
        {/* Beak */}
        <mesh position={[0.24, 0.14, 0.05]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.07, 0.14, 12]} />
          <primitive object={mats.orange} attach="material" />
        </mesh>
        {/* Eye */}
        <mesh position={[0.13, 0.2, 0.14]} scale={0.7}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <primitive object={mats.dark} attach="material" />
        </mesh>
      </group>

      <group
        ref={root}
        position={[0, -0.7, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          onPoke();
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Body */}
        <mesh ref={body}>
          <sphereGeometry args={[1, 40, 40]} />
          <primitive object={mats.fur} attach="material" />
        </mesh>
        <mesh position={[0, -0.1, 0.62]} scale={[1, 1, 0.55]}>
          <sphereGeometry args={[0.74, 32, 32]} />
          <primitive object={mats.belly} attach="material" />
        </mesh>

        {/* Legs */}
        {[-0.5, 0.5].map((x) => (
          <mesh key={x} position={[x, -0.95, 0.3]} scale={[1, 0.7, 1.2]}>
            <sphereGeometry args={[0.36, 24, 24]} />
            <primitive object={mats.patch} attach="material" />
          </mesh>
        ))}

        {/* Arms with claws */}
        <group ref={armL} position={[-0.95, 0.45, 0.3]} rotation={[0, 0, -0.28]}>
          <mesh position={[0, -0.5, 0]}>
            <capsuleGeometry args={[0.17, 0.75, 8, 16]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {[-0.08, 0, 0.08].map((x) => (
            <mesh key={x} position={[x, -1.12, 0.05]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.04, 0.18, 8]} />
              <primitive object={mats.claw} attach="material" />
            </mesh>
          ))}
        </group>
        <group ref={armR} position={[0.95, 0.45, 0.3]} rotation={[0, 0, 0.28]}>
          <mesh position={[0, -0.5, 0]}>
            <capsuleGeometry args={[0.17, 0.75, 8, 16]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {[-0.08, 0, 0.08].map((x) => (
            <mesh key={x} position={[x, -1.12, 0.05]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.04, 0.18, 8]} />
              <primitive object={mats.claw} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Head */}
        <group ref={head} position={[0, 1.45, 0.15]}>
          <mesh>
            <sphereGeometry args={[0.85, 40, 40]} />
            <primitive object={mats.fur} attach="material" />
          </mesh>
          {/* Little ears */}
          {[-0.72, 0.72].map((x) => (
            <mesh key={x} position={[x, 0.2, 0]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <primitive object={mats.patch} attach="material" />
            </mesh>
          ))}
          {/* Cream face mask */}
          <mesh position={[0, -0.05, 0.5]} scale={[0.95, 0.78, 0.5]}>
            <sphereGeometry args={[0.85, 32, 32]} />
            <primitive object={mats.belly} attach="material" />
          </mesh>
          {/* Eye patches, eyes, pupils and sparkles */}
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 0.34, 0.1, 0.84]}>
              <mesh rotation={[0, 0, side * -0.35]} scale={[1, 1.5, 0.45]}>
                <sphereGeometry args={[0.17, 20, 20]} />
                <primitive object={mats.patch} attach="material" />
              </mesh>
              <group ref={side < 0 ? eyeL : eyeR} position={[0, 0, 0.04]}>
                <mesh scale={[1, 1.15, 0.6]}>
                  <sphereGeometry args={[0.115, 20, 20]} />
                  <primitive object={mats.white} attach="material" />
                </mesh>
                <group ref={side < 0 ? pupilL : pupilR} position={[0, 0, 0.05]}>
                  <mesh scale={[1, 1.1, 0.6]}>
                    <sphereGeometry args={[0.07, 16, 16]} />
                    <primitive object={mats.dark} attach="material" />
                  </mesh>
                  <mesh position={[0.025, 0.03, 0.04]}>
                    <sphereGeometry args={[0.02, 10, 10]} />
                    <primitive object={mats.white} attach="material" />
                  </mesh>
                </group>
              </group>
            </group>
          ))}
          {/* Nose, smile, open mouth, cheeks */}
          <mesh position={[0, -0.12, 0.98]} scale={[1.3, 0.9, 0.8]}>
            <sphereGeometry args={[0.085, 16, 16]} />
            <primitive object={mats.dark} attach="material" />
          </mesh>
          <mesh ref={smile} position={[0, -0.24, 0.96]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.13, 0.022, 8, 20, Math.PI]} />
            <primitive object={mats.dark} attach="material" />
          </mesh>
          <mesh ref={openMouth} position={[0, -0.3, 0.93]} visible={false}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <primitive object={mats.mouth} attach="material" />
          </mesh>
          {[-0.52, 0.52].map((x) => (
            <mesh key={x} position={[x, -0.2, 0.74]} scale={[1.2, 0.8, 0.4]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <primitive object={mats.pink} attach="material" />
            </mesh>
          ))}

          {/* Nightcap with a pompom for sleeping */}
          <group ref={cap} position={[0.1, 0.78, 0]} rotation={[0, 0, -0.35]} scale={0}>
            <mesh>
              <coneGeometry args={[0.6, 1.1, 24]} />
              <primitive object={mats.accent} attach="material" />
            </mesh>
            <mesh position={[0.12, 0.62, 0]}>
              <sphereGeometry args={[0.14, 16, 16]} />
              <primitive object={mats.white} attach="material" />
            </mesh>
          </group>

          {/* Bubbly shower cap for bath time */}
          <group ref={showerCap} position={[0, 0.75, 0.05]} scale={0}>
            <mesh scale={[1.12, 0.6, 1.12]}>
              <sphereGeometry args={[0.82, 32, 24]} />
              <primitive object={mats.showerCapMat} attach="material" />
            </mesh>
            {/* Suds on the cap */}
            {[-0.3, 0.3, 0].map((bx, i) => (
              <mesh key={i} position={[bx, 0.5, (i === 2 ? 0.3 : 0)]}>
                <sphereGeometry args={[0.16, 14, 14]} />
                <primitive object={mats.bubbleWhite} attach="material" />
              </mesh>
            ))}
          </group>
        </group>

        {/* Teacup for sipping */}
        <group ref={cup} position={[0.62, 0.95, 1.1]} scale={0}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.16, 0.26, 24]} />
            <primitive object={mats.white} attach="material" />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.19, 0.19, 0.04, 24]} />
            <primitive object={mats.accent} attach="material" />
          </mesh>
          <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.08, 0.025, 8, 16]} />
            <primitive object={mats.white} attach="material" />
          </mesh>
        </group>

        {/* Pillow and blanket for bedtime */}
        <mesh ref={pillow} position={[0, 1.2, -0.7]} scale={0}>
          <sphereGeometry args={[0.9, 24, 24]} />
          <primitive object={mats.white} attach="material" />
        </mesh>
        <mesh ref={blanket} position={[0, -0.45, 0.6]} rotation={[0, 0, Math.PI / 2]} scale={0}>
          <capsuleGeometry args={[0.55, 1.5, 12, 24]} />
          <primitive object={mats.accent} attach="material" />
        </mesh>
      </group>

      {/* Floating candy decorations */}
      {DECOR.map(([x, y, z, shape, ci, size], i) => (
        <Float key={i} speed={1.4 + (i % 3) * 0.4} rotationIntensity={1.2} floatIntensity={1.4}>
          <mesh position={[x, y, z]}>
            {shape === 'ico' && <icosahedronGeometry args={[size, 0]} />}
            {shape === 'octa' && <octahedronGeometry args={[size, 0]} />}
            {shape === 'torus' && <torusGeometry args={[size, size * 0.35, 12, 24]} />}
            {shape === 'bubble' && <sphereGeometry args={[size, 24, 24]} />}
            <meshStandardMaterial
              color={CANDY[ci]}
              emissive={CANDY[ci]}
              emissiveIntensity={0.35}
              roughness={0.35}
              transparent={shape === 'bubble'}
              opacity={shape === 'bubble' ? 0.7 : 1}
            />
          </mesh>
        </Float>
      ))}

      <Sparkles
        count={mood === 'sleeping' ? 28 : (mood === 'bathing' ? 60 : 45)}
        scale={[7, 5, 3]}
        size={mood === 'sleeping' ? 3 : (mood === 'bathing' ? 6 : 5)}
        speed={mood === 'bathing' ? 0.7 : 0.4}
        color={mood === 'sleeping' ? '#cfe0ff' : (mood === 'bathing' ? '#a5f3fc' : '#fff1a8')}
      />
    </>
  );
}

export default function SlothPet3D(props: SlothPet3DProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.3, 9.6], fov: 36 }}
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
