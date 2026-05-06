---
trigger: manual
description: "Reanimated 3 patterns. @mention when writing animations, shared values, or gesture callbacks."
---

> LIVING DOCUMENT — update when a new spring preset is added or a pattern changes.

## Spring presets (src/hooks/useSpring.ts)

snappy → damping:20, stiffness:300 — small UI: pills, badges, quick feedback
default → damping:18, stiffness:200 — general: cards, buttons, inputs
bouncy → damping:14, stiffness:180 — playful: ping sent bubble, dah dot
slow → damping:20, stiffness:100 — large: screen transitions, bottom sheets

Always: withSpring(value, springs.default)
Never: withSpring(value, { damping: 15, stiffness: 120 }) // inline is banned

## withTiming allowed cases (exhaustive list)

- Progress bar fill width
- Loading spinner rotation (via Animated.loop)
- Numeric value readout interpolation
- Screen transition duration driven by navigation library

## useSharedValue ownership

Lives in the component that renders it. Never in Zustand, React Query, or Context.
If two components need to share an animated value, lift the shared value to their
common ancestor and pass the value as a prop.

## runOnJS requirement

Any call to JS-thread code from a gesture callback or worklet:
const triggerOnJS = useCallback(() => { /_ JS thread work _/ }, []);
// inside gesture:
runOnJS(triggerOnJS)();

## Skia + Reanimated

Pass Reanimated shared values to Skia components via useDerivedValue().
Never update Skia canvas state with useState — always shared values.
