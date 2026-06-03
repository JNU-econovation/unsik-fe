# Project Context

## Product

`unsik-fe` is the React Native frontend for the Unsik app. Product details,
target users, and backend contracts are still to be defined.

## Runtime

- Expo SDK 56
- React Native 0.85
- React 19
- TypeScript strict mode
- npm lockfile

## Structure

- `src/app`: Expo Router routes and layouts
- `assets`: images and app assets
- `docs/ai`: durable AI context and rules
- `.agents/skills`: installed AI coding skills

The project is intentionally minimal. The Expo sample screens, sample
components, sample hooks, and tutorial assets have been removed. Create
`src/components`, `src/hooks`, `src/constants`, or feature folders only when the
app needs them.

## Local Workspace Notes

- PowerShell may block `npm.ps1`; use `npm.cmd` for npm scripts.
- Git may report `dubious ownership` in this folder. Use a one-off
  `git -c safe.directory='<repo-root>' ...`
  command unless the user asks to change global git config.

## Environment

Client-readable environment variables must use the `EXPO_PUBLIC_` prefix. Treat
all such values as public because they are bundled into the app.

Current placeholder variables:

- `EXPO_PUBLIC_API_BASE_URL`: backend API base URL
