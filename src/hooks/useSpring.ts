import type { WithSpringConfig } from 'react-native-reanimated';

export const springs = {
  snappy:  { damping: 20, stiffness: 300, mass: 0.1 } satisfies WithSpringConfig,
  default: { damping: 18, stiffness: 200, mass: 0.1 } satisfies WithSpringConfig,
  bouncy:  { damping: 14, stiffness: 180, mass: 0.1 } satisfies WithSpringConfig,
  slow:    { damping: 20, stiffness: 100, mass: 0.1 } satisfies WithSpringConfig,
} as const;

export type SpringPreset = keyof typeof springs;
