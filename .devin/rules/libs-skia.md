---
trigger: manual
description: "React Native Skia patterns. @mention when working on PingTimeline."
---

> LIVING DOCUMENT — update when PingTimeline adds new visual features.

## Scope
PingTimeline is the only component using Skia. Do not use Skia elsewhere.

## Canvas sizing
<Canvas style={{ width: exactNumber, height: exactNumber }}>
Never: style={{ flex: 1 }} — Canvas requires explicit dimensions.
Compute height from events.length before rendering.

## Color from theme
Skia primitives accept string colors. Get from theme before Canvas:
const { theme } = useStyles();
const primaryColor = theme.colors.primary; // pass as prop into Canvas children

## Animating via Reanimated
import { useValue, useComputedValue } from '@shopify/react-native-skia';
// OR pass Reanimated shared values directly to Skia animated components.
Never: update Skia with useState/useEffect.

## Arrow drawing
Use Skia Path for arrows. Build path imperatively:
const path = Skia.Path.Make();
path.moveTo(startX, y);
path.lineTo(endX, y);
// Add arrowhead as a small triangle at endX
Status color mapping:
  acked   → theme.colors.success
  pending → theme.colors.textSecondary
  expired → theme.colors.textTertiary
  ignored → theme.colors.error
