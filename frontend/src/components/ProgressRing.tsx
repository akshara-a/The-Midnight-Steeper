interface ProgressRingProps {
  /** 0..1 */
  readonly progress: number;
  readonly size?: number;
  readonly stroke?: number;
  readonly children?: React.ReactNode;
}

/** Chunky rainbow progress ring with a little star riding the end; children render in the center. */
export default function ProgressRing({ progress, size = 260, stroke = 22, children }: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress));
  const r = (size - stroke) / 2 - 4;
  const c = 2 * Math.PI * r;
  const center = size / 2;
  const angle = clamped * Math.PI * 2 - Math.PI / 2;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size, maxWidth: '100%' }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 w-full h-full" role="img" aria-label={`${Math.round(clamped * 100)} percent asleep`}>
        <defs>
          <linearGradient id="kidRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff6b9d" />
            <stop offset="35%" stopColor="#ffd93d" />
            <stop offset="70%" stopColor="#7dffb3" />
            <stop offset="100%" stopColor="#6bcbff" />
          </linearGradient>
        </defs>
        <circle cx={center} cy={center} r={r} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} />
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="url(#kidRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
        <text
          x={center + Math.cos(angle) * r}
          y={center + Math.sin(angle) * r}
          fontSize={stroke * 1.2}
          textAnchor="middle"
          dominantBaseline="central"
        >
          ⭐
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
