import { Box, Container, Typography, Paper, Grid, Link as MuiLink } from '@mui/material';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import useStoreSettings from '../../hooks/useStoreSettings';

/** Contact details come from Super Admin → Settings → Store Profile (nothing hardcoded here). */
export default function Contact() {
  const { general } = useStoreSettings();
  const digits = (v) => String(v || '').replace(/\D/g, '');

  const items = [
    general.support_email && { icon: EmailRoundedIcon, label: 'Email', value: general.support_email, href: `mailto:${general.support_email}` },
    general.support_phone && { icon: PhoneRoundedIcon, label: 'Phone', value: general.support_phone, href: `tel:${digits(general.support_phone)}` },
    general.whatsapp_number && { icon: WhatsAppIcon, label: 'WhatsApp', value: general.whatsapp_number, href: `https://wa.me/${digits(general.whatsapp_number)}` },
    general.business_address && { icon: LocationOnRoundedIcon, label: 'Address', value: general.business_address },
  ].filter(Boolean);

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Typography variant="h4" gutterBottom>Contact Us</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Have a question about an order, a seller account, or anything else? Reach out to the {general.site_name} team.
      </Typography>
      <Paper sx={{ p: 3 }}>
        {items.length === 0 ? (
          <Typography color="text.secondary">Contact details will be available soon.</Typography>
        ) : (
          <Grid container spacing={2.5}>
            {items.map((item) => (
              <Grid item xs={12} key={item.label}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <item.icon color="secondary" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                    {item.href ? (
                      <MuiLink href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" underline="hover" sx={{ display: 'block', color: 'text.primary' }}>
                        {item.value}
                      </MuiLink>
                    ) : (
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{item.value}</Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
}
