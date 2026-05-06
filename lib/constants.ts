// Design system tokens for The Reading Gym
// Theme: Black & Gold — premium, dark, editorial

const Palette = {
  bg: {
    base:    '#0C0C0C',   // near-black
    surface: '#181818',   // dark card
    card:    'rgba(201,168,76,0.08)', // gold-tinted surface
  },
  gold: {
    vivid:  '#F0C040',   // bright gold — XP, streaks, highlights
    rich:   '#C9A84C',   // primary gold — buttons, accents
    deep:   '#8B6B14',   // dark gold — pressed states, gradients
    dim:    'rgba(201,168,76,0.12)',
    glow:   'rgba(201,168,76,0.30)',
    border: 'rgba(201,168,76,0.25)',
  },
  text: {
    primary: '#F7F3ED',  // warm off-white
    muted:   'rgba(247,243,237,0.45)',
    faint:   'rgba(247,243,237,0.22)',
  },
  status: {
    success:    '#4ADE80',
    successDim: 'rgba(74,222,128,0.15)',
    danger:     '#E05555',
    dangerDim:  'rgba(224,85,85,0.15)',
  },
};

export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────────
  bg:            Palette.bg.base,
  surface:       Palette.bg.surface,
  surfaceRaised: Palette.bg.card,
  surfaceBorder: Palette.gold.border,

  // ── Primary accent (gold) ────────────────────────────────────
  accent:        Palette.gold.rich,
  accentLight:   Palette.gold.vivid,
  accentDim:     Palette.gold.dim,
  accentGlow:    Palette.gold.glow,

  // ── Gold (XP / streaks — same family, brighter) ──────────────
  gold:          Palette.gold.vivid,
  goldDim:       Palette.gold.dim,

  // ── Semantic ─────────────────────────────────────────────────
  success:       Palette.status.success,
  successDim:    Palette.status.successDim,
  danger:        Palette.status.danger,
  dangerDim:     Palette.status.dangerDim,
  warning:       Palette.gold.vivid,

  // ── Text ─────────────────────────────────────────────────────
  text:          Palette.text.primary,
  textSecondary: Palette.text.muted,
  textMuted:     Palette.text.muted,
  textDisabled:  Palette.text.faint,

  // ── Reaction accent colours ───────────────────────────────────
  // All within the gold family so nothing clashes with the theme.
  intensityStrong:   Palette.gold.vivid,
  intensityModerate: Palette.gold.rich,
  intensityMild:     Palette.gold.deep,

  // ── Tab bar ──────────────────────────────────────────────────
  tabActive:   Palette.gold.rich,
  tabInactive: Palette.text.muted,

  // ── XP gradient (dark gold → vivid gold) ─────────────────────
  xpGradient: [Palette.gold.deep, Palette.gold.rich, Palette.gold.vivid] as const,
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radii = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
};

export const FontSize = {
  xs:      11,
  sm:      13,
  md:      15,
  lg:      17,
  xl:      20,
  xxl:     24,
  xxxl:    30,
  display: 38,
};

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
};

// Reaction chips — all gold shades so they feel cohesive
export const REACTIONS = [
  { type: 'twist',     emoji: '😱', label: 'Plot Twist',     intensity: 'strong'   },
  { type: 'favorite',  emoji: '🔥', label: 'Favorite Scene', intensity: 'mild'     },
  { type: 'emotional', emoji: '😭', label: 'Emotional',       intensity: 'moderate' },
] as const;

export type ReactionType      = typeof REACTIONS[number]['type'];
export type ReactionIntensity = 'strong' | 'moderate' | 'mild';

export const INTENSITY_LABELS: Record<ReactionIntensity, string> = {
  strong:   'Intense',
  moderate: 'Emotional',
  mild:     'Notable',
};

export const CHIP_COLORS: Record<ReactionType, string> = {
  twist:     Palette.gold.vivid,
  favorite:  Palette.gold.rich,
  emotional: Palette.gold.deep,
};
