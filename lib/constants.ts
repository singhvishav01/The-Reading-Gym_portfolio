// Design system tokens for The Reading Gym
// Carnival theme - fire orange x gold x hot pink

const CarnivalPalette = {
  bg: {
    base:    '#16060a',
    surface: '#2a0d10',
    card:    'rgba(232,83,26,0.13)',
  },
  accent: {
    fire:   '#e8531a',
    gold:   '#f0b429',
    pink:   '#d4537e',
  },
  text: {
    primary:   '#faf7f2',
    fire:      '#ff9d6e',
    gold:      '#ffd97d',
    pink:      '#ed93b1',
    muted:     'rgba(250,247,242,0.45)',
  },
  border: {
    fire:   'rgba(232,83,26,0.4)',
    gold:   'rgba(240,180,41,0.35)',
    pink:   'rgba(212,83,126,0.35)',
  },
  xpGradient: ['#e8531a', '#f0b429', '#d4537e'] as const,
  statColors: ['fire', 'gold', 'pink'],
};

export const Colors = {
  ...CarnivalPalette, // for new components
  
  // Backgrounds
  bg: CarnivalPalette.bg.base,
  surface: CarnivalPalette.bg.surface,
  surfaceRaised: CarnivalPalette.bg.card,
  surfaceBorder: CarnivalPalette.border.fire,

  // Accent / Brand
  accent: CarnivalPalette.accent.fire,
  accentLight: CarnivalPalette.accent.gold,
  accentDim: 'rgba(232,83,26,0.15)',
  accentGlow: 'rgba(232,83,26,0.35)',

  // Gold for XP / streaks
  gold: CarnivalPalette.accent.gold,
  goldDim: 'rgba(240,180,41,0.15)',

  // Semantic
  success: '#4ADE80',
  successDim: 'rgba(74,222,128,0.15)',
  danger: CarnivalPalette.accent.pink,
  dangerDim: 'rgba(212,83,126,0.15)',
  warning: CarnivalPalette.accent.gold,

  // Text
  text: CarnivalPalette.text.primary,
  textSecondary: CarnivalPalette.text.muted,
  textMuted: CarnivalPalette.text.muted,
  textDisabled: 'rgba(250,247,242,0.25)',

  // Intensity colors (for spoiler-safe reactions)
  intensityStrong: CarnivalPalette.accent.fire,
  intensityModerate: CarnivalPalette.accent.pink,
  intensityMild: CarnivalPalette.accent.gold,

  // Tab bar
  tabActive: CarnivalPalette.accent.fire,
  tabInactive: CarnivalPalette.text.muted,
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
  { type: 'twist',     emoji: '😱', label: 'Plot Twist',    intensity: 'strong' },
  { type: 'favorite',  emoji: '🔥', label: 'Favorite Scene', intensity: 'mild' },
  { type: 'emotional', emoji: '😭', label: 'Emotional',     intensity: 'moderate' },
] as const;

export type ReactionType = typeof REACTIONS[number]['type'];
export type ReactionIntensity = 'strong' | 'moderate' | 'mild';

export const INTENSITY_LABELS: Record<ReactionIntensity, string> = {
  strong:   'Intense',
  moderate: 'Emotional',
  mild:     'Notable',
};

// Map the new chip colors as requested by the user
export const CHIP_COLORS: Record<ReactionType, string> = {
  twist:     CarnivalPalette.accent.fire,
  favorite:  CarnivalPalette.accent.gold,
  emotional: CarnivalPalette.accent.pink,
};
