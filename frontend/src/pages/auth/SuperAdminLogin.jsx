import { Box } from '@mui/material';
import PortalLoginForm from '../../components/PortalLoginForm';

export default function SuperAdminLogin() {
  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 2 }}>
      <PortalLoginForm
        title="Control Center"
        subtitle="Complete platform access — restricted"
        portalLabel="Super Admin"
        identifierLabel="Email"
        isAllowed={(user) => user.isSuperAdmin === true}
        wrongPortalMessage="This account does not have Super Admin access."
        redirectTo="/super-admin/dashboard"
      />
    </Box>
  );
}
