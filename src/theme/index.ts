import {
  avatarSize,
  hairline,
  monoTypography,
  pressScale,
  radius,
  spacing,
  typography,
} from "./tokens";

const fonts = {
  mono: "DMMono-Regular" as string | undefined,
  monoMd: "DMMono-Medium" as string | undefined,
  system: undefined as string | undefined,
} as const;

const shared = {
  spacing,
  radius,
  typography,
  pressScale,
  monoTypography,
  fonts,
  hairline,
  avatarSize,
};

const primary = "#52C71F";
const success = "#52C71F";

export const darkTheme = {
  ...shared,
  colors: {
    background: "#000000",
    surface: "#1C1C1E",
    surface2: "#28282A",
    surface3: "#333336",
    surfaceOverlay: "rgba(255,255,255,0.06)",

    border: "rgba(255,255,255,0.10)",
    border2: "rgba(255,255,255,0.18)",

    textPrimary: "#F2F2F4",
    textSecondary: "#B4B4BE",
    textTertiary: "#8A8A92",
    textOnPrimary: "#060F08",

    primary,
    primarySoft: "rgba(0,255,128,0.15)",
    primaryBorder: "rgba(0,255,128,0.25)",

    success,
    successSoft: "rgba(0,255,128,0.15)",

    error: "#FF453A",
    errorSoft: "rgba(255,68,58,0.13)",
    errorBorder: "rgba(255,68,58,0.22)",

    warning: "#FF9F0A",
    warningSoft: "rgba(255,159,10,0.13)",
    warningBorder: "rgba(255,159,10,0.22)",

    info: "#0A84FF",
    infoSoft: "rgba(10,132,255,0.13)",
    infoBorder: "rgba(10,132,255,0.22)",
  },
} as const;

export const lightTheme = {
  ...shared,
  colors: {
    background: "#EAEAEE",
    surface: "#FFFFFF",
    surface2: "#F0F0F3",
    surface3: "#E8E8EC",
    surfaceOverlay: "rgba(0,0,0,0.04)",

    border: "rgba(0,0,0,0.07)",
    border2: "rgba(0,0,0,0.13)",

    textPrimary: "#0E0E10",
    textSecondary: "#42424A",
    textTertiary: "#6E6E76",
    textOnPrimary: "#FFFFFF",

    primary,
    primarySoft: "rgba(0,122,56,0.12)",
    primaryBorder: "rgba(0,122,56,0.22)",
    success,
    successSoft: "rgba(0,122,56,0.12)",

    error: "#FF3B30",
    errorSoft: "rgba(255,59,48,0.10)",
    errorBorder: "rgba(255,59,48,0.18)",

    warning: "#FF9500",
    warningSoft: "rgba(255,149,0,0.10)",
    warningBorder: "rgba(255,149,0,0.18)",

    info: "#007AFF",
    infoSoft: "rgba(0,122,255,0.10)",
    infoBorder: "rgba(0,122,255,0.18)",
  },
} as const;

export type DitTheme = typeof darkTheme;
