import { useEffect, useState } from 'react';
import { Box, Drawer, Typography, Button, IconButton, CircularProgress } from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FilterSection from './FilterSection';
import { SECTIONS, sectionActive, toQuery, EMPTY_FILTERS, activeCount } from './filterModel';
import { listProducts } from '../../services/product.service';

/**
 * Full-height bottom sheet, two panes (sections | options) like the big marketplaces.
 * Edits a draft; the footer shows the live result count for the draft before applying.
 */
export default function MobileFilterSheet({ open, onClose, filters, onApply, q, categories, brands, initialSection = 'category' }) {
  const [draft, setDraft] = useState(filters);
  const [section, setSection] = useState(initialSection);
  const [preview, setPreview] = useState({ total: null, facets: null, loading: false });

  useEffect(() => { if (open) { setDraft(filters); setSection(initialSection); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    setPreview((p) => ({ ...p, loading: true }));
    const t = setTimeout(() => {
      listProducts({ ...toQuery(draft, q), limit: 1, facets: 1 })
        .then((r) => alive && setPreview({ total: r.meta.total, facets: r.meta.facets, loading: false }))
        .catch(() => alive && setPreview((p) => ({ ...p, loading: false })));
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [draft, open, q]);

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const n = activeCount(draft);

  return (
    <Drawer
      anchor="bottom" open={open} onClose={onClose}
      PaperProps={{ sx: { height: '92dvh', borderTopLeftRadius: 20, borderTopRightRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
    >
      <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mt: 1 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', flex: 1 }}>Filters{n ? ` (${n})` : ''}</Typography>
        {n > 0 && <Button size="small" onClick={() => setDraft(EMPTY_FILTERS)} sx={{ color: '#C62828', fontWeight: 700, mr: 0.5 }}>Clear all</Button>}
        <IconButton aria-label="Close filters" onClick={onClose}><CloseRoundedIcon /></IconButton>
      </Box>

      <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '128px 1fr', minHeight: 0 }}>
        <Box role="tablist" aria-orientation="vertical" sx={{ bgcolor: '#F5F0E6', overflowY: 'auto' }}>
          {SECTIONS.map(({ key, label }) => {
            const on = key === section;
            return (
              <Box
                key={key} component="button" type="button" role="tab" aria-selected={on} onClick={() => setSection(key)}
                sx={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 0.75, textAlign: 'left', border: 0, cursor: 'pointer', font: 'inherit',
                  px: 1.5, py: 1.75, fontSize: '0.84rem', fontWeight: on ? 800 : 500, color: on ? 'primary.main' : 'text.primary',
                  bgcolor: on ? '#fff' : 'transparent', borderLeft: '3px solid', borderLeftColor: on ? 'secondary.main' : 'transparent',
                }}
              >
                <Box component="span" sx={{ flex: 1 }}>{label}</Box>
                {sectionActive(key, draft) && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'secondary.main', flexShrink: 0 }} />}
              </Box>
            );
          })}
        </Box>
        <Box role="tabpanel" sx={{ overflowY: 'auto', p: 1.5 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 1, px: 0.5 }}>
            {SECTIONS.find((s) => s.key === section)?.label}
          </Typography>
          <FilterSection section={section} filters={draft} onChange={patch} facets={preview.facets} categories={categories} brands={brands} />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, pb: 'calc(10px + env(safe-area-inset-bottom))', borderTop: '1px solid', borderColor: 'divider', boxShadow: '0 -6px 16px rgba(14,13,11,0.06)' }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.1 }}>
            {preview.total == null ? '—' : preview.total.toLocaleString('en-IN')}
          </Typography>
          <Typography variant="caption" color="text.secondary">products found</Typography>
        </Box>
        <Button
          variant="contained" size="large" disabled={preview.total === 0} onClick={() => { onApply(draft); onClose(); }}
          sx={{ flex: 1.4, borderRadius: 999, py: 1.1, fontWeight: 800 }}
          startIcon={preview.loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {preview.total === 0 ? 'No matches' : 'Show results'}
        </Button>
      </Box>
    </Drawer>
  );
}
