export const CycleTypeColors: Record<string, string> = {
  individual: '#3B82F6',
  family: '#A855F7',
  community: '#14B8A6',
  teen: '#00E676',
};

export const CycleTypeBgColors: Record<string, string> = {
  individual: 'rgba(59, 130, 246, 0.12)',
  family: 'rgba(168, 85, 247, 0.12)',
  community: 'rgba(20, 184, 166, 0.12)',
  teen: 'rgba(0, 230, 118, 0.12)',
};

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  cardElevated: string;
  green: string;
  greenDark: string;
  greenMuted: string;
  greenGlow: string;
  blue: string;
  blueMuted: string;
  orange: string;
  orangeMuted: string;
  purple: string;
  purpleMuted: string;
  red: string;
  redMuted: string;
  teal: string;
  tealMuted: string;
  danger: string;
  dangerMuted: string;
  warning: string;
  warningMuted: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  divider: string;
  surface: string;
  surfaceLight: string;
  greenSoft: string;
  overlay: string;
}

export const DarkTheme: ThemeColors = {
  background: '#050508',
  card: '#0C0E14',
  cardBorder: 'rgba(255, 255, 255, 0.05)',
  cardElevated: '#12151E',
  green: '#00E676',
  greenDark: '#00C853',
  greenMuted: 'rgba(0, 230, 118, 0.10)',
  greenGlow: 'rgba(0, 230, 118, 0.20)',
  blue: '#3B82F6',
  blueMuted: 'rgba(59, 130, 246, 0.10)',
  orange: '#F97316',
  orangeMuted: 'rgba(249, 115, 22, 0.10)',
  purple: '#A855F7',
  purpleMuted: 'rgba(168, 85, 247, 0.10)',
  red: '#EF4444',
  redMuted: 'rgba(239, 68, 68, 0.10)',
  teal: '#14B8A6',
  tealMuted: 'rgba(20, 184, 166, 0.10)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.10)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.10)',
  text: '#F0F0F2',
  textSecondary: 'rgba(240, 240, 242, 0.60)',
  textMuted: 'rgba(240, 240, 242, 0.30)',
  border: 'rgba(255, 255, 255, 0.06)',
  divider: 'rgba(255, 255, 255, 0.04)',
  surface: '#0A0C12',
  surfaceLight: 'rgba(255, 255, 255, 0.06)',
  greenSoft: 'rgba(0, 230, 118, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export const LightTheme: ThemeColors = {
  background: '#F5F5F7',
  card: '#FFFFFF',
  cardBorder: 'rgba(0, 0, 0, 0.06)',
  cardElevated: '#FFFFFF',
  green: '#00B861',
  greenDark: '#009E52',
  greenMuted: 'rgba(0, 184, 97, 0.10)',
  greenGlow: 'rgba(0, 184, 97, 0.15)',
  blue: '#2563EB',
  blueMuted: 'rgba(37, 99, 235, 0.08)',
  orange: '#EA580C',
  orangeMuted: 'rgba(234, 88, 12, 0.08)',
  purple: '#9333EA',
  purpleMuted: 'rgba(147, 51, 234, 0.08)',
  red: '#DC2626',
  redMuted: 'rgba(220, 38, 38, 0.08)',
  teal: '#0D9488',
  tealMuted: 'rgba(13, 148, 136, 0.08)',
  danger: '#DC2626',
  dangerMuted: 'rgba(220, 38, 38, 0.08)',
  warning: '#D97706',
  warningMuted: 'rgba(217, 119, 6, 0.08)',
  text: '#111114',
  textSecondary: 'rgba(17, 17, 20, 0.60)',
  textMuted: 'rgba(17, 17, 20, 0.35)',
  border: 'rgba(0, 0, 0, 0.08)',
  divider: 'rgba(0, 0, 0, 0.05)',
  surface: '#EEEEF0',
  surfaceLight: 'rgba(0, 0, 0, 0.04)',
  greenSoft: 'rgba(0, 184, 97, 0.05)',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

const Colors = { ...DarkTheme } as ThemeColors & {
  light: {
    text: string;
    background: string;
    tint: string;
    tabIconDefault: string;
    tabIconSelected: string;
  };
};

(Colors as unknown as Record<string, unknown>).light = {
  text: '#F0F0F2',
  background: '#050508',
  tint: '#00E676',
  tabIconDefault: 'rgba(240, 240, 242, 0.30)',
  tabIconSelected: '#00E676',
};

export default Colors;
