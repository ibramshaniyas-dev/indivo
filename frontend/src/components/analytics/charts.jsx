import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';

// Chart palette (validated with the dataviz validator: lightness, chroma, CVD ΔE 26.5, normal ΔE 28.8, contrast ≥ 3:1).
export const SERIES_GOLD = '#a86a00';
export const SERIES_BLUE = '#2a78d6';
const GRID = '#ECE5D6';
const AXIS_TEXT = '#6F6551';

export const inr = (v, { compact = false } = {}) => {
  const n = Number(v || 0);
  if (compact && Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L`;
  if (compact && Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(260, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

/**
 * Single-series sales line/area (no legend — the card title names the series), recessive grid,
 * one y-axis, crosshair + tooltip on hover (shows sales and order count for the bucket).
 */
export function TrendChart({ points, granularity, height = 240 }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { top: 16, right: 12, bottom: 28, left: 52 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const peak = Math.max(...points.map((p) => p.sales), 0);
  const empty = peak === 0;
  const max = niceMax(peak);
  const x = (i) => pad.left + (points.length <= 1 ? w / 2 : (i / (points.length - 1)) * w);
  const y = (v) => pad.top + h - (v / max) * h;
  const ticks = empty ? [0] : [0, max / 2, max];

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.sales).toFixed(1)}`).join('');
  const area = points.length ? `${line}L${x(points.length - 1)},${pad.top + h}L${x(0)},${pad.top + h}Z` : '';

  const fmtDate = (d, long) => {
    const dt = new Date(`${d}T00:00:00`);
    return granularity === 'month'
      ? dt.toLocaleDateString('en-IN', { month: 'short', year: long ? 'numeric' : '2-digit' })
      : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(long ? { weekday: 'short' } : {}) });
  };
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(w / 70))));

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - pad.left) / w) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  };

  const hp = hover !== null ? points[hover] : null;

  return (
    <Box ref={ref} sx={{ position: 'relative', width: '100%' }}>
      <svg width={width} height={height} role="img" aria-label="Sales over time" onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="zk-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={SERIES_GOLD} stopOpacity="0.22" />
            <stop offset="1" stopColor={SERIES_GOLD} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={pad.left + w} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={AXIS_TEXT}>{inr(t, { compact: true })}</text>
          </g>
        ))}
        {points.map((p, i) => {
          const last = points.length - 1;
          // Every Nth label plus the last one; drop a regular label that would crowd the last.
          const show = i === last || (i % labelEvery === 0 && last - i >= labelEvery * 0.6);
          return show && (
            <text key={p.date} x={x(i)} y={height - 8} textAnchor={i === last ? 'end' : i === 0 ? 'start' : 'middle'} fontSize="11" fill={AXIS_TEXT}>{fmtDate(p.date)}</text>
          );
        })}
        {empty && (
          <text x={pad.left + w / 2} y={pad.top + h / 2} textAnchor="middle" fontSize="13" fill={AXIS_TEXT}>No sales in this period</text>
        )}
        <path d={area} fill="url(#zk-area)" />
        <path d={line} fill="none" stroke={SERIES_GOLD} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hp && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + h} stroke={AXIS_TEXT} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(hp.sales)} r="5" fill={SERIES_GOLD} stroke="#fff" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hp && (
        <Box
          sx={{
            position: 'absolute', top: 4, left: Math.min(Math.max(x(hover) - 70, 0), width - 150), width: 150, pointerEvents: 'none',
            bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, px: 1.25, py: 0.75, boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
          }}
        >
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{fmtDate(hp.date, true)}</Typography>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>{inr(hp.sales)}</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{hp.orders} order{hp.orders === 1 ? '' : 's'}</Typography>
        </Box>
      )}
    </Box>
  );
}

/** Horizontal magnitude bars (one hue). Values are direct-labelled in ink; hover shows the share. */
export function BarList({ rows, valueKey = 'value', format = (v) => v, emptyText = 'No data for this period' }) {
  const max = Math.max(...rows.map((r) => r[valueKey]), 0);
  const total = rows.reduce((s, r) => s + r[valueKey], 0);
  if (!rows.length || !max) return <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>{emptyText}</Typography>;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {rows.map((r) => (
        <Box key={r.label} title={`${r.label}: ${format(r[valueKey])} (${Math.round((r[valueKey] / total) * 100)}%)`}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.4 }}>
            <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>{r.label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, flexShrink: 0 }}>{format(r[valueKey])}</Typography>
          </Box>
          <Box sx={{ height: 8, bgcolor: '#F3EEE3', borderRadius: 4, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${Math.max(2, (r[valueKey] / max) * 100)}%`, bgcolor: r.color || SERIES_GOLD, borderRadius: 4, transition: 'width 0.5s ease' }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/** Two-part share bar with a 2px gap between segments; always paired with a legend that names both parts. */
export function SplitBar({ parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const visible = useMemo(() => parts.filter((p) => p.value > 0), [parts]);
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: '2px', height: 14, borderRadius: 7, overflow: 'hidden', bgcolor: '#F3EEE3' }}>
        {total > 0 && visible.map((p) => (
          <Box key={p.label} title={`${p.label}: ${Math.round((p.value / total) * 100)}%`} sx={{ width: `${(p.value / total) * 100}%`, bgcolor: p.color }} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap' }}>
        {parts.map((p) => (
          <Box key={p.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: p.color, mt: 0.6 }} />
            <Box>
              <Typography variant="body2" color="text.secondary">{p.label} · {total ? Math.round((p.value / total) * 100) : 0}%</Typography>
              <Typography sx={{ fontWeight: 700 }}>{p.display}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
