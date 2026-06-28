# Project Context

## Product

`unsik-fe` is the React web frontend for the Unsik app. It currently renders a
mobile-first main screen at `/main`, supports Kakao OAuth callback handling at
`/auth/kakao/callback`, and transitions to a room list screen at `/grouplist`.
Product details, target users, and most backend contracts are still to be
defined.

The room list currently uses local mock state. Users can create rooms, copy a
mock invite link, rename rooms, and delete rooms in the browser session only.

## Runtime

- React 19
- React DOM 19
- Vite
- TypeScript strict mode
- npm lockfile

## Structure

- `src/main.tsx`: React DOM entry
- `src/App.tsx`: top-level app composition and lightweight URL routing for
  `/main`, `/auth/kakao/callback`, and `/grouplist`
- `src/services/auth.ts`: Kakao OAuth URL creation, `/api/auth/kakao` exchange,
  and browser auth-session storage
- `src/components/main`: main entry screen
- `src/components/auth`: auth callback screens
- `src/components/rooms`: room list screen
- `src/components`: reusable UI components as the app grows
- `assets`: source assets imported by React
- `public`: browser-served assets such as favicons and future PWA icons
- `docs/ai`: durable AI context and rules
- `docs/frontend-study-guide.html`: dark-mode frontend study guide for humans

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
- `VITE_KAKAO_REST_API_KEY`: public Kakao REST API key for OAuth authorization
- `VITE_KAKAO_REDIRECT_URI`: Kakao redirect URI; defaults in code to
  `/auth/kakao/callback` on the current origin when omitted

## Auth

Kakao login starts from the main screen using Kakao's OAuth authorization URL.
The callback route reads the returned `code`, verifies the OAuth `state`, then
POSTs `{ "code": string }` to `POST /api/auth/kakao`. The expected response is
`{ "token": string, "member": { "id": number, "name": string } }`.

The frontend stores that response in `localStorage` under
`unsik:auth_session` so the current minimal app can display member context and
reuse the token for future API calls.
