import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Checkbox, Slider, InputBase, Switch, Collapse, IconButton } from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { PRICE_RANGES, DISCOUNTS, RATINGS } from './filterModel';

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

/** One selectable row: checkbox, label, count. */
function OptionRow({ checked, label, count, onClick, indent, disabled, trailing }) {
  return (
    <Box
      role="checkbox" aria-checked={checked} tabIndex={0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => { if (!disabled && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); onClick(); } }}
      sx={{
        display: 'flex', alignItems: 'center', gap: 0.5, pl: indent ? 3 : 0, pr: 0.5, py: 0.1, borderRadius: 1.5, cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1, '&:hover': { bgcolor: disabled ? undefined : 'rgba(168,106,0,0.06)' }, outline: 'none', '&:focus-visible': { boxShadow: '0 0 0 2px rgba(168,106,0,0.4)' },
      }}
    >
      <Checkbox size="small" checked={checked} tabIndex={-1} disableRipple sx={{ p: 0.75, color: 'rgba(122,85,23,0.5)', '&.Mui-checked': { color: 'primary.main' } }} />
      <Typography sx={{ flex: 1, fontSize: '0.86rem', fontWeight: checked ? 700 : 400, minWidth: 0 }} noWrap>{label}</Typography>
      {count != null && <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{count}</Typography>}
      {trailing}
    </Box>
  );
}

/** Pill option for single-choice sections (price ranges, discount, rating). */
export function Pill({ selected, children, onClick }) {
  return (
    <Box
      component="button" type="button" onClick={onClick} aria-pressed={selected}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.4, py: 0.7, borderRadius: 999, cursor: 'pointer', font: 'inherit', fontSize: '0.8rem', fontWeight: selected ? 700 : 500,
        border: '1.5px solid', borderColor: selected ? 'primary.main' : 'rgba(122,85,23,0.25)', bgcolor: selected ? 'primary.main' : '#fff', color: selected ? '#fff' : 'text.primary',
        transition: 'all 0.15s', '&:hover': { borderColor: 'primary.main' },
      }}
    >
      {selected && <CheckRoundedIcon sx={{ fontSize: 15 }} />}
      {children}
    </Box>
  );
}

