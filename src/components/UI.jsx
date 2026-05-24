// Shared UI primitives

import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// ── Badge ─────────────────────────────────────────────────
export function Badge({ text, color = 'info' }) {
  return <span className={`badge badge-${color}`}>{text}</span>;
}

// ── Chip ──────────────────────────────────────────────────
export function Chip({ text, variant = 'default' }) {
  return <span className={`chip chip-${variant}`}>{text}</span>;
}

// ── Label ─────────────────────────────────────────────────
export function Label({ children }) {
  return <p className="label">{children}</p>;
}

// ── Card ──────────────────────────────────────────────────
export function Card({ children, style, className = '', accent = false }) {
  return (
    <div className={`card ${accent ? 'card-accent' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
}

// ── Score Ring ────────────────────────────────────────────
export function Ring({ value, max = 10, label }) {
  const r = 30, cx = 40, cy = 40, circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value / max, 0), 1);
  const dash = pct * circ;

  const ringColor =
    label === 'COI level'
      ? value <= 2 ? '#34d399' : value <= 5 ? '#fbbf24' : '#f87171'
      : value >= 7 ? '#34d399' : value >= 4 ? '#fbbf24' : '#f87171';

  return (
    <div className="score-ring-wrap">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="5" />
        {pct > 0 && (
          <circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={ringColor} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            transform="rotate(-90 40 40)"
            style={{ filter: `drop-shadow(0 0 6px ${ringColor}60)` }}
          />
        )}
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="600" fill="var(--text-primary)">{value}</text>
      </svg>
      <span className="score-ring-label">{label}</span>
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────
export function Divider() {
  return <div className="divider" />;
}

// ── Status icon ───────────────────────────────────────────
export function StatusIcon({ type }) {
  const icons = {
    success: <CheckCircle size={14} style={{ color: 'var(--green-fg)' }} />,
    warning: <AlertTriangle size={14} style={{ color: 'var(--amber-fg)' }} />,
    danger:  <AlertCircle size={14} style={{ color: 'var(--red-fg)' }} />,
    info:    <Info size={14} style={{ color: 'var(--info-fg)' }} />,
  };
  return icons[type] || null;
}
