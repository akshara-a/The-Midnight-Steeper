'use client';

import { useEffect, useRef } from 'react';

interface Dot {
  x: number;
  y: number;
  r: number;
  vy: number;
  phase: number;
  hue: number;
}

const BOKEH_HUES = [330, 45, 190, 270, 150, 20];

/**
 * Soft drifting lights behind the game: colorful bokeh bubbles by day, warm fireflies at bedtime.
 * Pauses when the tab is hidden and holds still for reduced-motion users.
 */
export default function Fireflies({ night }: Readonly<{ night: boolean }>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nightRef = useRef(night);

  useEffect(() => {
    nightRef.current = night;
  }, [night]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    let dots: Dot[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.max(14, Math.floor((w * h) / 42000));
      dots = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 6 + Math.random() * 22,
        vy: 0.15 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        hue: BOKEH_HUES[i % BOKEH_HUES.length],
      }));
    };

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      const isNight = nightRef.current;
      for (const d of dots) {
        if (!reduced) {
          d.y -= d.vy;
          d.x += Math.sin(t + d.phase) * 0.3;
          if (d.y < -30) {
            d.y = h + 30;
            d.x = Math.random() * w;
          }
        }
        const pulse = 0.55 + 0.45 * Math.sin(t * 1.6 + d.phase);
        const radius = isNight ? d.r * 0.35 : d.r;
        const color = isNight ? '255, 240, 150' : null;
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, radius);
        if (color) {
          g.addColorStop(0, `rgba(${color}, ${0.9 * pulse})`);
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

  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
}
