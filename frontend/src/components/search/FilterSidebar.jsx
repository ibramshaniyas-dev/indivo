import { useState } from 'react';
import { Box, Paper, Typography, Collapse, Divider } from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import FilterSection from './FilterSection';
import { SECTIONS, sectionActive, clearSection, activeCount } from './filterModel';

/** Desktop filter column: sticky, collapsible sections, per-section "Clear". Changes apply instantly. */
export default function FilterSidebar({ filters, onChange, onClearAll, facets, categories, brands }) {
  const [closed, setClosed] = useState({});
  const n = activeCount(filters);
  return (
    <Paper
      sx={{
        position: 'sticky', top: 140, maxHeight: 'calc(100vh - 156px)', overflowY: 'auto', borderRadius: 3, p: 0,
        scrollbarWidth: 'thin', boxShadow: '0 6px 24px rgba(14,13,11,0.06)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, position: 'sticky', top: 0, bgcolor: '#fff', zIndex: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TuneRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography sx={{ fontWeight: 800, flex: 1 }}>Filters{n ? ` (${n})` : ''}</Typography>
        {n > 0 && (
          <Typography component="button" type="button" onClick={onClearAll} sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', color: '#C62828', fontWeight: 700, fontSize: '0.78rem' }}>
            Clear all
          </Typography>
        )}
      </Box>
      {SECTIONS.map(({ key, label }, i) => {
        const open = !closed[key];
        const active = sectionActive(key, filters);
        return (
          <Box key={key}>
            {i > 0 && <Divider />}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 2, pt: 1.5, pb: open ? 1 : 1.5 }}>
              <Box
                component="button" type="button" aria-expanded={open} onClick={() => setClosed((c) => ({ ...c, [key]: open }))}
                sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0.75, border: 0, bgcolor: 'transparent', p: 0, cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
              >
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.primary' }}>{label}</Typography>
                {active && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'secondary.main' }} />}
                <ExpandMoreRoundedIcon sx={{ ml: 'auto', fontSize: 20, color: 'text.secondary', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </Box>
              {active && (
                <Typography component="button" type="button" onClick={() => onChange(clearSection(key))} sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', color: 'primary.main', fontWeight: 700, fontSize: '0.72rem', ml: 1 }}>
                  Clear
                </Typography>
              )}
            </Box>
            <Collapse in={open}>
              <Box sx={{ px: 1.5, pb: 2 }}>
                <FilterSection section={key} filters={filters} onChange={onChange} facets={facets} categories={categories} brands={brands} />
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Paper>
  );
}
