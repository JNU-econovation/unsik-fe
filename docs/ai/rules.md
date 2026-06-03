# Coding Rules

## Architecture

- Keep route files thin. Move reusable rendering and business logic into
  components, hooks, or feature modules as the app grows.
- Prefer `@/` imports over long relative paths.
- Keep platform-specific code explicit with `.ios.tsx`, `.android.tsx`, or
  `.web.tsx` files when behavior genuinely differs.
- Use Expo Router conventions for navigation instead of ad hoc navigation state.

## Dependencies

- Check SDK compatibility before adding React Native libraries.
- Use `npx.cmd expo install <package>` for Expo-managed native dependencies.
- Avoid ejecting or prebuilding unless the task explicitly requires native code.

## UI

- Use React Native primitives and Expo-compatible libraries; do not rely on DOM
  APIs for native screens.
- Respect safe areas, keyboard overlap, dynamic text sizes, and touch targets.
- Add accessible labels/roles for interactive controls.
- Keep layout responsive across phone, tablet, and web unless a route is
  intentionally platform-specific.

## Data And Errors

- Data-driven screens need loading, empty, and error states.
- Keep API endpoints and response shapes documented near the feature or in this
  folder once backend contracts exist.
- Never hardcode secrets, tokens, or private service keys in the client.

## Verification

- Run `npm.cmd run typecheck` after TypeScript changes.
- Run `npm.cmd run lint` after larger changes or before handoff.
- Mention any command that could not be run and why.
