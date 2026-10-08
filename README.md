# Feedit

A TweetDeck-style Reddit feed reader. Each subreddit renders as a fixed-width column; columns scroll horizontally so you can monitor multiple feeds at once.

Private and single-user: every API route requires a signed session cookie, and the Reddit proxy only forwards subreddit listings.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your values
npm run dev:vercel           # required for the API routes to resolve
```

`npm run dev` (plain Vite) serves the UI but has no `api/` routes, so the login screen cannot complete.

## Environment variables

| Variable | Purpose |
|---|---|
| `REDDIT_COOKIE` | Reddit session cookie, sent server-side only. Anonymous Reddit JSON requests return `403`, so this is required. |
| `ACCESS_CODE` | The code you type on the login screen. Compared server-side, never sent to the browser. |
| `SESSION_SECRET` | HMAC key for signing session cookies. Rotating it revokes every active session. |

All three are server-only. A `VITE_`-prefixed variable would be inlined into the client bundle at build time and must never hold a credential.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR (UI only, no API routes) |
| `npm run dev:vercel` | Vercel dev server on port 4000 — serves the UI **and** the `api/` functions |
| `npm run build` | Type-check `src/`, `api/` and `vite.config.ts`, then build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve the production build locally |

## Features

- Add and remove subreddit columns
- Sort posts by Hot, New, Top, or Rising
- Dark / light mode toggle
- Access-code login with a 30-day session
- Subreddit list and theme persist across sessions via `localStorage`

## Architecture

### Auth

`AuthGate` (in [src/components/AuthGate/AuthGate.tsx](src/components/AuthGate/AuthGate.tsx)) wraps the whole app in [src/main.tsx](src/main.tsx). It checks `/api/session` on mount and renders a loading screen, the login form, or the app. Because it gates before `<App />` mounts, no `SubredditSection` is created while signed out.

`POST /api/login` compares the submitted code against `ACCESS_CODE` with a constant-time comparison and replies with an `HttpOnly; Secure; SameSite=Strict` cookie carrying `expiry.HMAC(expiry)`. The browser attaches it to same-origin requests automatically, so no fetch call passes a token. Rotating `SESSION_SECRET` invalidates every session at once.

A `401` from any feed request is turned into a `feedit:unauthorized` event, which flips the UI back to the login form in place — this is how an expired session is handled without a reload.

### Proxy and data flow

`vercel.json` rewrites `/api/reddit/r/{name}/{sort}.json` to `/api/reddit?redditPath=r/{name}/{sort}.json`, and [api/reddit.ts](api/reddit.ts) reconstructs the upstream URL. Each request is handled in a fixed order, and every step assumes the previous one passed:

1. **Authenticate** — no valid session returns `401`.
2. **Restrict the path** — `redditPath` must match `/r/{name}/(about|hot|new|top|rising).json`, else `404`. Without this, any Reddit path could be requested through the session cookie.
3. **Serve from cache** — a 60s in-isolate cache, see below.
4. **Fetch Reddit** — only now is `REDDIT_COOKIE` used.

Only `2xx` responses are cached, and the upstream status and content type are passed through unchanged so a Reddit error is never stored or relabelled as JSON.

### Why the cache is not the CDN cache

Responses send `Cache-Control: no-store` and `Vary: Cookie`, and caching lives in a module-level `Map` inside the function instead. Vercel keys CDN cache entries by URL alone, so a cacheable response would also be served to callers who never reached the function and so were never authenticated. Vercel reuses Edge isolates across requests, so the in-function map still absorbs repeated requests for the same column.

### Persistence

`useSubreddits` ([src/hooks/useSubreddits.ts](src/hooks/useSubreddits.ts)) stores the ordered subreddit list in `localStorage` under `feedit_subreddits`. Defaults to `["programming", "kochi", "developersindia"]`.

### Theming

Dark/light mode is toggled via `data-theme="dark"` on `<html>` and stored in `localStorage` under `"theme"`. All colors are CSS custom properties in [src/index.css](src/index.css); dark mode only redefines those variables. Fonts are loaded once via `<link>` in `index.html` — a second `@import` in the CSS would duplicate the request and block rendering.

## Deployment notes

- Set the three environment variables in the Vercel project, then redeploy. Env changes do not apply to existing deployments.
- Add a Firewall rate limit for `Request Path` equals `/api/login`. Hobby allows one rate limit rule per project, and this is the one worth spending it on.
- An exact-match path condition fails silently if mistyped — the rule publishes, matches nothing, and does nothing. Confirm it against the Firewall traffic view.

## Stack

React · TypeScript · Vite · Vercel Edge Functions