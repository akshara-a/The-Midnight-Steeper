interface ProgressRingProps {
  /** 0..1 */
  progress: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}

/** Circular neon progress gauge with tick marks; children render in the center. */
export default function ProgressRing({ progress, size = 280, stroke = 10, children }: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const r = (size - stroke) / 2 - 14;
  const c = 2 * Math.PI * r;
  const ticks = 60;
  const center = size / 2;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size, maxWidth: '100%' }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 w-full h-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        {Array.from({ length: ticks }, (_, i) => {
          const a = (i / ticks) * Math.PI * 2;
          const major = i % 5 === 0;
          const r1 = size / 2 - 3;
          const r2 = r1 - (major ? 8 : 4);
          const lit = i / ticks <= clamped;
          return (
            <line
              key={i}
              x1={center + Math.cos(a) * r1}
              y1={center + Math.sin(a) * r1}
              x2={center + Math.cos(a) * r2}
              y2={center + Math.sin(a) * r2}
              stroke={lit ? '#c4b5fd' : '#312e81'}
              strokeWidth={major ? 2 : 1}
              strokeLinecap="round"
            />
          );
        })}
        <circle cx={center} cy={center} r={r} fill="none" stroke="#1e1b4b" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.9))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
