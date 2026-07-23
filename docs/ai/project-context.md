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
derived from closed group vote results. The landing, group, and vote flows use
the current Figma direction: warm beige, dark brown, and gold accents, with the
exact exported landing, oracle, card-pick, card-reveal, and final-result artwork
stored under `assets/images/figma/`.
The UI is adapted into plain React and CSS by default.
The app does not follow OS dark mode automatically; a floating theme button
stores `unsik:theme_mode` and switches `html[data-unsik-theme='dark']` to an
explicit dark purple, navy, and gold theme.

After a member submits their own food preferences, the frontend returns them to
the vote status screen if other participants are still pending. That screen
first reloads vote detail for existing candidates, then polls pending preference
members. Only when no pending members remain does it request recommendation;
the backend combines every participant's individually stored preferences to
create the shared candidates. If another client created candidates first, the
frontend opens those candidates from the latest vote detail instead of remaining
on the status screen. After all candidate choices are made, the frontend opens a
local reveal/confirmation screen. Confirming there submits the candidate
ballots; after submission, the same status screen polls vote detail until
`resultMenu` appears and then opens the final result.

The preference screen lazily requests `GET /api/menus` when the user first types
a menu exclusion search. The backend currently exposes only a full-catalog
endpoint, so the frontend filters that response by normalized menu or cuisine
text and caches it for subsequent input. Spacing differences do not block
matches. It provides an
in-place retry when the catalog request fails or exceeds a ten-second timeout,
and submits selected menu IDs through `excludedMenuIds`, independently from
category-wide exclusions in `dislikedCuisines`.

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
- `VITE_KAKAO_REST_API_KEY`: optional public Kakao REST API key used only as a
  fallback when the backend login-URL endpoint is unavailable
- `VITE_KAKAO_REDIRECT_URI`: Kakao redirect URI; defaults in code to
  `/auth/kakao/callback` on the current origin when omitted

During Vite development, browser API requests use same-origin `/api/*` paths and
`vite.config.ts` proxies them to `VITE_API_BASE_URL`. This prevents backend CORS
allowlists from breaking local fallback ports such as `localhost:5174`.

## Auth

- Login starts with `GET /api/auth/kakao/login-url`; the frontend adds its OAuth
  state and preserves the backend redirect URI unless
  `VITE_KAKAO_REDIRECT_URI` explicitly overrides it. A configured public Kakao
  REST key is a network-failure fallback.
- Logout calls `POST /api/auth/logout?memberId=...` and always clears the local
  session, including when the server token is already invalid or offline.

Kakao login starts from the main screen using the authorization URL returned by
the backend helper endpoint. The callback route reads the returned `code`,
verifies the OAuth `state`, then POSTs
`{ "code": string, "redirectUri": string }` to `POST /api/auth/kakao`.
The `redirectUri` value is the same URI used to create the Kakao authorization
URL. The expected response is `{ "token": string, "member": { "id": number,
"name": string } }`.

The frontend stores that response in `localStorage` under
`unsik:auth_session` so the current minimal app can display member context and
reuse the token for future API calls.

The room-list back button calls `POST /api/auth/logout?memberId=...`, clears
`unsik:auth_session` from localStorage even if that request fails, and returns
the browser to `/main`.

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

Room overflow menus copy the raw invite code. Inside a group, the Kakao invite
action opens the browser's native Web Share sheet so a mobile user can choose
KakaoTalk; browsers without Web Share copy the full invite URL to the clipboard
instead. Direct KakaoTalk targeting would require a separate Kakao JavaScript
SDK app key and share template.

## Preference Character Assets

The eight cuisine cards use 256x256 transparent PNG mascots under
`assets/images/figma/preference-*.png`. They were generated from the visual
direction in `assets/images/figma/image.png`, chroma-keyed, cropped, and
optimized for the two-column mobile cards. Keep the cuisine-to-image mapping in
`vote-flow-screen.tsx` stable when changing category labels. The preference
cards intentionally use a taller 110px layout so the character and multi-line
category description remain visible. The final-result scene reuses the matching
cuisine mascot beside a dynamic tarot card containing the actual selected menu,
following the composition of Figma node `45:78` without hard-coding one menu.

