# AI Agent Instructions

This repository is an Expo React Native frontend. These instructions apply to the
entire repository.

## Read First

1. Read this file before changing code.
2. Read `docs/ai/README.md` for the project context map.
3. For React Native or Expo implementation work, read
   `.agents/skills/vercel-react-native-skills/SKILL.md` and the relevant rule
   files under `.agents/skills/vercel-react-native-skills/rules/`.
4. For Expo APIs, read the exact SDK docs first:
   `https://docs.expo.dev/versions/v56.0.0/`
5. For React Native APIs, use the React Native 0.85 docs first.

## Installed Agent Skills

- `vercel-react-native-skills`
  - Installed from `https://github.com/vercel-labs/agent-skills`
  - Local path: `.agents/skills/vercel-react-native-skills`
  - Use for React Native, Expo, mobile performance, list rendering,
    animations, navigation, native modules, images, styling, and state rules.
  - Start with `SKILL.md`; then open only the specific rule files needed for
    the task.

## Current Stack

- Expo SDK 56
- React Native 0.85
- React 19
- TypeScript strict mode
- Expo Router with routes under `src/app`
- Path aliases: `@/*` -> `src/*`, `@/assets/*` -> `assets/*`
- Package manager: npm with `package-lock.json`

## Commands

On this Windows/PowerShell workspace, prefer `npm.cmd` if plain `npm` is blocked
by script execution policy.

- Install dependencies: `npm.cmd install`
- Start dev server: `npm.cmd run dev`
- Android: `npm.cmd run android`
- iOS: `npm.cmd run ios`
- Web: `npm.cmd run web`
- Type check: `npm.cmd run typecheck`
- Lint: `npm.cmd run lint`
- Full local check: `npm.cmd run check`

## Development Rules

- Keep app routes in `src/app`; keep reusable UI in `src/components`.
- Prefer Expo-supported libraries and install native dependencies with
  `npx.cmd expo install <package>` unless the package is pure JavaScript.
- Do not create or commit generated `ios/` or `android/` folders unless the user
  explicitly asks for prebuild/native work.
- Do not put secrets in client code. Only `EXPO_PUBLIC_*` variables are safe to
  read in the app bundle, and they are public by design.
- Maintain strict TypeScript. Avoid `any` unless the boundary is genuinely
  untyped and the reason is documented locally.
- For screens, handle loading, empty, error, and offline-ish states when data is
  involved.
- For mobile UI, account for safe areas, keyboard behavior, accessibility labels,
  and touch target sizes.
- Update `docs/ai/*` when architecture, commands, environment variables, or app
  domain assumptions change.
