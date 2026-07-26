import { Platform } from "react-native";
import * as Device from "expo-device";

/**
 * Global UI scale factor.
 *
 * The base token values below are tuned for the iPhone (iOS point sizes:
 * 17pt body, etc.). On the much larger iPad canvas the very same absolute
 * point sizes read as cramped and small, so we scale every size-bearing
 * token (typography, spacing, radius, avatars, mono type) up by one factor.
 *
 * This is THE single global knob for "everything looks too small / too big
 * on tablet": change `TABLET_SCALE` and the whole app rescales, because every
 * component reads its sizes from these tokens via the theme.
 *
 * `Platform.isPad` is synchronous and available on the very first render
 * (no flash). `Device.deviceType` covers Android tablets as a fallback.
 */
const TABLET_SCALE = 1.3;

const isTablet =
  (Platform.OS === "ios" && Platform.isPad) ||
  Device.deviceType === Device.DeviceType.TABLET;

export const uiScale = isTablet ? TABLET_SCALE : 1;

/** Scale a numeric token by the global UI scale, rounded to avoid blurry
 *  half-pixel text metrics on native. Exported as `scaleSize` for the few
 *  places that carry a one-off pixel dimension not covered by a named token
 *  (e.g. the tab-bar icon/logo sizes) — route those through here so they grow
 *  on tablet together with everything else. */
const s = (n: number) => Math.round(n * uiScale);

export const scaleSize = s;

export const hairline = 0.5;

export const avatarSize = {
  sm: s(40),
  md: s(46),
  lg: s(48),
  xl: s(92),
} as const;

export const spacing = {
  xs: s(4),
  sm: s(8),
  md: s(12),
  lg: s(16),
  xl: s(20),
  "2xl": s(24),
  "3xl": s(16),
  "4xl": s(40),
  "5xl": s(48),
} as const;

export const radius = {
  xs: s(6),
  sm: s(10),
  md: s(14),
  lg: s(20),
  xl: s(28),
  pill: 100,
} as const;

export const typography = {
  display: { fontSize: s(34), fontWeight: "400" as const, lineHeight: s(41) },
  title1: { fontSize: s(28), fontWeight: "500" as const, lineHeight: s(34) },
  title2: { fontSize: s(22), fontWeight: "500" as const, lineHeight: s(28) },
  body: { fontSize: s(17), fontWeight: "400" as const, lineHeight: s(22) },
  subhead: { fontSize: s(15), fontWeight: "500" as const, lineHeight: s(20) },
  footnote: { fontSize: s(13), fontWeight: "400" as const, lineHeight: s(18) },
  caption: {
    fontSize: s(11),
    fontWeight: "600" as const,
    lineHeight: s(13),
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
    fontSize: s(38),
    fontWeight: "400" as const,
    lineHeight: s(46),
    letterSpacing: 10,
  },
  timestampMono: {
    fontFamily: "DMMono-Regular",
    fontSize: s(10),
    fontWeight: "400" as const,
    lineHeight: s(14),
  },
  codeMono: {
    fontFamily: "DMMono-Medium",
    fontSize: s(13),
    fontWeight: "500" as const,
    lineHeight: s(18),
    letterSpacing: 0.5,
  },
  captionMono: {
    fontFamily: "DMMono-Regular",
    fontSize: s(11),
    fontWeight: "400" as const,
    lineHeight: s(14),
    letterSpacing: 2,
  },
  labelMono: {
    fontFamily: "DMMono-Medium",
    fontSize: s(15),
    fontWeight: "500" as const,
    lineHeight: s(20),
    letterSpacing: 1,
  },
  ttlMono: {
    fontFamily: "DMMono-Medium",
    fontSize: s(11),
    fontWeight: "500" as const,
    lineHeight: s(14),
    letterSpacing: 0.5,
  },
} as const;
