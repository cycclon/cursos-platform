import type { ComponentType } from 'react';
import { Activity } from 'lucide-react';
import { toneFor } from './tone';

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const t = toneFor(value);
  return (
    <div className={`h-2 rounded-full overflow-hidden ${t.track} ${className}`}>
      <div
        className={`h-full rounded-full bg-gradient-to-r ${t.bar} transition-[width] duration-700 ease-out`}
        style={{ width: `${Math.min(100, Math.max(value, value > 0 ? 4 : 0))}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 132,
  caption = 'Promedio',
}: {
  value: number;
  size?: number;
  caption?: string;
}) {
  const stroke = size < 100 ? 8 : 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const t = toneFor(value);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-chocolate-100/50" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke="currentColor"
          className={`${t.text} transition-[stroke-dashoffset] duration-1000 ease-out`}
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, value) / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display font-bold text-ink leading-none ${size < 100 ? 'text-xl' : 'text-3xl'}`}>{value}%</span>
        {size >= 100 && <span className="text-[11px] text-ink-light mt-1 tracking-wide uppercase">{caption}</span>}
      </div>
    </div>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xl font-bold text-ink">{value}</p>
      <p className="text-xs text-ink-light mt-0.5">{label}</p>
    </div>
  );
}

export function Avatar({ name, src, size = 'sm' }: { name: string; src?: string | null; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-16 h-16 text-lg' : 'w-9 h-9 text-xs';
  if (src) return <img src={src} alt={name} className={`${dim} rounded-full object-cover shrink-0`} />;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <div className={`${dim} rounded-full bg-chocolate-50 text-chocolate flex items-center justify-center font-bold shrink-0 border border-chocolate-100/40`}>
      {initials || '?'}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-parchment rounded-xl border border-dashed border-chocolate-100/40 p-12 text-center">
      <Activity className="w-8 h-8 text-gold-light mx-auto mb-3" />
      <p className="text-sm text-ink-light">{text}</p>
    </div>
  );
}
