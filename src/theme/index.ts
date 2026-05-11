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

const primary = "#5B7553";
const accent = "#D4A24C";

export const darkTheme = {
  ...shared,
  colors: {
    background: "#1C1A16",
    surface: "#262320",
    surface2: "#2F2B26",
    surface3: "#36322B",
    surfaceOverlay: "rgba(255,255,255,0.04)",

    border: "#36322B",
    border2: "#4E4840",

    textPrimary: "#F4EFE5",
    textSecondary: "#B5A88B",
    textTertiary: "#8D816A",
    textOnPrimary: "#1C1A16",

    primary: "#7E9970",
    primarySoft: "rgba(126,153,112,0.15)",
    primaryBorder: "#9DB293",

    accent: "#E6B863",
    accentSoft: "#3A2F14",
    accentBorder: "#EFD08A",

    success: "#A8C088",
    successSoft: "#2C3622",
    successBorder: "#4F6B38",

    error: "#D89A86",
    errorSoft: "#3A211B",
    errorBorder: "#8A3D2F",

    warning: "#E6B863",
    warningSoft: "#3A2F14",
    warningBorder: "#8B6722",

    info: "#9CAEBA",
    infoSoft: "#252E33",
    infoBorder: "#4A5E6D",
  },
} as const;

export const lightTheme = {
  ...shared,
  colors: {
    background: "#FAF6EE",
    surface: "#FFFFFF",
    surface2: "#F2EDE3",
    surface3: "#E8E0CF",
    surfaceOverlay: "rgba(0,0,0,0.04)",

    border: "#E8E0CF",
    border2: "#D6CBB2",

    textPrimary: "#2A2620",
    textSecondary: "#6B6358",
    textTertiary: "#8D816A",
    textOnPrimary: "#FAF6EE",

    primary,
    primarySoft: "#EDF2E4",
    primaryBorder: "#A8C088",

    accent,
    accentSoft: "#FBF1D9",
    accentBorder: "#E6C57A",

    success: "#6B8E4E",
    successSoft: "#EDF2E4",
    successBorder: "#A8C088",

    error: "#B85C4A",
    errorSoft: "#F7E4DE",
    errorBorder: "#D89A86",

    warning: "#D4A24C",
    warningSoft: "#FBF1D9",
    warningBorder: "#E6C57A",

    info: "#6B8595",
    infoSoft: "#E6EBEF",
    infoBorder: "#9CAEBA",
  },
} as const;

export type DitTheme = typeof darkTheme;
