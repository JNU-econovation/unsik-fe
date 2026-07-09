# Project Context

## Product

`unsik-fe` is the React web frontend for the Unsik app. It currently renders a
mobile-first main screen at `/main`, supports Kakao OAuth callback handling at
`/auth/kakao/callback`, transitions to a room list screen at `/grouplist`, and
opens a group vote flow at `/groups/:groupId/votes`.

The group and vote flow supports creating a vote, choosing a meal location,
selecting participants, submitting preferences, voting on candidate menus,
showing a final menu, listing nearby restaurants, and opening restaurant/menu
detail views. The group condition screen links to a previous meal history view
derived from closed group vote results. The main landing screen keeps its dark
mystic style, while the post-login group and vote flows use a warm beige, dark
brown, and gold-accent mobile style adapted into plain React and CSS. The app
opts out of browser auto-darkening with `color-scheme: only light` so mobile OS
dark mode does not distort the Figma-derived palette.

After a member submits their own food preferences, the frontend returns them to
the vote status screen if other participants are still pending. That screen
polls pending preference members and retries recommendation automatically once
everyone has submitted. After the current member submits candidate ballots, the
same status screen polls vote detail until `resultMenu` appears and then opens
the final result.

Backend integration is partial because the current Swagger contract does not
cover every screen state. Kakao auth, groups, group members, vote creation,
preference submission, recommendation, ballot submission, vote detail, vote
deletion, and restaurant search call the backend. Room list fallback data,
recommendation fallback data, restaurant fallback data, fake ratings, fake
reviews, and fake score details are not shown. Screens with missing backend
contracts render empty or API-required states instead.

## Runtime

- React 19
- React DOM 19
- Vite
- TypeScript strict mode
- npm lockfile

## Structure

- `src/main.tsx`: React DOM entry
- `src/pwa.ts`: production-only service worker registration for installable PWA
  support
- `src/App.tsx`: top-level app composition and lightweight URL routing for
  `/main`, `/auth/kakao/callback`, `/grouplist`, and
  `/groups/:groupId/votes`
- `src/services/api-error.ts`: shared Korean API error formatting that displays
  an error code and reason for HTTP, network, parsing, auth, and client-state
  failures
- `src/services/auth.ts`: Kakao OAuth URL creation, `/api/auth/kakao` exchange,
  and browser auth-session storage
- `src/services/backend.ts`: typed wrappers around the current Swagger REST API
- `src/components/main`: main entry screen
- `src/components/auth`: auth callback screens
- `src/components/rooms`: room list screen
- `src/components/votes`: group vote list, setup, preference, card vote,
  result, restaurant detail, and score detail screens
- `src/components`: reusable UI components as the app grows
- `assets`: source assets imported by React
- `public`: browser-served assets such as favicons, PWA icons,
  `manifest.webmanifest`, and `service-worker.js`
- `docs/ai`: durable AI context and rules
- `docs/frontend-study-guide.html`: dark-mode frontend study guide for humans
- `docs/project-implementation-overview.html`: human-readable implementation
  overview, API usage map, maintainability notes, and backend contract gaps

The project is still plain React DOM without React Router. Routing is handled in
`src/App.tsx` with browser history and path parsing. React Native, Expo Router,
native app metadata, generated Expo icons, and React Native-specific agent
skills have been removed. Create `src/hooks`, `src/constants`, or feature
folders only when the app needs them.

## Local Workspace Notes

- PowerShell may block `npm.ps1`; use `npm.cmd` for npm scripts.
- `npm run clean` uses `node scripts/clean-dist.mjs` so local Windows builds
  and Linux deploy builds such as Vercel use the same cross-platform cleanup.
- Vercel deployment uses `vercel.json` to rewrite all routes to `index.html`.
  This is required because `/main`, `/grouplist`, and `/groups/:groupId/votes`
  are browser-handled SPA routes, not physical files on the server.
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
POSTs `{ "code": string, "redirectUri": string }` to `POST /api/auth/kakao`.
The `redirectUri` value is the same URI used to create the Kakao authorization
URL. The expected response is `{ "token": string, "member": { "id": number,
"name": string } }`.

The frontend stores that response in `localStorage` under
`unsik:auth_session` so the current minimal app can display member context and
reuse the token for future API calls.

The room list logout button clears `unsik:auth_session` from localStorage and
returns the browser to `/main`. It does not call a backend logout API because
the frontend only needs to discard the local JWT for this app session.

When a backend API call returns `401`, `src/services/backend.ts` dispatches the
`unsik:auth-expired` browser event. `src/App.tsx` handles that event by clearing
`unsik:auth_session`, returning to `/main`, and asking the user to log in again.
Token lifetime is still controlled by the backend JWT.

API and auth failures shown to users are formatted in Korean as
`오류 코드: ... · 이유: ...`. HTTP responses use the response status code, while
network, parsing, Kakao OAuth state, browser storage, and unknown client-side
exceptions use stable string codes such as `NETWORK`, `PARSE`, `AUTH_STATE`, or
`UNKNOWN`.

