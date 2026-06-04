# AI Agent Instructions

This repository is a Vite React web frontend. These instructions apply to the
entire repository.

## Read First

1. Read this file before changing code.
2. Read `docs/ai/README.md` for the project context map.

## Current Stack

- React 19
- React DOM 19
- Vite
- TypeScript strict mode
- Path aliases: `@/*` -> `src/*`, `@/assets/*` -> `assets/*`
- Package manager: npm with `package-lock.json`

## Commands

On this Windows/PowerShell workspace, prefer `npm.cmd` if plain `npm` is blocked
by script execution policy.

- Install dependencies: `npm.cmd install`
- Start dev server: `npm.cmd run dev`
- Build: `npm.cmd run build`
- Preview production build: `npm.cmd run preview`
- Type check: `npm.cmd run typecheck`
- Lint: `npm.cmd run lint`
- Full local check: `npm.cmd run check`

## Development Rules

- Keep the React entry in `src/main.tsx` and app composition in `src/App.tsx`.
  Keep reusable UI in `src/components`.
- Use standard React DOM, browser APIs, and CSS. Do not add React Native or Expo
  dependencies unless the user explicitly asks to return to that stack.
- Do not put secrets in client code. Only `VITE_*` variables are exposed to the
  app bundle, and they are public by design.
- Maintain strict TypeScript. Avoid `any` unless the boundary is genuinely
  untyped and the reason is documented locally.
- For screens, handle loading, empty, error, and offline-ish states when data is
  involved.
- Design mobile browser layouts first. Account for viewport height changes, safe
  area insets, accessibility labels, focus states, and touch target sizes.
- Keep `public/` for browser-served static assets such as favicons and future
  PWA icons.
- Update `docs/ai/*` when architecture, commands, environment variables, or app
  domain assumptions change.
