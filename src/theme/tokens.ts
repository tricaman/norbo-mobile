export const hairline = 0.5;

export const avatarSize = {
  sm: 40,
  md: 46,
  lg: 48,
  xl: 92,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 100,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: "400" as const, lineHeight: 41 },
  title1: { fontSize: 28, fontWeight: "500" as const, lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: "500" as const, lineHeight: 28 },
  body: { fontSize: 17, fontWeight: "400" as const, lineHeight: 22 },
  subhead: { fontSize: 15, fontWeight: "500" as const, lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  caption: {
    fontSize: 11,
    fontWeight: "600" as const,
    lineHeight: 13,
    letterSpacing: 0.08,
    textTransform: "uppercase" as const,
  },
} as const;

/**
 * Centralized card styling token.
 * Change these values once to update every card in the app.
 */
export const card = {
  borderRadius: radius.lg,
  borderWidth: 0,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
  elevation: 1,
} as const;

export const pressScale = {
  row: 0.97,
  card: 0.96,
  cta: 0.94,
  text: 0.7,
} as const;

export const monoTypography = {
  displayMono: {
    fontFamily: "DMMono-Regular",
    fontSize: 38,
    fontWeight: "400" as const,
    lineHeight: 46,
    letterSpacing: 10,
  },
  timestampMono: {
    fontFamily: "DMMono-Regular",
    fontSize: 10,
    fontWeight: "400" as const,
    lineHeight: 14,
  },
  codeMono: {
    fontFamily: "DMMono-Medium",
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  captionMono: {
    fontFamily: "DMMono-Regular",
    fontSize: 11,
    fontWeight: "400" as const,
    lineHeight: 14,
    letterSpacing: 2,
  },
  labelMono: {
    fontFamily: "DMMono-Medium",
    fontSize: 15,
    fontWeight: "500" as const,
    lineHeight: 20,
    letterSpacing: 1,
  },
  ttlMono: {
    fontFamily: "DMMono-Medium",
    fontSize: 11,
    fontWeight: "500" as const,
    lineHeight: 14,
    letterSpacing: 0.5,
  },
} as const;
