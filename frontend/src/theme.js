import { createTheme } from '@mui/material/styles';

// SEESHAA design tokens, sampled from the brand logo: polished gold monogram on a warm champagne
// ground. Pure black is reserved for the logo wordmark; UI accents use a deep bronze that keeps
// strong contrast on white (≈6.7:1) without the heaviness of black. Headings use Jost.
export const ink = '#0E0D0B'; // logo wordmark only
export const champagne = 'linear-gradient(135deg, #FDF8EC 0%, #F6E9C6 50%, #EFD9A0 100%)';
export const champagneSoft = 'linear-gradient(180deg, #FFFCF4 0%, #F8EFD8 100%)';
const colors = {
  navy: { main: '#7A5517', light: '#946A24', dark: '#5C3F10', contrastText: '#FFFFFF' },
  gold: { main: '#C9A04A', light: '#F3D98B', dark: '#9A7228', contrastText: '#0E0D0B' },
  success: { main: '#1E8E62', light: '#E3F4EC' },
  error: { main: '#D6453D', light: '#FBE9E7' },
  warning: { main: '#D9921C', light: '#FDF1DC' },
  info: { main: '#2F6FDB', light: '#E7EFFC' },
  neutral: {
    50: '#FBF8F1',
    100: '#F5EEDF',
    200: '#E9DFC9',
    300: '#D4C5A5',
    600: '#6F6551',
    800: '#2F2A21',
    900: '#16140F',
  },
};

// Polished-gold gradient used for accents (CTAs, rules, badges) — mirrors the monogram.
export const goldGradient = 'linear-gradient(100deg, #9A7228 0%, #D9B45E 35%, #F7E3A1 55%, #C9A04A 80%, #9A7228 100%)';
export const headingFont = "'Jost', 'Plus Jakarta Sans', sans-serif";

const softShadow = '0 1px 2px rgba(14,13,11,0.04), 0 6px 18px rgba(14,13,11,0.06)';
const liftShadow = '0 14px 32px rgba(14,13,11,0.14)';

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
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
    h1: { fontFamily: headingFont, fontWeight: 500, letterSpacing: '0.01em' },
    h2: { fontFamily: headingFont, fontWeight: 500, letterSpacing: '0.01em' },
    h3: { fontFamily: headingFont, fontWeight: 500, letterSpacing: '0.01em' },
    h4: { fontFamily: headingFont, fontWeight: 500, letterSpacing: '0.01em' },
    h5: { fontFamily: headingFont, fontWeight: 500, letterSpacing: '0.02em' },
    h6: { fontFamily: headingFont, fontWeight: 500, letterSpacing: '0.02em' },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    overline: { fontWeight: 600, letterSpacing: '0.28em', lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.02em' },
  },
  shadows: ['none', softShadow, softShadow, softShadow, ...Array(21).fill(liftShadow)],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: colors.neutral[50] },
        '::selection': { backgroundColor: colors.gold.light },
        img: { maxWidth: '100%' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, paddingInline: 20, paddingBlock: 9 },
        sizeLarge: { paddingInline: 28, paddingBlock: 13, fontSize: '0.95rem' },
        containedPrimary: { '&:hover': { backgroundColor: colors.navy.light } },
        containedSecondary: {
          color: '#2B1F08',
          backgroundImage: goldGradient,
          backgroundSize: '200% 100%',
          backgroundPosition: '0% 0',
          transition: 'background-position 0.5s ease, box-shadow 0.2s ease',
          '&:hover': { backgroundPosition: '100% 0', boxShadow: '0 6px 18px rgba(154,114,40,0.35)' },
        },
        outlined: { borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: 'none',
          border: `1px solid ${colors.neutral[200]}`,
          transition: 'box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
        elevation1: { boxShadow: softShadow },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 6, fontWeight: 600 } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.gold.dark },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.gold.main, borderWidth: 1.5 },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { '&.Mui-focused': { color: colors.gold.dark } } } },
    MuiAppBar: { styleOverrides: { root: { boxShadow: 'none' } } },
    MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiTabs: { styleOverrides: { indicator: { backgroundColor: colors.gold.main, height: 2.5 } } },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: colors.neutral[800], backgroundColor: colors.neutral[100] },
      },
    },
  },
});

export default theme;
export { colors };
