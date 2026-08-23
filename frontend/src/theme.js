import { createTheme } from '@mui/material/styles';

// INDIVO design tokens, matching the official logo: deep black/charcoal + luxury gold on warm
// white — deliberately avoids Amazon-orange / Flipkart-blue / Myntra-pink territory.
const colors = {
  navy: { main: '#161513', light: '#2E2B27', dark: '#0A0908', contrastText: '#FFFFFF' },
  gold: { main: '#C9974B', light: '#E3C48A', dark: '#9C7233', contrastText: '#161513' },
  success: { main: '#1FA97A', light: '#E4F7EF' },
  error: { main: '#E5484D', light: '#FDEAEA' },
  warning: { main: '#F5A623', light: '#FEF3E0' },
  info: { main: '#3B82F6', light: '#E9F1FE' },
  neutral: {
    50: '#FAF8F4',
    100: '#F3EFE7',
    200: '#E6E0D4',
    300: '#CFC6B4',
    600: '#736C5E',
    800: '#332F28',
    900: '#1C1A16',
  },
};

const softShadow = '0 1px 2px rgba(22,21,19,0.05), 0 4px 12px rgba(22,21,19,0.07)';
const liftShadow = '0 8px 24px rgba(22,21,19,0.14)';

const theme = createTheme({
  palette: {
    primary: colors.navy,
    secondary: colors.gold,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    background: { default: colors.neutral[50], paper: '#FFFFFF' },
    text: { primary: colors.neutral[900], secondary: colors.neutral[600] },
    divider: colors.neutral[200],
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shadows: [
    'none',
    softShadow,
    softShadow,
    softShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
    liftShadow,
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.neutral[50] },
        '::selection': { backgroundColor: colors.gold.light },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 18, paddingBlock: 9 },
        sizeLarge: { paddingInline: 24, paddingBlock: 12, fontSize: '1rem' },
        containedPrimary: {
          '&:hover': { backgroundColor: colors.navy.light },
        },
        containedSecondary: {
          color: colors.navy.main,
          '&:hover': { backgroundColor: colors.gold.dark },
        },
        outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: softShadow,
          border: `1px solid ${colors.neutral[200]}`,
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: softShadow },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: '#FFFFFF',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.navy.light },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.navy.main, borderWidth: 1.5 },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: '0 1px 0 rgba(22,21,19,0.1)' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: colors.neutral[800], backgroundColor: colors.neutral[50] },
      },
    },
  },
});

export default theme;
export { colors };
