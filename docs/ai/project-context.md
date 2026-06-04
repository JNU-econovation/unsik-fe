# Project Context

## Product

`unsik-fe` is the React web frontend for the Unsik app. It currently renders a
mobile-first landing screen. Product details, target users, and backend
contracts are still to be defined.

## Runtime

- React 19
- React DOM 19
- Vite
- TypeScript strict mode
- npm lockfile

## Structure

- `src/main.tsx`: React DOM entry
- `src/App.tsx`: top-level app composition
- `src/components`: screen and reusable UI components
- `assets`: source assets imported by React
- `public`: browser-served assets such as favicons and future PWA icons
- `docs/ai`: durable AI context and rules

The project is intentionally minimal. React Native, Expo Router, native app
metadata, generated Expo icons, and React Native-specific agent skills have
been removed. Create `src/hooks`, `src/constants`, or feature folders only when
the app needs them.

## Local Workspace Notes

- PowerShell may block `npm.ps1`; use `npm.cmd` for npm scripts.
- Git may report `dubious ownership` in this folder. Use a one-off
  `git -c safe.directory='<repo-root>' ...`
  command unless the user asks to change global git config.

## Environment

Client-readable environment variables must use the `VITE_` prefix. Treat all
such values as public because they are bundled into the app.

Current placeholder variables:

- `VITE_API_BASE_URL`: backend API base URL
