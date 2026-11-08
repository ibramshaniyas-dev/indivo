import { Box, Drawer, Typography } from '@mui/material';
import RadioButtonCheckedRoundedIcon from '@mui/icons-material/RadioButtonCheckedRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { SORT_OPTIONS } from './filterModel';

/** Mobile bottom sheet for sort order; picking an option applies it and closes. */
export default function SortSheet({ open, onClose, value, onChange }) {
  return (
    <Drawer anchor="bottom" open={open} onClose={onClose} PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, pb: 'calc(12px + env(safe-area-inset-bottom))' } }}>
      <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider', mx: 'auto', mt: 1 }} />
      <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', px: 2.5, pt: 1.5, pb: 1 }}>Sort by</Typography>
      <Box role="radiogroup" aria-label="Sort by">
        {SORT_OPTIONS.map((o) => {
          const on = (value || '') === o.value;
          return (
            <Box
              key={o.value} component="button" type="button" role="radio" aria-checked={on} onClick={() => { onChange(o.value); onClose(); }}
              sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.4, border: 0, bgcolor: on ? 'rgba(168,106,0,0.07)' : 'transparent', cursor: 'pointer', font: 'inherit', textAlign: 'left' }}
            >
              <Typography sx={{ flex: 1, fontWeight: on ? 800 : 500, color: on ? 'primary.main' : 'text.primary' }}>{o.label}</Typography>
              {on ? <RadioButtonCheckedRoundedIcon sx={{ color: 'primary.main' }} /> : <RadioButtonUncheckedRoundedIcon sx={{ color: 'text.disabled' }} />}
            </Box>
          );
        })}
      </Box>
    </Drawer>
  );
}
