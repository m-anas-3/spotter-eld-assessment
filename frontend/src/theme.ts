import { alpha, createTheme } from '@mui/material/styles'

const brand = '#146B5A'
const navy = '#17212F'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brand,
      dark: '#0D5144',
      light: '#E3F2EE',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E9983E',
    },
    background: {
      default: '#F4F7F9',
      paper: '#FFFFFF',
    },
    text: {
      primary: navy,
      secondary: '#607080',
    },
    divider: '#E1E8EC',
    error: {
      main: '#C53B3B',
    },
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
      fontWeight: 750,
      letterSpacing: '-0.035em',
      lineHeight: 1.12,
    },
    h2: {
      fontSize: '1.35rem',
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontSize: '1rem',
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    `0 1px 2px ${alpha(navy, 0.04)}, 0 8px 24px ${alpha(navy, 0.05)}`,
    ...Array(23).fill(`0 12px 32px ${alpha(navy, 0.08)}`),
  ] as ReturnType<typeof createTheme>['shadows'],
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          minHeight: 46,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #E1E8EC',
          boxShadow: `0 1px 2px ${alpha(navy, 0.025)}, 0 8px 24px ${alpha(navy, 0.035)}`,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
  },
})
