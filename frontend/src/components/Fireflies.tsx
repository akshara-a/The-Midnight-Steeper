'use client';

import { useEffect, useRef } from 'react';
import type { DioramaTheme } from './SlothPet3D';

interface FirefliesProps {
  night: boolean;
  theme?: DioramaTheme;
}

// Particle representations for each theme
interface BaseParticle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  phase: number;
}

interface PetalParticle extends BaseParticle {
  angle: number;
  vAngle: number;
  flip: number;
  vFlip: number;
  color: string;
}

interface StarParticle extends BaseParticle {
  rot: number;
  vRot: number;
  speed: number;
  maxAlpha: number;
  spikes: number;
  colorRGB: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface LeafParticle extends BaseParticle {
  angle: number;
  vAngle: number;
  flip: number;
  vFlip: number;
  color: string;
  isMaple: boolean;
}

interface EmberParticle extends BaseParticle {
  life: number;
  maxLife: number;
  color: string;
}

interface BubbleParticle extends BaseParticle {
  wobbleSpeed: number;
  wobbleAmp: number;
  opacity: number;
  color: string;
}

interface SteamParticle extends BaseParticle {
  maxSize: number;
  opacity: number;
}

interface BokehParticle extends BaseParticle {
  hue: number;
}

const BOKEH_HUES = [330, 45, 190, 270, 150, 20];
const SAKURA_COLORS = ['#fda4af', '#fbcfe8', '#f472b6', '#ffe4e6', '#fff1f2'];
const AUTUMN_COLORS = ['#dc2626', '#ea580c', '#f59e0b', '#d97706', '#b45309', '#fcd34d'];
const CELESTIAL_COLORS = ['255, 255, 255', '56, 189, 248', '129, 140, 248', '192, 132, 252', '254, 240, 138'];

/**
 * Dynamic Atmospheric Canvas:
 * Renders theme-specific interactive floating particle simulations:
 * - classic: Glowing golden fireflies (night) or pastel dream bokeh (day)
 * - sakura: Drifting 3D fluttering cherry blossom petals and blossom motes
 * - celestial: Shimmering diamond starbursts, cosmic stardust and shooting stars
 * - autumn: Swirling maple/birch leaves and rising warm hearth embers
 * - onsen: Iridescent floating mineral bubbles and soft rising thermal steam
 */
export default function Fireflies({ night, theme = 'classic' }: Readonly<FirefliesProps>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nightRef = useRef(night);
  const themeRef = useRef(theme);

  useEffect(() => {
    nightRef.current = night;
  }, [night]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;

    // Theme particle stores
    let bokehDots: BokehParticle[] = [];
    let petals: PetalParticle[] = [];
    let stars: StarParticle[] = [];
    let shootingStar: ShootingStar | null = null;
    let shootingStarTimer = 0;
    let leaves: LeafParticle[] = [];
    let embers: EmberParticle[] = [];
    let bubbles: BubbleParticle[] = [];
    let steamPuffs: SteamParticle[] = [];

    const initParticles = () => {
      const activeTheme = themeRef.current;
      const count = Math.max(14, Math.floor((w * h) / 42000));

      // 1. Classic bokeh
      bokehDots = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 6 + Math.random() * 20,
        vx: 0,
        vy: 0.15 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        hue: BOKEH_HUES[i % BOKEH_HUES.length],
      }));

      // 2. Sakura petals
      const petalCount = Math.max(18, Math.floor((w * h) / 36000));
      petals = Array.from({ length: petalCount }, () => ({
        x: Math.random() * (w + 200) - 100,
        y: Math.random() * h,
        size: 7 + Math.random() * 9,
        vx: 0.4 + Math.random() * 0.7,
        vy: 0.6 + Math.random() * 0.9,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.04,
        flip: Math.random() * Math.PI * 2,
        vFlip: 0.02 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2,
        color: SAKURA_COLORS[Math.floor(Math.random() * SAKURA_COLORS.length)],
      }));

