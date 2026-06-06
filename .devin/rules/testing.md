---
trigger: glob
globs: "**/*.test.ts,**/*.test.tsx"
---

> LIVING DOCUMENT — update this file whenever you:
> introduce a new pattern, convention, or architectural decision;
> discover a library behaviour that differs from what is written here;
> add a new dependency that has rules worth capturing;
> fix a bug caused by violating a rule that is not yet documented.

# Testing Standards — norbo-mobile

## Framework

- React Native Testing Library for component tests.
- Jest as test runner.

## Component Tests

- Test user interactions, not component internals (no testing internal state or private methods).
- Use `render()`, `fireEvent`, `waitFor` from `@testing-library/react-native`.
- Query by accessibility role, text, or testID — never by component tree structure.
- Snapshot tests for static UI components only. Not for data-driven components.

## Mocking

- Mock `src/services/api.ts` at module level. Never make real HTTP calls in tests.
- Mock `react-native-mmkv` with a jest mock (in-memory Map).
- Mock `@notifee/react-native` with a jest mock that tracks displayed notifications.
- Mock `@react-native-firebase/messaging` for token registration tests.

## Patterns

```typescript
// Component test
it('shows sender name on incoming ping', async () => {
  render(<PingCard ping={mockPing} />);
  expect(screen.getByText('Alice pinged you')).toBeTruthy();
});

// Interaction test
it('calls dahPing when dah button pressed', async () => {
  const dahPing = jest.fn();
  render(<PingCard ping={mockPing} onDah={dahPing} />);
  fireEvent.press(screen.getByRole('button', { name: 'Dah' }));
  expect(dahPing).toHaveBeenCalledWith(mockPing.pingId);
});
```

## Store Tests

- Test Zustand stores by calling actions and asserting state changes.
- Use `act()` wrapper for async store actions.
- Reset store state in `beforeEach`.

## Rules

- Every new screen: at least one render test + one interaction test.
- Every new hook: at least one happy path test.
- Never test implementation details (which internal function was called). Test observable behaviour.
