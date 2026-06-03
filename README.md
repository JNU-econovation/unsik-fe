# unsik-fe

React Native frontend built with Expo, Expo Router, React 19, and TypeScript.

## Setup

Install dependencies:

```bash
npm.cmd install
```

Start the development server:

```bash
npm.cmd run dev
```

Run a platform target:

```bash
npm.cmd run android
npm.cmd run ios
npm.cmd run web
```

On macOS, `npm.cmd` is not needed; use `npm` instead.

## Checks

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check
```

## Structure

- `src/app`: Expo Router routes and layouts
- `src/components`: screen and reusable UI components
- `assets`: static app assets
- `docs/ai`: AI agent context and coding rules
- `.agents/skills`: installed AI coding skills

The Expo sample screens and tutorial components have been removed. Add
`src/hooks`, `src/constants`, or feature folders when the app needs them.

## AI Context

AI coding agents should read `AGENTS.md` first, then `docs/ai/README.md`.

## Environment

Copy `.env.example` when local public configuration is needed:

```bash
copy .env.example .env
```

Only variables prefixed with `EXPO_PUBLIC_` should be read by client code, and
they are public in the app bundle.

## Docs

- Expo SDK docs: https://docs.expo.dev/versions/v56.0.0/
- React Native docs: https://reactnative.dev/docs/0.85/getting-started
