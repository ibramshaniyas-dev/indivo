import { Box, Typography, Button } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory2Outlined';

export default function EmptyState({ icon: Icon = InventoryIcon, title, description, actionLabel, onAction }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <Box
        sx={{
          width: 72, height: 72, borderRadius: '50%', bgcolor: 'grey.100',
          display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
        }}
      >
        <Icon sx={{ fontSize: 32, color: 'text.secondary' }} />
      </Box>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mx: 'auto', mb: actionLabel ? 3 : 0 }}>
          {description}
        </Typography>
      )}
      {actionLabel && (
        <Button variant="contained" onClick={onAction}>{actionLabel}</Button>
      )}
    </Box>
  );
}
