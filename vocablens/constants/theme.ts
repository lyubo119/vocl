/**
 * Design tokens from STYLE_GUIDE.md
 * Single source of truth for all visual styling.
 */

export const colors = {
  // Backgrounds
  bgPrimary: '#020202',
  bgHeader: '#020205',
  bgCard: '#101010',
  bgCardContrast: '#4b4b51',
  bgCardSolution: '#bfbfbf',
  bgButtonSub: '#1f1f1f',
  bgMockup: '#060606',
  bgInput: '#1f1f1f',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textSubheading: '#cccccc',
  textButton: '#1a1a1a',
  textCtaUnfocused: '#b4b4b4',
  textCardAccent: '#e1e1e7',

  // Accents & UI
  accentPurple: '#d1a0d7',
  borderNav: '#808080',
  divider: '#2b2b2b',
  inactiveLogo: '#4e4e4e',

  // Interactions
  hoverLinkBg: '#cdcdcd',

  // Semantic
  success: '#70cc81',
  error: '#ff6b6b',
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 32,
  xl: 64,
  xxl: 96,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const typography = {
  // H1 Hero — Aeonik 4.5rem → ~36pt on mobile (scaled down for mobile)
  h1: {
    fontSize: 36,
    fontWeight: '500' as const,
    lineHeight: 45,
    color: colors.textPrimary,
  },
  // H2 — Aeonik 1.875rem
  h2: {
    fontSize: 30,
    fontWeight: '400' as const,
    color: colors.textPrimary,
  },
  // H3 — Inter 1.25rem
  h3: {
    fontSize: 20,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.textPrimary,
  },
  // Subheading — Inter 1.125rem
  subheading: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 26,
    color: colors.textSubheading,
  },
  // Body — Inter 1rem
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  // Button — Inter 0.8125–0.875rem
  button: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textButton,
  },
  // Small caps — Geist 0.75rem
  smallCaps: {
    fontSize: 12,
    fontWeight: '300' as const,
    lineHeight: 18,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: colors.textSecondary,
  },
  // Footer heading — Aeonik 0.75rem
  footerHead: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    color: colors.textSecondary,
  },
};

/**
 * Shared component styles following STYLE_GUIDE.md patterns.
 */
export const componentStyles = {
  // Primary button: white bg, dark text, squircle
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radii.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 40,
  },
  primaryButtonText: {
    color: colors.textButton,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  // Secondary button: dark bg, white text
  secondaryButton: {
    backgroundColor: colors.bgButtonSub,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: radii.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 40,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  // Card: dark bg, squircle, subtle glow
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.m,
  },
  // Input field: dark bg, rounded, white text
  input: {
    backgroundColor: colors.bgInput,
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: spacing.m,
    fontSize: 16,
    color: colors.textPrimary,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
};