## Food Tarot Card Assets

The 48 completed menu tarot cards under `assets/images/food_images/` are mapped
to normalized backend menu names in `vote-flow-screen.tsx`, with the card's
I–XLVIII order used as a `menuId` fallback when backend naming differs.
Matching artwork is reused in the card-vote, reveal, and final-result screens.
Some source PNGs use a square canvas around a portrait card, so the shared tarot
image CSS crops those files horizontally. Menus without matching artwork
continue to use the existing generated card fallback.

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
- `GET /api/menus`: full menu catalog, requested lazily from the preference
  search and filtered client-side because the endpoint has no search parameter
- `GET /api/schools`: supported vote location chips, with static fallback
- `GET /api/groups/{groupId}/votes?memberId=...`: group-scoped vote summary
  list
- `POST /api/groups/{groupId}/votes`: vote creation; the backend auto-includes
  the OWNER, so the client omits OWNER ids from `participantMemberIds` when
  creating multi-member votes. The API requires at least one participant id,
  so an OWNER-only vote sends the selected OWNER id to satisfy validation; the
  backend still treats that member as the single auto-included OWNER. Vote
  deadlines are sent as local `yyyy-MM-ddTHH:mm:ss` strings.
- `POST /api/votes/{voteId}/preferences?memberId=...`: disliked cuisines,
  individually excluded menu IDs, and allergy/restriction submission
- `POST /api/votes/{voteId}/recommend?memberId=...`: candidate menus
- `POST /api/votes/{voteId}/ballots?memberId=...`: like/dislike ballots;
  the backend automatically aggregates only after every participant submits
- `GET /api/votes/{voteId}?memberId=...`: vote status/detail lookup after
  ballot submission; final menu is shown only when the backend returns
  `resultMenu`
- `GET /api/votes/{voteId}/pending-members?memberId=...`: preference pending
  members for status-screen profile check marks
- `DELETE /api/votes/{voteId}?memberId=...`: deletion of any vote state from
  each group vote list card's overflow menu; the backend enforces OWNER access
- `GET /api/restaurants?menu=...&voteId=...&page=...`: restaurant search

Available Vote endpoints not currently used:

- `POST /api/votes/{voteId}/recommend/force?memberId=...`: Swagger marks this
  as OWNER forced recommendation, so the frontend keeps the normal all-member
  preference flow.
- `POST /api/votes/{voteId}/close?memberId=...`: this endpoint force-aggregates
  submitted ballots into a result; it is not used as a cancellation action
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
- `POST /api/votes/{voteId}/preferences` accepts individual menu exclusions in
  `excludedMenuIds`. Search-selected menus use this field, while category cards
  continue to submit cuisine-wide exclusions in `dislikedCuisines`.
- Swagger recommendation candidates are rendered as returned. The frontend no
  longer fills missing visual slots with local candidate data.
- No ballot progress/count endpoint exists. After a member submits
  `POST /api/votes/{voteId}/ballots`, the frontend can mark the current
  browser's member as submitted locally. That marker is persisted per member in
  browser storage so the vote list and re-entry show `참여 완료` after a reload
  on the same browser. Cross-device completion still needs a backend status
  field or endpoint. The frontend still waits for
  `GET /api/votes/{voteId}` polling to return `resultMenu` instead of forcing a
  close.
- Restaurant search returns Kakao Local documents but not rating, price, or
  reviews. Those fields are not rendered.
- No menu score/reason endpoint exists. The menu detail screen preserves the
  Figma card hierarchy but shows only confirmed menu, participation, cuisine,
  and restaurant-navigation facts; it does not fabricate numeric scores or
  personalized reasons.
- Real push notifications require service-worker push subscription and backend
  delivery. The vote status screen only attempts the browser Notification API
  for an immediate local notification.
