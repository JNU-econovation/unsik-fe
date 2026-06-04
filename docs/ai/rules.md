# Coding Rules

## Architecture

- Keep `src/main.tsx` as the React DOM bootstrap and `src/App.tsx` as the
  top-level composition point. Move reusable rendering and business logic into
  components, hooks, or feature modules as the app grows.
- Prefer `@/` imports over long relative paths.
- Add a router only when the app has multiple real routes.

## Dependencies

- Prefer lightweight browser-compatible React libraries.
- Do not add React Native, Expo, or native mobile dependencies unless the user
  explicitly asks to return to that stack.
- Keep PWA work explicit. Add manifests, service workers, and install prompts
  only when the task asks for them.

## UI

- Use semantic HTML, CSS, and accessible React components.
- Design mobile browser layouts first. Respect safe area insets, viewport height
  changes, keyboard overlap, readable text, and touch targets.
- Add accessible labels, roles, visible focus states, and keyboard behavior for
  interactive controls.
- Keep layout responsive across phone and desktop browsers unless a route is
  intentionally constrained.

## Data And Errors

- Data-driven screens need loading, empty, and error states.
- Keep API endpoints and response shapes documented near the feature or in this
  folder once backend contracts exist.
- Never hardcode secrets, tokens, or private service keys in the client.

## Verification

- Run `npm.cmd run typecheck` after TypeScript changes.
- Run `npm.cmd run lint` after larger changes or before handoff.
- Run `npm.cmd run build` before handoff when build tooling or asset handling
  changes.
- Mention any command that could not be run and why.
