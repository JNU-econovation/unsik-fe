# Project Context

## Product

`unsik-fe` is the React web frontend for the Unsik app. It currently renders a
mobile-first main screen at `/main`, supports Kakao OAuth callback handling at
`/auth/kakao/callback`, transitions to a room list screen at `/grouplist`, and
opens a group vote flow at `/groups/:groupId/votes`.

The group and vote flow supports creating a vote, choosing a meal location,
selecting participants, submitting preferences, voting on candidate menus,
showing a final menu, listing nearby restaurants, and opening restaurant/menu
detail views. The UI follows the dark mobile Figma draft, adapted into plain
React and CSS.

Backend integration is partial because the current Swagger contract does not
cover every screen state. Kakao auth, groups, group members, vote creation,
preference submission, recommendation, ballot submission, vote close/detail,
vote deletion, and restaurant search call the backend. Room list fallback data,
recommendation fallback data, restaurant fallback data, previous meal history,
fake ratings, fake reviews, and fake score details are not shown. Screens with
missing backend contracts render empty or API-required states instead.

## Runtime

- React 19
- React DOM 19
- Vite
- TypeScript strict mode
- npm lockfile

## Structure

- `src/main.tsx`: React DOM entry
- `src/App.tsx`: top-level app composition and lightweight URL routing for
  `/main`, `/auth/kakao/callback`, `/grouplist`, and
  `/groups/:groupId/votes`
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
- `public`: browser-served assets such as favicons and future PWA icons
- `docs/ai`: durable AI context and rules
- `docs/frontend-study-guide.html`: dark-mode frontend study guide for humans

The project is still plain React DOM without React Router. Routing is handled in
`src/App.tsx` with browser history and path parsing. React Native, Expo Router,
native app metadata, generated Expo icons, and React Native-specific agent
skills have been removed. Create `src/hooks`, `src/constants`, or feature
folders only when the app needs them.

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

## Backend API Usage

`src/services/backend.ts` targets the Railway Swagger API. Current call sites:

- `GET /api/groups?memberId=...`: room list when logged in
- `POST /api/groups?memberId=...`: room creation
- `POST /api/groups/join?memberId=...`: invite-code join
- `DELETE /api/groups/{groupId}?memberId=...`: group deletion
- `GET /api/groups/{groupId}/members?memberId=...`: vote setup participants
- `GET /api/menus`: searchable menu catalog on the preference screen
- `POST /api/groups/{groupId}/votes`: vote creation
- `POST /api/votes/{voteId}/preferences?memberId=...`: disliked cuisines and
  allergy/restriction submission
- `POST /api/votes/{voteId}/recommend?memberId=...`: candidate menus
- `POST /api/votes/{voteId}/ballots?memberId=...`: like/dislike ballots
- `POST /api/votes/{voteId}/close?memberId=...`: final menu close when possible
- `GET /api/votes/{voteId}?memberId=...`: fallback final menu detail lookup
- `DELETE /api/votes/{voteId}?memberId=...`: vote cancellation/deletion
- `GET /api/restaurants?menu=...&voteId=...&page=...`: restaurant search

Known contract gaps:

- No group vote-list endpoint exists, so `/groups/:groupId/votes` cannot load
  persisted vote rows from the backend. The screen only shows votes created
  during the current React session.
- No group update endpoint exists, so room rename was removed. Icon and max
  member selections are currently stored only in the group description text.
- No location-vote endpoint exists. The selected location is sent only through
  `school` on vote creation. Frontend labels `정문`, `후문`, and `상관없어`
  map to `GONGDAE`; `상대` maps to `SANGDAE`; `예대` maps to `YEDAE`.
- No previous meal history endpoint exists, so the previous-history panel is
  not rendered.
- `POST /api/votes/{voteId}/preferences` accepts disliked cuisines, not
  disliked menu IDs. When a user searches and excludes a specific menu from
  `GET /api/menus`, the frontend maps that menu to its cuisine and submits the
  cuisine in `dislikedCuisines`.
- Swagger recommendation candidates are rendered as returned. The frontend no
  longer fills missing visual slots with local candidate data.
- Restaurant search returns Kakao Local documents but not rating, price, or
  reviews. Those fields are not rendered.
- No menu score/reason endpoint exists. The menu detail screen shows only the
  confirmed menu fields and notes that score/reason data needs a backend API.
- Real push notifications require service-worker push subscription and backend
  delivery. The vote status screen only attempts the browser Notification API
  for an immediate local notification.
