import { useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Typography, Grid, Skeleton, Alert, ToggleButtonGroup, ToggleButton, Table, TableHead, TableRow, TableCell, TableBody, Chip, Tooltip,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { getSearchInsights } from '../../services/growth.service';
import { Tile, SectionTitle } from '../../components/commission/shared';
import { SERIES_GOLD, inr } from '../../components/analytics/charts';
import ProductImage from '../../components/ProductImage';

const GRID = '#ECE5D6';
const AXIS_TEXT = '#6F6551';
const pct = (v) => `${Math.round((v || 0) * 100)}%`;
const num = (v) => Number(v || 0).toLocaleString('en-IN');
const storeUrl = (path) => `${window.location.origin.replace('://admin.', '://')}${path}`;
const plural = (n, word) => `${num(n)} ${word}${n === 1 ? '' : 's'}`;
const ago = (mins) => {
  if (mins == null) return '—';
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
}

/** Searches per day — single series (title names it, no legend), per-bar hover tooltip. */
function SearchesChart({ points, height = 220 }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState(null);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(260, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const pad = { top: 12, right: 8, bottom: 26, left: 36 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const peak = Math.max(0, ...points.map((p) => p.searches));
  const max = niceMax(peak);
  const slot = w / Math.max(points.length, 1);
  const barW = Math.max(2, Math.min(28, slot - 2)); // ≥2px surface gap between bars
  const y = (v) => pad.top + h - (v / max) * h;
  const ticks = peak ? [0, max / 2, max] : [0];
  const every = Math.ceil(points.length / Math.max(1, Math.floor(w / 64))); // thin labels so they never collide
  const fmt = (d, long) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', ...(long ? { weekday: 'short' } : {}) });

  return (
    <Box ref={ref} sx={{ position: 'relative' }}>
      {!peak && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <Typography variant="body2" color="text.secondary">No searches in this period yet</Typography>
        </Box>
      )}
      <svg width={width} height={height} role="img" aria-label="Searches per day" style={{ display: 'block' }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill={AXIS_TEXT}>{num(t)}</text>
          </g>
        ))}
        {points.map((p, i) => {
          const cx = pad.left + slot * i + slot / 2;
          const bh = Math.max(p.searches ? 2 : 0, (p.searches / max) * h);
          const r = Math.min(4, barW / 2, bh);
          const x0 = cx - barW / 2;
          const top = pad.top + h - bh;
          return (
            <g key={p.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.left + slot * i} y={pad.top} width={slot} height={h} fill="transparent" />
              {bh > 0 && (
                <path
                  d={`M${x0},${pad.top + h} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + barW - r} Q${x0 + barW},${top} ${x0 + barW},${top + r} V${pad.top + h} Z`}
                  fill={SERIES_GOLD} opacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
              {(i % every === 0 || i === points.length - 1) && (i === points.length - 1 || points.length - 1 - i >= every) && (
                <text x={cx} y={height - 8} textAnchor="middle" fontSize={11} fill={AXIS_TEXT}>{fmt(p.day)}</text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && points[hover] && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute', top: 0, pointerEvents: 'none', px: 1.25, py: 0.75, borderRadius: 1.5, whiteSpace: 'nowrap',
            left: Math.min(Math.max(pad.left + slot * hover + slot / 2 - 60, 0), width - 130),
          }}
        >
          <Typography variant="caption" color="text.secondary">{fmt(points[hover].day, true)}</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{num(points[hover].searches)} searches</Typography>
        </Paper>
      )}
    </Box>
  );
}

/** Plain-language takeaways computed from the numbers. */
function buildTips(d) {
  const tips = [];
  const gap = d.zeroResultTerms[0];
  if (gap) tips.push(`“${gap.term}” was searched ${gap.searches} time${gap.searches > 1 ? 's' : ''} with no matching product — list it or ask a seller to add it.`);
  const weak = d.topTerms.find((t) => t.searches >= 3 && t.avgResults > 0 && t.clickThroughRate < 0.2);
  if (weak) tips.push(`“${weak.term}” finds products but only ${pct(weak.clickThroughRate)} of searchers open one — check photos, prices and titles for this term.`);
  const star = d.topProducts[0];
  if (star) tips.push(`“${star.name}” is the most-opened product from search (${plural(star.clicks, "open")}) — keep it well stocked and feature it on the homepage.`);
  if (d.summary.zeroResultRate > 0.15) tips.push(`${pct(d.summary.zeroResultRate)} of searches find nothing — the catalogue is missing things customers want.`);
  return tips;
}

export default function SearchInsights() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    setError('');
    getSearchInsights(days).then(setData).catch((e) => setError(e.response?.data?.message || 'Could not load search insights'));
  }, [days]);

  const s = data?.summary;
  const maxSearches = Math.max(1, ...(data?.topTerms || []).map((t) => t.searches));
  const tips = data ? buildTips(data) : [];
  const change = s?.change == null ? null : Math.round(s.change * 100);

  return (
    <Box sx={{ maxWidth: 1250 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
        <Box>
          <Typography variant="h5">Search Insights</Typography>
          <Typography variant="body2" color="text.secondary">What customers search for, which products they open, and what they can’t find.</Typography>
        </Box>
        <ToggleButtonGroup size="small" exclusive value={days} onChange={(e, v) => v && setDays(v)} sx={{ bgcolor: '#fff' }}>
          {[7, 30, 90].map((d) => <ToggleButton key={d} value={d} sx={{ textTransform: 'none', px: 1.5 }}>{d} days</ToggleButton>)}
        </ToggleButtonGroup>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={6} md={3}>
          <Tile label="Total searches" value={s ? num(s.searches) : '…'} hint={s ? (change == null ? plural(s.visitors, "visitor") : `${change >= 0 ? '▲' : '▼'} ${Math.abs(change)}% vs previous ${days} days`) : ''} />
        </Grid>
        <Grid item xs={6} md={3}><Tile label="Different search terms" value={s ? num(s.uniqueTerms) : '…'} hint={s ? `${plural(s.visitors, "visitor")} searched` : ''} /></Grid>
        <Grid item xs={6} md={3}>
          <Tile label="Searches with no results" value={s ? pct(s.zeroResultRate) : '…'} hint={s ? `${plural(s.zeroResultSearches, "search")} found nothing` : ''} emphasis={s?.zeroResultRate > 0.15} />
        </Grid>
        <Grid item xs={6} md={3}><Tile label="Search → product opened" value={s ? pct(s.clickThroughRate) : '…'} hint={s ? plural(s.productClicks, "product open") : ''} /></Grid>
      </Grid>

      {tips.length > 0 && (
        <Paper sx={{ p: 2, mb: 2.5, bgcolor: '#FBF5E8', borderColor: 'rgba(168,106,0,0.35)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LightbulbOutlinedIcon sx={{ color: 'secondary.dark' }} />
            <Typography sx={{ fontWeight: 700 }}>What to do next</Typography>
          </Box>
          <Box component="ul" sx={{ m: 0, pl: 3.5, '& li': { mb: 0.5 } }}>
            {tips.map((t) => <Typography component="li" variant="body2" key={t}>{t}</Typography>)}
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 2.5, mb: 2.5 }}>
        <SectionTitle title="Searches per day" subtitle={`Last ${days} days`} />
        {data ? <SearchesChart points={data.daily} /> : <Skeleton variant="rounded" height={220} />}
      </Paper>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 2.5, height: '100%' }}>
            <SectionTitle title="Most searched" subtitle="What customers type into the search bar" />
            {!data ? <Skeleton variant="rounded" height={320} /> : data.topTerms.length === 0 ? (
              <Empty icon={SearchRoundedIcon} text="Search terms will appear here as customers use the search bar." />
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 28 }}>#</TableCell>
                      <TableCell>Search term</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Searches</TableCell>
                      <TableCell align="right">Results</TableCell>
                      <TableCell align="right">Opened</TableCell>
                      <TableCell align="right">Last</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.topTerms.map((t, i) => (
                      <TableRow key={t.term} hover>
                        <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                        <TableCell>
                          <Box component="a" href={storeUrl(`/search?q=${encodeURIComponent(t.term)}`)} target="_blank" rel="noopener noreferrer" sx={{ color: 'text.primary', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { color: 'primary.main' } }}>
                            {t.term}<OpenInNewRoundedIcon sx={{ fontSize: 13, opacity: 0.5 }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{plural(t.visitors, 'visitor')}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: GRID, overflow: 'hidden' }}>
                              <Box sx={{ width: `${(t.searches / maxSearches) * 100}%`, height: '100%', borderRadius: 4, bgcolor: SERIES_GOLD }} />
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 28, textAlign: 'right' }}>{num(t.searches)}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {t.avgResults === 0 ? <Chip size="small" label="None" color="error" variant="outlined" sx={{ height: 20 }} /> : num(t.avgResults)}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={plural(t.clicks, "product open")}><span>{pct(t.clickThroughRate)}</span></Tooltip>
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{ago(t.minutesAgo)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 2.5, height: '100%' }}>
            <SectionTitle title="Most opened from search" subtitle="Products customers click in search results" />
            {!data ? <Skeleton variant="rounded" height={320} /> : data.topProducts.length === 0 ? (
              <Empty icon={TouchAppRoundedIcon} text="Products appear here once customers open them from search results." />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {data.topProducts.map((p, i) => (
                  <Box key={p.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ width: 18, color: 'text.secondary', fontWeight: 700, fontSize: '0.8rem' }}>{i + 1}</Typography>
                    <Box sx={{ width: 52, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden' }}>
                      <ProductImage src={p.image} alt={p.name} ratio="1 / 1" fit="cover" placeholderLabel={false} sizes="52px" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box component="a" href={storeUrl(`/product/${p.slug}`)} target="_blank" rel="noopener noreferrer" sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                        <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.88rem' }}>{p.name}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{p.sellerName} · {inr(p.price)}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.4 }}>
                        {p.terms.map((t) => <Chip key={t} size="small" label={t} sx={{ height: 18, fontSize: '0.66rem', bgcolor: '#FBF5E8' }} />)}
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                      <Typography sx={{ fontWeight: 700 }}>{num(p.clicks)}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.clicks === 1 ? 'open' : 'opens'}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2.5 }}>
            <SectionTitle title="Searched but not found" subtitle="Demand you are missing — customers looked for these and saw no products" />
            {!data ? <Skeleton variant="rounded" height={140} /> : data.zeroResultTerms.length === 0 ? (
              <Empty icon={SearchOffRoundedIcon} text="Great — every search in this period found at least one product." />
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.25 }}>
                {data.zeroResultTerms.map((t) => (
                  <Box key={t.term} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'rgba(198,40,40,0.25)', bgcolor: '#FFF8F7' }}>
                    <SearchOffRoundedIcon sx={{ color: '#C62828', fontSize: 20 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography noWrap sx={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.term}</Typography>
                      <Typography variant="caption" color="text.secondary">{plural(t.visitors, 'visitor')} · {ago(t.minutesAgo)}</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700 }}>{num(t.searches)}×</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function Empty({ icon: Icon, text }) {
  return (
    <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
      <Icon sx={{ fontSize: 34, opacity: 0.5 }} />
      <Typography variant="body2" sx={{ mt: 1 }}>{text}</Typography>
    </Box>
  );
}