      // 3. Celestial stars
      const starCount = Math.max(22, Math.floor((w * h) / 30000));
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 2.5 + Math.random() * 5.5,
        vx: 0,
        vy: 0.05 + Math.random() * 0.1,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.015,
        phase: Math.random() * Math.PI * 2,
        speed: 1.2 + Math.random() * 2.0,
        maxAlpha: 0.6 + Math.random() * 0.4,
        spikes: Math.random() > 0.35 ? 4 : 8,
        colorRGB: CELESTIAL_COLORS[Math.floor(Math.random() * CELESTIAL_COLORS.length)],
      }));

      // 4. Autumn leaves & hearth embers
      const leafCount = Math.max(16, Math.floor((w * h) / 38000));
      leaves = Array.from({ length: leafCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 10 + Math.random() * 12,
        vx: 0.2 + Math.random() * 0.5,
        vy: 0.7 + Math.random() * 0.9,
        angle: Math.random() * Math.PI * 2,
        vAngle: (Math.random() - 0.5) * 0.03,
        flip: Math.random() * Math.PI * 2,
        vFlip: 0.02 + Math.random() * 0.035,
        phase: Math.random() * Math.PI * 2,
        color: AUTUMN_COLORS[Math.floor(Math.random() * AUTUMN_COLORS.length)],
        isMaple: Math.random() > 0.4,
      }));

      embers = Array.from({ length: 16 }, () => ({
        x: Math.random() * w,
        y: h - Math.random() * (h * 0.4),
        size: 1.5 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.5 + Math.random() * 1.1),
        phase: Math.random() * Math.PI * 2,
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 120,
        color: Math.random() > 0.5 ? '#f59e0b' : '#ea580c',
      }));

      // 5. Onsen bubbles & steam puffs
      const bubbleCount = Math.max(16, Math.floor((w * h) / 35000));
      bubbles = Array.from({ length: bubbleCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: 5 + Math.random() * 14,
        vx: 0,
        vy: -(0.4 + Math.random() * 0.8),
        phase: Math.random() * Math.PI * 2,
        wobbleSpeed: 1.5 + Math.random() * 2,
        wobbleAmp: 0.3 + Math.random() * 0.5,
        opacity: 0.4 + Math.random() * 0.45,
        color: Math.random() > 0.5 ? '#2dd4bf' : '#99f6e4',
      }));

      steamPuffs = Array.from({ length: 8 }, () => ({
        x: Math.random() * w,
        y: h - Math.random() * (h * 0.6),
        size: 20 + Math.random() * 25,
        maxSize: 60 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(0.3 + Math.random() * 0.4),
        phase: Math.random() * Math.PI * 2,
        opacity: 0.08 + Math.random() * 0.12,
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    // Draw diamond starburst
    const drawStar = (x: number, y: number, r: number, rot: number, spikes: number, colorRGB: string, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = `rgba(${colorRGB}, ${alpha})`;
      ctx.shadowColor = `rgba(${colorRGB}, 0.85)`;
      ctx.shadowBlur = r * 1.8;
      ctx.beginPath();
      const rIn = r * 0.22;
      const count = spikes * 2;
      for (let i = 0; i < count; i++) {
        const radius = i % 2 === 0 ? r : rIn;
        const a = (i * Math.PI) / spikes;
        if (i === 0) ctx.moveTo(radius * Math.cos(a), radius * Math.sin(a));
        else ctx.lineTo(radius * Math.cos(a), radius * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Draw cherry blossom petal with 3D flip effect
    const drawPetal = (p: PetalParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      const flipScale = Math.cos(p.flip);
      ctx.scale(1, flipScale);
      ctx.fillStyle = p.color;
      ctx.shadowColor = 'rgba(244, 114, 182, 0.45)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.85, -p.size * 0.4, p.size * 0.85, p.size * 0.6, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.85, p.size * 0.6, -p.size * 0.85, -p.size * 0.4, 0, -p.size);
      ctx.fill();
      ctx.restore();
    };

    // Draw autumn leaf with sway & tumble
    const drawLeaf = (l: LeafParticle) => {
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.angle);
      const flipScale = Math.cos(l.flip);
      ctx.scale(flipScale, 1);
      ctx.fillStyle = l.color;
      ctx.shadowColor = 'rgba(180, 83, 9, 0.35)';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      if (l.isMaple) {
        // Pointed maple leaf silhouette
        ctx.moveTo(0, -l.size);
        ctx.quadraticCurveTo(l.size * 0.8, -l.size * 0.3, l.size * 0.7, l.size * 0.4);
        ctx.quadraticCurveTo(l.size * 0.4, l.size * 0.6, 0, l.size);
        ctx.quadraticCurveTo(-l.size * 0.4, l.size * 0.6, -l.size * 0.7, l.size * 0.4);
        ctx.quadraticCurveTo(-l.size * 0.8, -l.size * 0.3, 0, -l.size);
      } else {
        // Birch teardrop leaf
        ctx.moveTo(0, -l.size);
        ctx.bezierCurveTo(l.size * 0.7, -l.size * 0.5, l.size * 0.6, l.size * 0.5, 0, l.size * 0.8);
        ctx.bezierCurveTo(-l.size * 0.6, l.size * 0.5, -l.size * 0.7, -l.size * 0.5, 0, -l.size);
      }
      ctx.fill();
      ctx.restore();
    };

    // Draw onsen mineral bubble with 3D reflection
    const drawBubble = (b: BubbleParticle) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.beginPath();
      ctx.arc(0, 0, b.size, 0, Math.PI * 2);

      const grad = ctx.createRadialGradient(-b.size * 0.3, -b.size * 0.3, b.size * 0.1, 0, 0, b.size);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
      grad.addColorStop(0.5, 'rgba(45, 212, 191, 0.12)');
      grad.addColorStop(0.9, 'rgba(94, 234, 212, 0.35)');
      grad.addColorStop(1, 'rgba(20, 184, 166, 0.65)');
      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(204, 251, 241, 0.7)';
      ctx.lineWidth = 1.3;
      ctx.fill();
      ctx.stroke();

      // Specular highlight dot
      ctx.beginPath();
      ctx.arc(-b.size * 0.35, -b.size * 0.35, Math.max(1, b.size * 0.22), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      const isNight = nightRef.current;
      const activeTheme = themeRef.current;

      // ----------------------------------------------------
      // 1. SAKURA THEME: Drifting Cherry Petals & Rose Bokeh
      // ----------------------------------------------------
      if (activeTheme === 'sakura') {
        const breeze = Math.sin(t * 0.7) * 0.5;
        for (const p of petals) {
          if (!reduced) {
            p.y += p.vy;
            p.x += p.vx + breeze;
            p.angle += p.vAngle;
            p.flip += p.vFlip;
            if (p.y > h + 30) {
              p.y = -20;
              p.x = Math.random() * (w + 100) - 50;
            }
            if (p.x > w + 40) p.x = -20;
          }
          drawPetal(p);
        }

        // Soft ambient pink motes
        for (let i = 0; i < 8; i++) {
          const mx = (w * (i + 1)) / 9 + Math.sin(t + i) * 20;
          const my = (h * (i % 3 + 1)) / 4 + Math.cos(t * 0.8 + i) * 15;
          const rad = 14 + Math.sin(t * 1.5 + i) * 6;
          const g = ctx.createRadialGradient(mx, my, 0, mx, my, rad);
          g.addColorStop(0, 'rgba(251, 182, 206, 0.35)');
          g.addColorStop(1, 'rgba(251, 182, 206, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(mx, my, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ----------------------------------------------------
      // 2. CELESTIAL THEME: Diamond Stars & Shooting Star
      // ----------------------------------------------------
      else if (activeTheme === 'celestial') {
        for (const s of stars) {
          if (!reduced) {
            s.rot += s.vRot;
            s.y -= s.vy;
            if (s.y < -15) {
              s.y = h + 15;
              s.x = Math.random() * w;
            }
          }
          const pulse = (0.35 + 0.65 * Math.sin(t * s.speed + s.phase)) * s.maxAlpha;
          drawStar(s.x, s.y, s.size, s.rot, s.spikes, s.colorRGB, pulse);
        }

        // Shooting Star Spawner & Renderer
        if (!reduced) {
          shootingStarTimer += 0.016;
          if (shootingStarTimer > 4.5 && !shootingStar) {
            shootingStarTimer = 0;
            if (Math.random() > 0.3) {
              shootingStar = {
                x: Math.random() * (w * 0.65) + w * 0.1,
                y: Math.random() * (h * 0.35) + 30,
                length: 80 + Math.random() * 80,
                speed: 12 + Math.random() * 8,
                angle: (Math.PI / 6) + (Math.random() - 0.5) * 0.3,
                opacity: 1,
                life: 0,
                maxLife: 30 + Math.random() * 20,
              };
            }
          }

          if (shootingStar) {
            shootingStar.life += 1;
            shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
            shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;
            const progress = shootingStar.life / shootingStar.maxLife;
            shootingStar.opacity = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;

            const tailX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length;
            const tailY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length;

            const g = ctx.createLinearGradient(tailX, tailY, shootingStar.x, shootingStar.y);
            g.addColorStop(0, 'rgba(56, 189, 248, 0)');
            g.addColorStop(0.7, `rgba(165, 243, 252, ${0.4 * shootingStar.opacity})`);
            g.addColorStop(1, `rgba(255, 255, 255, ${0.95 * shootingStar.opacity})`);

            ctx.save();
            ctx.strokeStyle = g;
            ctx.lineWidth = 2.2;
            ctx.shadowColor = 'rgba(56, 189, 248, 0.9)';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(shootingStar.x, shootingStar.y);
            ctx.stroke();

            // Head starburst
            ctx.fillStyle = `rgba(255, 255, 255, ${shootingStar.opacity})`;
            ctx.beginPath();
            ctx.arc(shootingStar.x, shootingStar.y, 2.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (shootingStar.life >= shootingStar.maxLife) {
              shootingStar = null;
            }
          }
        }
      }

      // ----------------------------------------------------
      // 3. AUTUMN THEME: Swirling Leaves & Hearth Embers
      // ----------------------------------------------------
      else if (activeTheme === 'autumn') {
        // Swirling autumn foliage
        for (const l of leaves) {
          if (!reduced) {
            l.y += l.vy;
            l.x += l.vx + Math.sin(t * 1.6 + l.phase) * 0.7;
            l.angle += l.vAngle;
            l.flip += l.vFlip;
            if (l.y > h + 30) {
              l.y = -25;
              l.x = Math.random() * w;
            }
          }
          drawLeaf(l);
        }

        // Warm hearth embers rising from the hearth fire
        for (const em of embers) {
          if (!reduced) {
            em.y += em.vy;
            em.x += em.vx + Math.sin(t * 2 + em.phase) * 0.3;
            em.life += 1;
            if (em.life >= em.maxLife || em.y < 0) {
              em.y = h - Math.random() * (h * 0.25);
              em.x = Math.random() * w;
              em.life = 0;
            }
          }
          const alpha = Math.sin((em.life / em.maxLife) * Math.PI) * 0.85;
          ctx.save();
          ctx.fillStyle = em.color;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = em.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(em.x, em.y, em.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // ----------------------------------------------------
      // 4. ONSEN THEME: Mineral Bubbles & Rising Warm Mist
      // ----------------------------------------------------
      else if (activeTheme === 'onsen') {
        // Diffuse steam clouds
        for (const st of steamPuffs) {
          if (!reduced) {
            st.y += st.vy;
            st.x += st.vx + Math.sin(t * 0.8 + st.phase) * 0.3;
            st.size = Math.min(st.maxSize, st.size + 0.1);
            if (st.y < -st.maxSize) {
              st.y = h + 10;
              st.size = 20;
              st.x = Math.random() * w;
            }
          }
          const g = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.size);
          g.addColorStop(0, `rgba(204, 251, 241, ${st.opacity})`);
          g.addColorStop(0.7, `rgba(94, 234, 212, ${st.opacity * 0.4})`);
          g.addColorStop(1, 'rgba(45, 212, 191, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Translucent mineral bubbles
        for (const b of bubbles) {
          if (!reduced) {
            b.y += b.vy;
            b.x += Math.sin(t * b.wobbleSpeed + b.phase) * b.wobbleAmp;
            if (b.y < -25) {
              b.y = h + 25;
              b.x = Math.random() * w;
            }
          }
          drawBubble(b);
        }
      }

      // ----------------------------------------------------
      // 5. CLASSIC THEME: Golden Fireflies or Daytime Bokeh
      // ----------------------------------------------------
      else {
        for (const d of bokehDots) {
          if (!reduced) {
            d.y -= d.vy;
            d.x += Math.sin(t + d.phase) * 0.35;
            if (d.y < -30) {
              d.y = h + 30;
              d.x = Math.random() * w;
            }
          }
          const pulse = 0.55 + 0.45 * Math.sin(t * 1.6 + d.phase);
          const radius = isNight ? d.size * 0.4 : d.size;
          const color = isNight ? '255, 240, 150' : null;
          const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, radius);
          if (color) {
            g.addColorStop(0, `rgba(${color}, ${0.9 * pulse})`);
            g.addColorStop(0.5, `rgba(${color}, ${0.35 * pulse})`);
            g.addColorStop(1, `rgba(${color}, 0)`);
          } else {
            g.addColorStop(0, `hsla(${d.hue}, 95%, 75%, ${0.5 * pulse})`);
            g.addColorStop(1, `hsla(${d.hue}, 95%, 75%, 0)`);
          }
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduced) draw();
    else raf = requestAnimationFrame(loop);

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [theme]); // Re-initialize & seed particles when theme changes!

  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}
