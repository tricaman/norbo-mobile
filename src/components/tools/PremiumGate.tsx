import React from "react";
import { PremiumPaywall } from "./PremiumPaywall";

interface PremiumGateProps {
  /**
   * Authoritative, server-computed gate for the current user (from the tools
   * list `locked` flag). When true the tool is blocked behind the paywall.
   */
  locked: boolean;
  children: React.ReactNode;
}

/**
 * PremiumGate — the single seam for premium enforcement. When `locked`, it
 * renders the paywall instead of the tool; otherwise it passes through. All
 * the gating logic lives here, so individual tools never change. Note: this
 * client gate is UX only and is bypassable — tools whose value must be truly
 * protected ALSO enforce entitlement server-side (e.g. the reptile guide's
 * content endpoint behind `PremiumGuard`).
 */
export function PremiumGate({
  locked,
  children,
}: PremiumGateProps): React.JSX.Element {
  if (locked) return <PremiumPaywall />;
  return <>{children}</>;
}
