'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, Torus, Cylinder, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface CosmicVat3DProps {
  status: 'idle' | 'brewing' | 'ready';
  primaryColor?: string;
  secondaryColor?: string;
}

// 3D Orbiting Elemental Runes / Crystals
function OrbitingCrystals({ count = 6, speed = 1, color = '#38bdf8' }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.6 * speed;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.2;
    }
  });

  const crystals = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2.4;
      return {
        position: [Math.cos(angle) * radius, (Math.sin(i * 1.5) * 0.4), Math.sin(angle) * radius] as [number, number, number],
      };
    });
  }, [count]);

  return (
    <group ref={groupRef}>
      {crystals.map((c, idx) => (
        <mesh key={idx} position={c.position}>
          <octahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.8}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// 3D Crucible Vessel with Distorted Boiling Fluid and Rune Rings
function Crucible({ status, primaryColor = '#a855f7', secondaryColor = '#38bdf8' }: CosmicVat3DProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const outerRing1Ref = useRef<THREE.Mesh>(null);
  const outerRing2Ref = useRef<THREE.Mesh>(null);
  const basePedestalRef = useRef<THREE.Group>(null);

  const isBrewing = status === 'brewing';
  const isReady = status === 'ready';
  const speed = isBrewing ? 3.0 : isReady ? 1.4 : 0.8;

  const coreColor = useMemo(() => {
    if (isReady) return '#10b981';
    if (isBrewing) return '#ec4899';
    return primaryColor || '#8b5cf6';
  }, [isReady, isBrewing, primaryColor]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (outerRing1Ref.current) {
      outerRing1Ref.current.rotation.z += delta * 0.5 * speed;
      outerRing1Ref.current.rotation.x += delta * 0.3 * speed;
    }
    if (outerRing2Ref.current) {
      outerRing2Ref.current.rotation.y -= delta * 0.7 * speed;
      outerRing2Ref.current.rotation.z += delta * 0.4 * speed;
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * (isBrewing ? 7 : 2.5)) * (isBrewing ? 0.08 : 0.03);
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[0, -0.3, 0]}>
      {/* Heavy Cyberpunk Base Pedestal */}
      <group ref={basePedestalRef}>
        <Cylinder args={[1.5, 1.8, 0.3, 32]} position={[0, -0.9, 0]}>
          <meshStandardMaterial color="#050816" metalness={0.95} roughness={0.15} />
        </Cylinder>
        {/* Glowing Base Energy Ring */}
        <Torus args={[1.55, 0.04, 16, 64]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
          <meshStandardMaterial color={coreColor} emissive={coreColor} emissiveIntensity={isBrewing ? 2.5 : 1.2} />
        </Torus>
      </group>

      {/* Main Obsidian Crucible Cauldron */}
      <Cylinder args={[1.25, 0.85, 1.6, 48]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#0a0f24"
          roughness={0.2}
          metalness={0.9}
          wireframe={isBrewing}
        />
      </Cylinder>

      {/* Chrome Rim Flange */}
      <Torus args={[1.3, 0.09, 16, 64]} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.8, 0]}>
        <meshStandardMaterial color="#6366f1" metalness={0.95} roughness={0.1} />
      </Torus>

      {/* 3D Distorted Boiling Cosmic Plasma Fluid */}
      <Sphere ref={coreRef} args={[1.05, 48, 48]} position={[0, 0.45, 0]}>
        <MeshDistortMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={isBrewing ? 2.5 : isReady ? 3.0 : 1.1}
          distort={isBrewing ? 0.45 : 0.2}
          speed={isBrewing ? 4.5 : 1.5}
          roughness={0.1}
          metalness={0.6}
        />
      </Sphere>

      {/* Floating Holographic Gyroscope Ring 1 */}
      <mesh ref={outerRing1Ref}>
        <torusGeometry args={[1.8, 0.035, 16, 80]} />
        <meshStandardMaterial
          color={secondaryColor}
          emissive={secondaryColor}
          emissiveIntensity={isBrewing ? 2.2 : 0.8}
        />
      </mesh>

      {/* Floating Holographic Gyroscope Ring 2 */}
      <mesh ref={outerRing2Ref}>
        <torusGeometry args={[2.1, 0.025, 16, 80]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={isBrewing ? 2.5 : 0.9}
        />
      </mesh>

      {/* Orbiting Resonant Crystals */}
      <OrbitingCrystals
        count={isBrewing ? 8 : 5}
        speed={speed}
        color={isReady ? '#34d399' : isBrewing ? '#f43f5e' : secondaryColor}
      />
    </group>
  );
}

// 3D Ascending Steam & Stardust Particle Column
function VolumetricStardust({ status }: { status: 'idle' | 'brewing' | 'ready' }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = status === 'brewing' ? 600 : 350;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 0.2 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      const y = -1.2 + Math.random() * 3.8;
      pos[i * 3] = Math.cos(theta) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * radius;

      col[i * 3] = 0.5 + Math.random() * 0.5;
      col[i * 3 + 1] = 0.2 + Math.random() * 0.6;
      col[i * 3 + 2] = 0.95;
    }
    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      const speed = status === 'brewing' ? 2.2 : 0.6;
      pointsRef.current.rotation.y += delta * speed;
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += delta * (status === 'brewing' ? 1.2 : 0.4);
        if (positions[i] > 2.6) positions[i] = -1.2;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={status === 'brewing' ? 0.08 : 0.05}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function CosmicVat3D({
  status,
  primaryColor = '#a855f7',
  secondaryColor = '#38bdf8',
}: CosmicVat3DProps) {
  return (
    <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden bg-gradient-to-b from-indigo-950/40 via-slate-950/80 to-black/90 border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.25)] backdrop-blur-xl">
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 1.4, 4.8], fov: 45 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 5, 4]} intensity={1.5} color="#c084fc" />
        <pointLight
          position={[0, 1.5, 0]}
          intensity={status === 'brewing' ? 4.5 : 2.0}
          color={status === 'ready' ? '#34d399' : status === 'brewing' ? '#f43f5e' : primaryColor}
        />
        <pointLight position={[-4, -2, -3]} intensity={1.0} color="#38bdf8" />

        <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.4}>
          <Crucible status={status} primaryColor={primaryColor} secondaryColor={secondaryColor} />
          <VolumetricStardust status={status} />
        </Float>
      </Canvas>

      {/* Cyberpunk Holographic HUD Markers */}
      <div className="absolute top-3 left-4 pointer-events-none flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-700/60 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          QUANTUM CRUCIBLE 3D • ACTIVE
        </span>
      </div>

      <div className="absolute top-3 right-4 pointer-events-none text-[10px] font-mono text-purple-300/70 bg-purple-950/60 px-2.5 py-1 rounded-full border border-purple-800/40">
        INTERACTION: DRAG TO ROTATE
      </div>
    </div>
  );
}
