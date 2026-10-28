'use client';

import * as THREE from 'three';
import { type HatId, type GlassesId, type NeckwearId } from '@/lib/wardrobe';

interface WardrobeHatProps {
  hat: HatId;
  isBathing?: boolean;
  accentColor?: string;
}

export function WardrobeHat({ hat, isBathing, accentColor = '#8b5cf6' }: Readonly<WardrobeHatProps>) {
  // If Sunny is in the bath, the shower cap takes over the head!
  if (isBathing || hat === 'none') return null;

  if (hat === 'wizard') {
    return (
      <group position={[0, 0.72, 0]} rotation={[-0.1, 0, 0]}>
        {/* Wide Brim */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.82, 0.82, 0.04, 32]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.45} />
        </mesh>
        {/* Cone Spire */}
        <mesh position={[0, 0.58, -0.04]} rotation={[-0.08, 0, 0]}>
          <coneGeometry args={[0.54, 1.2, 32]} />
          <meshStandardMaterial color="#312e81" roughness={0.45} />
        </mesh>
        {/* Gold Belt Band */}
        <mesh position={[0, 0.1, -0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.04, 12, 32]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Moon Buckle */}
        <mesh position={[0, 0.16, 0.51]} scale={[1, 1, 0.4]}>
          <torusGeometry args={[0.08, 0.024, 12, 24, Math.PI * 1.3]} />
          <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={0.6} />
        </mesh>
        {/* Floating Magic Star on Tip */}
        <mesh position={[0, 1.22, -0.08]} scale={0.75}>
          <octahedronGeometry args={[0.11, 0]} />
          <meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={0.9} />
        </mesh>
      </group>
    );
  }

  if (hat === 'crown') {
    return (
      <group position={[0, 0.76, 0]}>
        {/* Golden Base Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.54, 0.048, 16, 32]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Coronet Flared Wall */}
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.62, 0.52, 0.26, 5, 1, true]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.88} roughness={0.18} side={THREE.DoubleSide} />
        </mesh>
        {/* 5 Jewel Studs on Peaks */}
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i * Math.PI * 2) / 5;
          const r = 0.62;
          const isRuby = i % 2 === 0;
          return (
            <group key={i} position={[r * Math.sin(a), 0.32, r * Math.cos(a)]}>
              <mesh>
                <sphereGeometry args={[0.055, 12, 12]} />
                <meshStandardMaterial
                  color={isRuby ? '#ef4444' : '#3b82f6'}
                  emissive={isRuby ? '#dc2626' : '#1d4ed8'}
                  emissiveIntensity={0.5}
                  roughness={0.15}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  if (hat === 'sakura') {
    return (
      <group position={[0, 0.72, 0.05]} rotation={[0.18, 0, 0]}>
        {/* Woven Vine Garland */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.038, 12, 32]} />
          <meshStandardMaterial color="#16a34a" roughness={0.6} />
        </mesh>
        {/* 8 Delicate Cherry Blossom Flowers */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i * Math.PI * 2) / 8;
          const r = 0.62;
          return (
            <group key={i} position={[r * Math.sin(a), 0.02, r * Math.cos(a)]} rotation={[0, -a, 0]}>
              {[0, 1, 2, 3, 4].map((p) => {
                const pa = (p * Math.PI * 2) / 5;
                return (
                  <mesh key={p} position={[0.045 * Math.sin(pa), 0.045 * Math.cos(pa), 0.02]} scale={[0.85, 1.1, 0.3]}>
                    <sphereGeometry args={[0.035, 10, 10]} />
                    <meshStandardMaterial color="#fbcfe8" roughness={0.35} />
                  </mesh>
                );
              })}
              {/* Golden Stamen center */}
              <mesh position={[0, 0, 0.025]}>
                <sphereGeometry args={[0.022, 10, 10]} />
                <meshStandardMaterial color="#fde047" emissive="#facc15" emissiveIntensity={0.5} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  if (hat === 'chef') {
    return (
      <group position={[0, 0.74, 0]}>
        {/* Headband */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.55, 0.58, 0.15, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.35} />
        </mesh>
        {/* Puffy Baker Mushroom Dome */}
        <mesh position={[0, 0.38, 0]} scale={[1.2, 0.85, 1.2]}>
          <sphereGeometry args={[0.58, 24, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.35} />
        </mesh>
        {/* Embroidered Green Tea Leaf Emblem on front */}
        <mesh position={[0, 0.08, 0.58]} rotation={[0, 0, 0.2]} scale={[1, 1.5, 0.3]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color="#16a34a" roughness={0.3} />
        </mesh>
      </group>
    );
  }

  if (hat === 'beanie') {
    return (
      <group position={[0, 0.74, 0]}>
        {/* Folded Beanie Cuff */}
        <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.62, 0.085, 16, 32]} />
          <meshStandardMaterial color="#ec4899" roughness={0.65} />
        </mesh>
        {/* Warm Beanie Cap Dome */}
        <mesh position={[0, 0.24, 0]} scale={[1.05, 0.74, 1.05]}>
          <sphereGeometry args={[0.62, 28, 28]} />
          <meshStandardMaterial color="#f472b6" roughness={0.65} />
        </mesh>
        {/* Fluffy Pom-Pom */}
        <mesh position={[0, 0.72, -0.04]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  if (hat === 'nightcap') {
    return (
      <group position={[0.08, 0.74, 0]} rotation={[0, 0, -0.32]}>
        <mesh>
          <coneGeometry args={[0.56, 1.15, 32]} />
          <meshStandardMaterial color={accentColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.54, 0.065, 16, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0.14, 0.62, 0]}>
          <sphereGeometry args={[0.14, 20, 20]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
      </group>
    );
  }

  return null;
}

interface WardrobeGlassesProps {
  glasses: GlassesId;
}

export function WardrobeGlasses({ glasses }: Readonly<WardrobeGlassesProps>) {
  if (glasses === 'none') return null;

  if (glasses === 'glasses') {
    return (
      <group position={[0, 0.03, 0.78]}>
        {/* Left & Right Round Gold Wire Frames */}
        {[-0.38, 0.38].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh>
              <torusGeometry args={[0.18, 0.02, 12, 28]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Reflective Glass Lens */}
            <mesh position={[0, 0, 0.005]}>
              <cylinderGeometry args={[0.175, 0.175, 0.008, 24]} />
              <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.35} roughness={0.08} transmission={0.9} />
            </mesh>
          </group>
        ))}
        {/* Nose Bridge */}
        <mesh position={[0, 0.015, -0.01]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.22, 10]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Wire Temples */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.58, 0.02, -0.16]} rotation={[0, s * 0.25, 0]}>
            <boxGeometry args={[0.015, 0.015, 0.35]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
          </mesh>
        ))}
      </group>
    );
  }

  if (glasses === 'sunglasses') {
    return (
      <group position={[0, 0.03, 0.8]}>
        {[-0.38, 0.38].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            {/* Star Rims */}
            <mesh scale={[1.2, 1.2, 0.3]}>
              <octahedronGeometry args={[0.18, 0]} />
              <meshStandardMaterial color="#ec4899" roughness={0.25} />
            </mesh>
            {/* Dark Mirrored Lens */}
            <mesh position={[0, 0, 0.02]} scale={[1.05, 1.05, 0.2]}>
              <octahedronGeometry args={[0.16, 0]} />
              <meshStandardMaterial color="#09090b" roughness={0.1} metalness={0.9} />
            </mesh>
          </group>
        ))}
        {/* Bridge */}
        <mesh position={[0, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.24, 10]} />
          <meshStandardMaterial color="#ec4899" roughness={0.25} />
        </mesh>
      </group>
    );
  }

  if (glasses === 'sleepmask') {
    return (
      <group position={[0, 0.44, 0.72]} rotation={[0.35, 0, 0]}>
        {/* Lavender Silk Padded Mask */}
        <mesh scale={[1.8, 0.7, 0.28]}>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial color="#c084fc" roughness={0.5} />
        </mesh>
        {/* Elastic Headband */}
        <mesh position={[0, 0, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.66, 0.03, 12, 32]} />
          <meshStandardMaterial color="#a855f7" roughness={0.5} />
        </mesh>
        {/* Embroidered Sleeping Lashes */}
        {[-0.24, 0.24].map((x) => (
          <mesh key={x} position={[x, -0.02, 0.1]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.07, 0.012, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#4c1d95" roughness={0.3} />
          </mesh>
        ))}
      </group>
    );
  }

  if (glasses === 'monocle') {
    return (
      <group position={[0.38, 0.03, 0.78]}>
        {/* Gold Rim */}
        <mesh>
          <torusGeometry args={[0.18, 0.022, 12, 28]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Glass Lens */}
        <mesh position={[0, 0, 0.005]}>
          <cylinderGeometry args={[0.175, 0.175, 0.008, 24]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.35} roughness={0.08} transmission={0.9} />
        </mesh>
        {/* Dangling Golden Chain */}
        <mesh position={[0.14, -0.22, -0.02]} rotation={[0, 0, 0.2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.32, 8]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  return null;
}

interface WardrobeNeckProps {
  neck: NeckwearId;
}

export function WardrobeNeck({ neck }: Readonly<WardrobeNeckProps>) {
  if (neck === 'none') return null;

  if (neck === 'bowtie') {
    return (
      <group position={[0, -0.42, 0.36]}>
        {/* Crimson Knot */}
        <mesh scale={[1, 0.85, 0.6]}>
          <sphereGeometry args={[0.075, 14, 14]} />
          <meshStandardMaterial color="#dc2626" roughness={0.35} />
        </mesh>
        {/* Left & Right Bow Wings */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.15, 0, 0]} rotation={[0, 0, s * -0.25]} scale={[1.5, 0.85, 0.5]}>
            <coneGeometry args={[0.12, 0.24, 4]} />
            <meshStandardMaterial color="#ef4444" roughness={0.35} />
          </group>
        ))}
        {/* Golden Pin */}
        <mesh position={[0, 0, 0.045]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  if (neck === 'scarf') {
    return (
      <group position={[0, -0.38, 0.15]}>
        {/* Wrapped Scarf Torus */}
        <mesh rotation={[Math.PI / 2 + 0.1, 0, 0]}>
          <torusGeometry args={[0.54, 0.13, 16, 32]} />
          <meshStandardMaterial color="#ea580c" roughness={0.7} />
        </mesh>
        {/* Ivory Accent Ring */}
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2 + 0.1, 0, 0]}>
          <torusGeometry args={[0.545, 0.04, 12, 32]} />
          <meshStandardMaterial color="#fef3c7" roughness={0.7} />
        </mesh>
        {/* Hanging Scarf Tail */}
        <group position={[-0.32, -0.36, 0.35]} rotation={[0.2, 0.1, 0.15]}>
          <mesh scale={[0.8, 1.4, 0.2]}>
            <boxGeometry args={[0.22, 0.5, 0.1]} />
            <meshStandardMaterial color="#ea580c" roughness={0.7} />
          </mesh>
          {/* Fringe Tassels */}
          {[-0.07, 0, 0.07].map((fx) => (
            <mesh key={fx} position={[fx, -0.38, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.1, 6]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.8} />
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  if (neck === 'bell') {
    return (
      <group position={[0, -0.36, 0.15]}>
        {/* Velvet Ribbon Collar */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.038, 12, 32]} />
          <meshStandardMaterial color="#6b21a8" roughness={0.5} />
        </mesh>
        {/* Golden Jingle Bell */}
        <group position={[0, -0.12, 0.54]}>
          <mesh>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.88} roughness={0.2} />
          </mesh>
          {/* Loop Ring */}
          <mesh position={[0, 0.09, 0]}>
            <torusGeometry args={[0.03, 0.01, 8, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Sound Slit */}
          <mesh position={[0, -0.04, 0.08]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 0.09, 6]} />
            <meshStandardMaterial color="#78350f" roughness={0.5} />
          </mesh>
        </group>
      </group>
    );
  }

  if (neck === 'lei') {
    return (
      <group position={[0, -0.38, 0.16]} rotation={[0.2, 0, 0]}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
          const a = (i * Math.PI * 2) / 12;
          const r = 0.52;
          const colors = ['#f43f5e', '#facc15', '#fb923c', '#2dd4bf'];
          const color = colors[i % colors.length];
          return (
            <group key={i} position={[r * Math.sin(a), 0, r * Math.cos(a)]}>
              <mesh scale={[1, 0.8, 1]}>
                <sphereGeometry args={[0.065, 10, 10]} />
                <meshStandardMaterial color={color} roughness={0.4} />
              </mesh>
              <mesh position={[0.02, 0.03, 0]} scale={[0.5, 0.9, 0.2]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#22c55e" roughness={0.5} />
              </mesh>
            </group>
          );
        })}
      </group>
    );
  }

  return null;
}