function CategoryOptions({ filters, onChange, categories, facets }) {
  const [open, setOpen] = useState({});
  const counts = useMemo(() => Object.fromEntries((facets?.categories || []).map((c) => [c.id, c.count])), [facets]);
  const tops = categories.filter((c) => !c.parent_id);
  const kids = (id) => categories.filter((c) => c.parent_id === id);
  const sel = new Set(filters.category);
  const toggle = (id) => onChange({ category: sel.has(id) ? filters.category.filter((x) => x !== id) : [...filters.category, id] });

  return (
    <Box>
      {tops.map((t) => {
        const children = kids(t.id);
        const total = (counts[t.id] || 0) + children.reduce((s, c) => s + (counts[c.id] || 0), 0);
        if (facets && !total && !sel.has(t.id) && !children.some((c) => sel.has(c.id))) return null;
        const expanded = open[t.id] ?? children.some((c) => sel.has(c.id));
        return (
          <Box key={t.id}>
            <OptionRow
              checked={sel.has(t.id)} label={t.name} count={facets ? total : null} onClick={() => toggle(t.id)}
              trailing={children.length > 0 && (
                <IconButton size="small" aria-label={`${expanded ? 'Hide' : 'Show'} ${t.name} sub-categories`} onClick={(e) => { e.stopPropagation(); setOpen((o) => ({ ...o, [t.id]: !expanded })); }} sx={{ p: 0.25 }}>
                  <ExpandMoreRoundedIcon sx={{ fontSize: 18, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </IconButton>
              )}
            />
            <Collapse in={expanded}>
              {children.map((c) => (
                <OptionRow key={c.id} indent checked={sel.has(c.id) || sel.has(t.id)} disabled={sel.has(t.id)} label={c.name} count={facets ? counts[c.id] || 0 : null} onClick={() => toggle(c.id)} />
              ))}
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
}

function BrandOptions({ filters, onChange, facets, brands }) {
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);
  const sel = new Set(filters.brand);
  // Facet list carries live counts; keep selected brands visible even when their count drops to 0.
  const list = useMemo(() => {
    const base = facets?.brands || brands.map((b) => ({ id: b.id, name: b.name, count: null }));
    const missing = filters.brand.filter((id) => !base.some((b) => b.id === id)).map((id) => ({ id, name: brands.find((b) => b.id === id)?.name || `#${id}`, count: 0 }));
    return [...base, ...missing].sort((a, b) => Number(sel.has(b.id)) - Number(sel.has(a.id)));
  }, [facets, brands, filters.brand]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = list.filter((b) => b.name.toLowerCase().includes(q.trim().toLowerCase()));
  const visible = all || q ? shown : shown.slice(0, 7);
  const toggle = (id) => onChange({ brand: sel.has(id) ? filters.brand.filter((x) => x !== id) : [...filters.brand, id] });

  return (
    <Box>
      {list.length > 7 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.25, py: 0.5, mb: 0.75, borderRadius: 999, border: '1px solid', borderColor: 'divider', bgcolor: '#FCFAF5' }}>
          <SearchRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
          <InputBase value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand" inputProps={{ 'aria-label': 'Search brand' }} sx={{ fontSize: '0.84rem', flex: 1 }} />
        </Box>
      )}
      {visible.map((b) => <OptionRow key={b.id} checked={sel.has(b.id)} label={b.name} count={b.count} onClick={() => toggle(b.id)} />)}
      {!visible.length && <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>No brand matches “{q}”</Typography>}
      {!q && shown.length > 7 && (
        <Typography component="button" type="button" onClick={() => setAll((v) => !v)} sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', color: 'primary.main', fontWeight: 700, fontSize: '0.8rem', mt: 0.5, px: 1 }}>
          {all ? 'Show less' : `+ ${shown.length - 7} more`}
        </Typography>
      )}
    </Box>
  );
}

function PriceOptions({ filters, onChange, facets }) {
  const hi = Math.max(1000, Math.ceil((facets?.price?.max || 10000) / 500) * 500);
  const cur = [filters.minPrice === '' ? 0 : Number(filters.minPrice), filters.maxPrice === '' ? hi : Number(filters.maxPrice)];
  const [val, setVal] = useState(cur);
  useEffect(() => { setVal(cur); }, [filters.minPrice, filters.maxPrice, hi]); // eslint-disable-line react-hooks/exhaustive-deps
  const isRange = (r) => String(r.min) === String(filters.minPrice) && String(r.max) === String(filters.maxPrice);

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
        {PRICE_RANGES.map((r) => (
          <Pill key={r.label} selected={isRange(r)} onClick={() => onChange(isRange(r) ? { minPrice: '', maxPrice: '' } : { minPrice: r.min, maxPrice: r.max })}>{r.label}</Pill>
        ))}
      </Box>
      <Box sx={{ px: 1 }}>
        <Slider
          value={val} min={0} max={hi} step={hi > 5000 ? 100 : 50} onChange={(e, v) => setVal(v)}
          onChangeCommitted={(e, [a, b]) => onChange({ minPrice: a > 0 ? a : '', maxPrice: b < hi ? b : '' })}
          getAriaLabel={(i) => (i ? 'Maximum price' : 'Minimum price')} valueLabelDisplay="auto" valueLabelFormat={inr}
          sx={{ '& .MuiSlider-thumb': { width: 18, height: 18, bgcolor: '#fff', border: '2px solid', borderColor: 'primary.main' } }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        {[['Min', val[0]], ['Max', val[1] >= hi ? `${inr(hi)}+` : val[1]]].map(([k, v]) => (
          <Box key={k} sx={{ flex: 1, px: 1.25, py: 0.6, borderRadius: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: '#FCFAF5' }}>
            <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</Typography>
            <Typography sx={{ fontSize: '0.88rem', fontWeight: 700 }}>{typeof v === 'number' ? inr(v) : v}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/** Renders the options for one filter section; shared by the desktop sidebar and the mobile sheet. */
export default function FilterSection({ section, filters, onChange, facets, categories = [], brands = [] }) {
  switch (section) {
    case 'category': return <CategoryOptions filters={filters} onChange={onChange} categories={categories} facets={facets} />;
    case 'brand': return <BrandOptions filters={filters} onChange={onChange} facets={facets} brands={brands} />;
    case 'price': return <PriceOptions filters={filters} onChange={onChange} facets={facets} />;
    case 'discount':
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {DISCOUNTS.map((d) => {
            const on = String(filters.minDiscount) === String(d);
            return <Pill key={d} selected={on} onClick={() => onChange({ minDiscount: on ? '' : d })}>{d}% or more</Pill>;
          })}
        </Box>
      );
    case 'rating':
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {RATINGS.map((r) => {
            const on = String(filters.minRating) === String(r);
            return <Pill key={r} selected={on} onClick={() => onChange({ minRating: on ? '' : r })}>{r}<StarRoundedIcon sx={{ fontSize: 15, color: on ? '#fff' : '#E0A100', ml: -0.25 }} /> & above</Pill>;
          })}
        </Box>
      );
    case 'availability':
      return (
        <Box component="label" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', pl: 0.5 }}>
          <Typography sx={{ fontSize: '0.86rem' }}>Show in-stock items only</Typography>
          <Switch checked={filters.inStock} onChange={(e) => onChange({ inStock: e.target.checked })} />
        </Box>
      );
    default: return null;
  }
}
