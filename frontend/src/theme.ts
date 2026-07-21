import { alpha, createTheme } from '@mui/material/styles'

export const appTokens = {
  colors: {
    background: '#F6F7F9',
    surface: '#FFFFFF',
    subtleSurface: '#F9FAFB',
    text: '#17202A',
    secondaryText: '#667085',
    border: '#E4E7EC',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primarySoft: '#EFF6FF',
    success: '#16815D',
    warning: '#B54708',
    error: '#B42318',
    routeCasing: '#FFFFFF',
  },
} as const

const { colors } = appTokens

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary,
      dark: colors.primaryHover,
      light: colors.primarySoft,
      contrastText: colors.surface,
    },
    secondary: {
      main: colors.text,
      contrastText: colors.surface,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.text,
      secondary: colors.secondaryText,
    },
    divider: colors.border,
    success: { main: colors.success },
    warning: { main: colors.warning },
    error: { main: colors.error },
    action: {
      hover: colors.subtleSurface,
      selected: colors.primarySoft,
      focus: alpha(colors.primary, 0.12),
    },
  },
  shape: { borderRadius: 8 },
  spacing: 8,
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontSize: '1.75rem',
      fontWeight: 650,
      letterSpacing: '-0.025em',
      lineHeight: 1.25,
    },
    h2: {
      fontSize: '1.25rem',
      fontWeight: 650,
      letterSpacing: '-0.015em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.45 },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: 0,
    },
  },
  shadows: [
    'none',
    `0 1px 2px ${alpha(colors.text, 0.04)}`,
    ...Array(23).fill(`0 4px 12px ${alpha(colors.text, 0.06)}`),
  ] as ReturnType<typeof createTheme>['shadows'],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--app-background': colors.background,
          '--app-surface': colors.surface,
          '--app-text': colors.text,
          '--app-secondary-text': colors.secondaryText,
          '--app-border': colors.border,
          '--app-primary': colors.primary,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 7,
          paddingInline: 16,
          '&:focus-visible': {
            outline: `3px solid ${alpha(colors.primary, 0.22)}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        maxWidthXl: { maxWidth: '1440px' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
        },
        outlined: { borderColor: colors.border },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 7,
          backgroundColor: colors.surface,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.secondaryText,
          },
          '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(colors.primary, 0.12)}` },
        },
        notchedOutline: { borderColor: colors.border },
      },
    },
    MuiFormLabel: {
      styleOverrides: { root: { fontSize: '0.8125rem' } },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { marginInline: 0, fontSize: '0.72rem' } },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 44 },
        indicator: { height: 2, backgroundColor: colors.primary },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 44,
          padding: '8px 14px',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8125rem',
          color: colors.secondaryText,
          '&.Mui-selected': { color: colors.text, fontWeight: 600 },
          '&:focus-visible': { outline: `2px solid ${colors.primary}`, outlineOffset: -2 },
        },
      },
    },
    MuiChip: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          height: 24,
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.72rem',
          backgroundColor: colors.subtleSurface,
        },
        outlined: { borderColor: colors.border },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, border: `1px solid ${colors.border}`, boxShadow: 'none' },
        message: { width: '100%' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          backgroundColor: colors.text,
          fontSize: '0.72rem',
          fontWeight: 400,
        },
        arrow: { color: colors.text },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: colors.border } },
    },
    MuiSlider: {
      styleOverrides: {
        thumb: { width: 16, height: 16 },
        rail: { opacity: 1, backgroundColor: colors.border },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 4, borderRadius: 2, backgroundColor: colors.border },
      },
    },
  },
})
