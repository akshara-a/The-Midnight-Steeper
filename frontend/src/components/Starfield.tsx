'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  tw: number;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

/**
 * Full-screen parallax starfield with drifting nebula clouds and shooting stars.
 * Renders behind all game UI; pauses when the tab is hidden and skips motion
 * when the user prefers reduced motion.
 */
export default function Starfield({ tint = '#a855f7' }: { tint?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tintRef = useRef(tint);

  useEffect(() => {
    tintRef.current = tint;
  }, [tint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let raf = 0;
    let stars: Star[] = [];
    const meteors: Meteor[] = [];
    let t = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.floor((width * height) / 5500);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.9 + 0.1,
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Nebula clouds
      const blobs = [
        { cx: 0.2, cy: 0.25, r: 0.45, c: tintRef.current, a: 0.13 },
        { cx: 0.85, cy: 0.7, r: 0.5, c: '#06b6d4', a: 0.09 },
        { cx: 0.5, cy: 1.05, r: 0.55, c: '#ec4899', a: 0.1 },
      ];
      for (const b of blobs) {
        const x = (b.cx + Math.sin(t * 0.08 + b.cx * 6) * 0.04) * width;
        const y = (b.cy + Math.cos(t * 0.07 + b.cy * 6) * 0.04) * height;
        const r = b.r * Math.max(width, height);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, b.c + Math.round(b.a * 255).toString(16).padStart(2, '0'));
        g.addColorStop(1, b.c + '00');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }

      // Stars
      for (const s of stars) {
        if (!reduced) {
          s.y += s.z * 0.18;
          if (s.y > height) {
            s.y = 0;
            s.x = Math.random() * width;
          }
        }
        const alpha = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + s.tw));
        ctx.globalAlpha = alpha * s.z;
        ctx.fillStyle = s.z > 0.8 ? '#e0e7ff' : '#a5b4fc';
        const size = s.z * 1.8;
        ctx.fillRect(s.x, s.y, size, size);
      }
      ctx.globalAlpha = 1;

      // Shooting stars
      if (!reduced && Math.random() < 0.006 && meteors.length < 3) {
        meteors.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.4,
          vx: 7 + Math.random() * 5,
          vy: 3 + Math.random() * 3,
          life: 1,
        });
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.02;
        if (m.life <= 0) {
          meteors.splice(i, 1);
          continue;
        }
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 9, m.y - m.vy * 9);
        grad.addColorStop(0, `rgba(255,255,255,${m.life})`);
        grad.addColorStop(1, 'rgba(165,180,252,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 9, m.y - m.vy * 9);
        ctx.stroke();
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
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}
