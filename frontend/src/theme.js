import { createTheme } from '@mui/material/styles';

// INDIVO design tokens — deep navy (trust, premium) + warm gold (Indian marketplace, festive quality)
// deliberately avoids Amazon-orange / Flipkart-blue / Myntra-pink territory.
const colors = {
  navy: { main: '#121F42', light: '#26355F', dark: '#070D20', contrastText: '#FFFFFF' },
  gold: { main: '#E3A63E', light: '#F2C572', dark: '#B8841F', contrastText: '#121F42' },
  success: { main: '#1FA97A', light: '#E4F7EF' },
  error: { main: '#E5484D', light: '#FDEAEA' },
  warning: { main: '#F5A623', light: '#FEF3E0' },
  info: { main: '#3B82F6', light: '#E9F1FE' },
  neutral: {
    50: '#F8F8FB',
    100: '#F1F1F6',
    200: '#E4E4ED',
    300: '#CFD0DB',
    600: '#6C6F80',
    800: '#33364A',
    900: '#171A2B',
  },
};

const softShadow = '0 1px 2px rgba(18,31,66,0.04), 0 4px 12px rgba(18,31,66,0.06)';
const liftShadow = '0 8px 24px rgba(18,31,66,0.12)';

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
        root: { boxShadow: '0 1px 0 rgba(18,31,66,0.08)' },
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
