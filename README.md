# unsik-fe

React web frontend built with Vite, React 19, and TypeScript.

## Setup

Install dependencies:

```bash
npm.cmd install
```

Start the development server:

```bash
npm.cmd run dev
```

Build or preview the production bundle:

```bash
npm.cmd run build
npm.cmd run preview
```

On macOS, `npm.cmd` is not needed; use `npm` instead.

## Checks

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run check
```

## Structure

- `src/main.tsx`: React DOM entry
- `src/App.tsx`: top-level app composition
- `src/components`: screen and reusable UI components
- `assets`: source assets imported by React
- `public`: browser-served assets such as favicons and future PWA icons
- `docs/ai`: AI agent context and coding rules

Add `src/hooks`, `src/constants`, or feature folders when the app needs them.

## AI Context

AI coding agents should read `AGENTS.md` first, then `docs/ai/README.md`.

## Environment

Copy `.env.example` when local public configuration is needed:

```bash
copy .env.example .env
```

Only variables prefixed with `VITE_` should be read by client code, and they are
public in the app bundle.
