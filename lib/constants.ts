// Design system tokens for The Reading Gym
// Dark-mode first, premium aesthetic

export const Colors = {
  // Backgrounds
  bg: '#0D0F14',
  surface: '#13161E',
  surfaceRaised: '#1A1E2A',
  surfaceBorder: '#252A3A',

  // Accent / Brand
  accent: '#7B68EE',        // medium slate purple
  accentLight: '#9B8FFF',
  accentDim: 'rgba(123,104,238,0.15)',
  accentGlow: 'rgba(123,104,238,0.35)',

  // Gold for XP / streaks
  gold: '#F5A623',
  goldDim: 'rgba(245,166,35,0.15)',

  // Semantic
  success: '#4ADE80',
  successDim: 'rgba(74,222,128,0.15)',
  danger: '#F87171',
  dangerDim: 'rgba(248,113,113,0.15)',
  warning: '#FBBF24',

  // Text
  text: '#F0F2F8',
  textSecondary: '#A0A5BE',
  textMuted: '#606580',
  textDisabled: '#3A3F55',

  // Intensity colors (for spoiler-safe reactions)
  intensityStrong: '#F87171',    // red-ish
  intensityModerate: '#FBBF24',  // amber
  intensityMild: '#60A5FA',      // blue

  // Tab bar
  tabActive: '#7B68EE',
  tabInactive: '#606580',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Reaction types and their properties
export const REACTIONS = [
  { type: 'plot_twist',  emoji: '😱', label: 'Plot Twist',    intensity: 'strong' },
  { type: 'mind_blown',  emoji: '🤯', label: 'Mind Blown',    intensity: 'strong' },
  { type: 'emotional',   emoji: '😭', label: 'Emotional',     intensity: 'moderate' },
  { type: 'suspicious',  emoji: '🕵️', label: 'Suspicious',    intensity: 'mild' },
  { type: 'favorite',    emoji: '🔥', label: 'Favorite Scene', intensity: 'mild' },
] as const;

export type ReactionType = typeof REACTIONS[number]['type'];
export type ReactionIntensity = 'strong' | 'moderate' | 'mild';

export const INTENSITY_LABELS: Record<ReactionIntensity, string> = {
  strong:   'Intense',
  moderate: 'Emotional',
  mild:     'Notable',
};

export const INTENSITY_COLORS: Record<ReactionIntensity, string> = {
  strong:   Colors.intensityStrong,
  moderate: Colors.intensityModerate,
  mild:     Colors.intensityMild,
};
