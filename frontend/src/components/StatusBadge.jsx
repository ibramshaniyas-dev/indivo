import { Chip } from '@mui/material';

const STATUS_COLORS = {
  // generic
  ACTIVE: 'success', APPROVED: 'success', DELIVERED: 'success', COMPLETED: 'success',
  VERIFIED: 'success', PAID: 'success', SUCCESS: 'success', ONLINE: 'success',
  PENDING: 'warning', SUBMITTED: 'warning', UNDER_REVIEW: 'warning', PROCESSING: 'warning',
  DRAFT: 'default', OUT_FOR_DELIVERY: 'warning', PACKED: 'warning', SHIPPED: 'info',
  CONFIRMED: 'info', PLACED: 'info',
  REJECTED: 'error', CANCELLED: 'error', BLOCKED: 'error', SUSPENDED: 'error',
  FAILED: 'error', EXPIRED: 'error', INACTIVE: 'default',
  RETURN_REQUESTED: 'warning', RETURNED: 'default', REFUNDED: 'info', OUT_OF_STOCK: 'error',
};

const MUI_COLOR_MAP = {
  success: { color: 'success.main', bg: 'success.light' },
  warning: { color: 'warning.dark', bg: 'warning.light' },
  error: { color: 'error.main', bg: 'error.light' },
  info: { color: 'info.main', bg: 'info.light' },
  default: { color: 'text.secondary', bg: 'grey.100' },
};

export default function StatusBadge({ status, size = 'small' }) {
  const tone = STATUS_COLORS[status] || 'default';
  const { color, bg } = MUI_COLOR_MAP[tone];
  return (
    <Chip
      size={size}
      label={(status || '').replace(/_/g, ' ')}
      sx={{ color, bgcolor: bg, fontWeight: 700, fontSize: '0.7rem' }}
    />
  );
}
