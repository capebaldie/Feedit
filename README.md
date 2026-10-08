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

## Deployment notes

- Set the three environment variables in the Vercel project, then redeploy.
- Add a Firewall rate limit for `Request Path` equals `/api/login`. Hobby allows one rate limit rule per project, and this is the one worth spending it on.
- An exact-match path condition fails silently if mistyped — the rule publishes, matches nothing, and does nothing. Confirm it against the Firewall traffic view.

## Stack

React · TypeScript · Vite · Vercel Edge Functions
