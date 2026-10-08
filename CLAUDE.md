# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server (UI only — no api/ routes)
npm run dev:vercel   # Vercel dev server on port 4000 (UI + api/ functions)
npm run build        # type-check src/, api/ and vite.config.ts, then Vite build
npm run lint         # ESLint
npm run preview      # serve the production build locally
```

`npm run dev` cannot complete a login: `/api/session` and `/api/login` only exist under `vercel dev`. Use `dev:vercel` for anything touching auth or data.

There is no test suite.

## Architecture

**Feedit** is a TweetDeck-style Reddit feed reader. Each subreddit renders as a fixed-width (320px) vertical column; the columns scroll horizontally together inside `.app__feed`.

### Security model

This is a single-user private app. Three Edge Functions under `api/` hold the only secrets:

| Route | Role |
|---|---|
| `/api/login` | Compares the submitted code against `ACCESS_CODE`, sets a signed cookie |
| `/api/session` | Reports whether the request carries a valid session |
| `/api/logout` | Clears the cookie |
| `/api/reddit` | The Reddit proxy |

Shared HMAC/cookie helpers live in `api/_helpers.ts`. The leading underscore matters — Vercel ignores underscore-prefixed files in `api/` so they do not become routes.

Three rules govern any change to `api/`:

1. **`ACCESS_CODE` and `SESSION_SECRET` are server-only.** A `VITE_` prefix would inline them into the client bundle and publish them.
2. **Authenticate before doing anything else.** `verifySession()` is the first check in `api/reddit.ts`.
3. **`redditPath` must pass the allowlist** before a URL is built. The proxy forwards `REDDIT_COOKIE`, so an unrestricted path reaches any Reddit endpoint with the user's session — including `/message/inbox.json`, which returns private messages.

### Caching

`api/reddit.ts` caches in a module-level `Map` for 60s, **not** in the CDN. Vercel keys CDN cache entries by URL alone, so a response with `s-maxage` would also be served to callers who never reached the function and so were never authenticated. All authenticated responses send `Cache-Control: no-store` and `Vary: Cookie`.

Do not "optimise" this by restoring `s-maxage` — that reintroduces an authentication bypass. Only `2xx` responses are cached; a stored Reddit `403` would be served for the rest of the TTL.

### Data flow

`vercel.json` rewrites `/api/reddit/r/{name}/{sort}.json` → `/api/reddit?redditPath=r/{name}/{sort}.json`; `api/reddit.ts` reconstructs the upstream URL.

- `validateSubreddit(name)` → `GET /r/{name}/about.json` — confirms a subreddit is public before adding it
- `fetchPosts(subreddit, sort, timeFilter?)` → `GET /r/{name}/{sort}.json` — fetches 15 posts, parsed via `parsePosts()` in [`src/utils/reddit.ts`](src/utils/reddit.ts)

Both go through a `request()` helper that turns a `401` into a `feedit:unauthorized` event, so an expired session returns the user to the login screen instead of filling the feed with errors.

`usePosts` wraps `fetchPosts` with loading/error state and an `AbortController`. It resets its loading state during render rather than inside the effect body, because synchronous `setState` in an effect trips `react-hooks/set-state-in-effect`.

### Client auth

`AuthGate` wraps `<App />` in [`src/main.tsx`](src/main.tsx) and renders a loading screen, `<Login />`, or the app. It owns theme initialisation so the login screen is themed too. Because it gates before `<App />` mounts, no `SubredditSection` is created while signed out — which is what prevents API errors appearing before login.

`useAuth` returns a discriminated `LoginResult` rather than a boolean, because `401` (wrong code) and `403` (rate limited) need different messages.

### Persistence

`useSubreddits` ([`src/hooks/useSubreddits.ts`](src/hooks/useSubreddits.ts)) stores the ordered subreddit list in `localStorage` under `feedit_subreddits`. Defaults to `["programming", "kochi", "developersindia"]`.

### Theming

Dark/light mode is toggled via `data-theme="dark"` on `<html>` and stored in `localStorage` under `"theme"`. All colors are CSS custom properties in [`src/index.css`](src/index.css); the dark theme only redefines variables.

Two brand tokens exist because `#ff4500` is not usable everywhere:

- `--brand` — rules, focus rings, icons. Clears 3:1, which is all non-text needs.
- `--brand-strong` / `--brand-strong-hover` — button fills behind white text. `#ff4500` only reaches 3.44:1, below the 4.5:1 a label needs.

Text contrast is verified, not eyeballed. `--text-faint` carries post timestamps, source domains and control icons, so it must clear 4.5:1 on `--surface`; its previous value was 2.09:1 in dark mode. Post card borders sit below 3:1 deliberately — the card is a link identified by its text and hover state, so its border is decorative separation rather than the sole means of identification.

### Visual language

The login screen sets the direction and the app follows it.

- **Flat.** No `box-shadow` anywhere in the UI. Depth comes from hairline borders and tinted surfaces; focus is shown with an outline, not a soft ring.
- **One radius.** 4px throughout, 3px for the flair badge. Rounded chrome at 8–14px reads as stock.
- **The block mark.** A stack of small squares in `--brand` at descending opacity — 2×2 on the login panel, 3 blocks in each column header. This is the recurring identity element. Not a coloured top border, which is the common tell to avoid.
- **Wordmark.** A brand block plus letterspaced uppercase caps, never orange display type.

### Styling conventions

Plain CSS files co-located with each component (not CSS modules). BEM-style class names (`component__element--modifier`). No Tailwind. Colors route through CSS custom properties — never hardcode, with `--brand` replacing raw `#ff4500` in new code. The login screen is deliberately flat: no `box-shadow`, depth comes from hairline borders and the tinted panel.

### TypeScript strictness

`noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` are enabled. Use `import type` for type-only imports (`verbatimModuleSyntax` enforces this). Three tsconfigs are referenced from `tsconfig.json`: `app` (`src/`), `node` (`vite.config.ts`), and `api` (the Edge Functions — this one includes the DOM lib, since they expose Web APIs rather than Node built-ins).

## Deployment notes

- Vercel env changes require a redeploy; deployments are immutable artifacts.
- Add a Firewall rate limit on `/api/login`. Hobby permits one rate limit rule per project.
- An exact-match path condition in a WAF rule fails silently when mistyped — it publishes, matches nothing, and does nothing.