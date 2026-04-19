export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const shadows = {
  glass: {
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  glow: {
    shadowColor: '#f59e0b',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  section: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
} as const;

export const gradients = {
  accent: ['#fbbf24', '#f97316'],
  backgroundDark: ['#0a0a0f', '#111118'],
  backgroundLight: ['#f0eff4', '#e8e7ee'],
} as const;

export const darkTheme = {
  name: 'dark',
  colors: {
    bgPrimary: '#0a0a0f',
    bgSecondary: '#111118',
    bgTertiary: '#1a1a25',
    glassBg: 'rgba(255,255,255,0.06)',
    glassBorder: 'rgba(255,255,255,0.1)',
    glassHover: 'rgba(255,255,255,0.1)',
    textPrimary: '#f0f0f5',
    textSecondary: '#a0a0b8',
    textMuted: '#6b6b80',
    accent: '#f59e0b',
    accentLight: '#fbbf24',
    accentGlow: 'rgba(245,158,11,0.2)',
    danger: '#ef4444',
    success: '#10b981',
    info: '#3b82f6',
  },
  blur: 16,
  cardOpacity: 0.15,
} as const;

export const lightTheme = {
  name: 'light',
  colors: {
    bgPrimary: '#f0eff4',
    bgSecondary: '#e8e7ee',
    bgTertiary: '#dddce4',
    glassBg: 'rgba(255,255,255,0.65)',
    glassBorder: 'rgba(255,255,255,0.5)',
    glassHover: 'rgba(255,255,255,0.8)',
    textPrimary: '#1a1a2e',
    textSecondary: '#4a4a60',
    textMuted: '#8888a0',
    accent: '#f59e0b',
    accentLight: '#fbbf24',
    accentGlow: 'rgba(245,158,11,0.12)',
    danger: '#ef4444',
    success: '#10b981',
    info: '#3b82f6',
  },
  blur: 16,
  cardOpacity: 0.65,
} as const;

export const themeByName = {
  dark: darkTheme,
  light: lightTheme,
} as const;

export type LaundryTheme = typeof darkTheme | typeof lightTheme;