## Invite Links

Room invite links use `/grouplist?code=:inviteCode`. The room list screen reads
that code, stores it temporarily in `localStorage` under
`unsik:pending_invite_code` if the user is not logged in, then calls
`POST /api/groups/join?memberId=...` once a member session is available. After a
successful join, it opens `/groups/:groupId/votes`.

## PWA

The app has installable PWA basics:

- `index.html` links `/manifest.webmanifest`.
- `public/manifest.webmanifest` defines the app name, start URL `/main`,
  standalone display mode, theme/background colors, and icon set.
- `public/icons/*` contains 192px, 512px, and maskable 512px install icons
  derived from `public/app-icon.png`.
- `public/service-worker.js` caches the app shell and same-origin static assets.
  It ignores non-GET requests, cross-origin requests, and `/api/*` calls.
- `src/pwa.ts` registers the service worker only in production builds to avoid
  development-server cache issues.

## Backend API Usage

`src/services/backend.ts` targets the Railway Swagger API. Current call sites:

- `GET /api/groups?memberId=...`: room list when logged in
- `POST /api/groups?memberId=...`: room creation
- `POST /api/groups/join?memberId=...`: invite-code join
- `DELETE /api/groups/{groupId}?memberId=...`: group deletion
- `PATCH /api/groups/{groupId}?memberId=...`: room rename
- `GET /api/groups/{groupId}/members?memberId=...`: vote setup participants
- `GET /api/menus`: searchable menu catalog on the preference screen
- `GET /api/schools`: supported vote location chips, with static fallback
- `GET /api/groups/{groupId}/votes?memberId=...`: group-scoped vote summary
  list
- `POST /api/groups/{groupId}/votes`: vote creation; the backend auto-includes
  the OWNER, so the client omits OWNER ids from `participantMemberIds` when
  creating votes and requires at least one non-OWNER participant before sending
  the request. Vote deadlines are sent as local `yyyy-MM-ddTHH:mm:ss` strings.
- `POST /api/votes/{voteId}/preferences?memberId=...`: disliked cuisines and
  allergy/restriction submission
- `POST /api/votes/{voteId}/recommend?memberId=...`: candidate menus
- `POST /api/votes/{voteId}/ballots?memberId=...`: like/dislike ballots;
  the backend automatically aggregates only after every participant submits
- `GET /api/votes/{voteId}?memberId=...`: vote status/detail lookup after
  ballot submission; final menu is shown only when the backend returns
  `resultMenu`
- `GET /api/votes/{voteId}/pending-members?memberId=...`: preference pending
  members for status-screen profile check marks
- `DELETE /api/votes/{voteId}?memberId=...`: vote cancellation/deletion
- `GET /api/restaurants?menu=...&voteId=...&page=...`: restaurant search

Available Vote endpoints not currently used:

- `POST /api/votes/{voteId}/recommend/force?memberId=...`: Swagger marks this
  as OWNER forced recommendation, so the frontend keeps the normal all-member
  preference flow for now.
- `POST /api/votes/{voteId}/close?memberId=...`: Swagger marks this as OWNER
  forced close, so the frontend does not call it from the normal ballot flow.
- `GET /api/votes/my?memberId=...`: replaced in the vote list screen by the
  group-scoped `GET /api/groups/{groupId}/votes?memberId=...` endpoint.
Known contract gaps:

- Group rename is backed by `PATCH /api/groups/{groupId}`. Icon and max member
  selections are still stored only in the group description text because the
  backend contract does not expose those as structured fields.
- No location-vote endpoint exists. The selected location is sent only through
  `school` on vote creation. The frontend loads supported labels from
  `GET /api/schools` and falls back to `JEONGMOON`, `HOOMOON`, `SANGDAE`, and
  `YEDAE`.
- No dedicated previous meal history endpoint exists. The previous-history
  screen is rendered from `GET /api/groups/{groupId}/votes` entries that have a
  `resultMenu`; restaurant names and favorite state are not available from the
  backend contract.
- `POST /api/votes/{voteId}/preferences` accepts disliked cuisines, not
  disliked menu IDs. When a user searches and excludes a specific menu from
  `GET /api/menus`, the frontend maps that menu to its cuisine and submits the
  cuisine in `dislikedCuisines`.
- Swagger recommendation candidates are rendered as returned. The frontend no
  longer fills missing visual slots with local candidate data.
- No ballot progress/count endpoint exists. After a member submits
  `POST /api/votes/{voteId}/ballots`, the frontend can mark the current
  browser's member as submitted locally, but it still waits for
  `GET /api/votes/{voteId}` polling to return `resultMenu` instead of forcing a
  close.
- Restaurant search returns Kakao Local documents but not rating, price, or
  reviews. Those fields are not rendered.
- No menu score/reason endpoint exists. The menu detail screen shows only the
  confirmed menu fields and notes that score/reason data needs a backend API.
- Real push notifications require service-worker push subscription and backend
  delivery. The vote status screen only attempts the browser Notification API
  for an immediate local notification.
