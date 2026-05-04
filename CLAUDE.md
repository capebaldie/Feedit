# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start dev server (Vite HMR)
npm run build      # tsc type-check then Vite production build
npm run lint       # ESLint
npm run preview    # serve the production build locally
```

There is no test suite.

## Architecture

**Feedit** is a TweetDeck-style Reddit feed reader. Each subreddit renders as a fixed-width (320px) vertical column; the columns scroll horizontally together inside `.app__feed`.

### Data flow

All data comes from Reddit's public JSON API — no backend, no auth. Two paths:

- `validateSubreddit(name)` → `GET /r/{name}/about.json` — confirms a subreddit is public before adding it.
- `fetchPosts(subreddit, sort, timeFilter?)` → `GET /r/{name}/{sort}.json` — fetches up to 10 posts, parsed via `parsePosts()` in [`src/utils/reddit.ts`](src/utils/reddit.ts).

`usePosts` (in [`src/hooks/usePosts.ts`](src/hooks/usePosts.ts)) wraps `fetchPosts` with loading/error state and an `AbortController` for cleanup. It exposes a `refresh()` function implemented via a `tick` counter dependency — incrementing `tick` re-triggers the `useEffect`.

### Persistence

`useSubreddits` ([`src/hooks/useSubreddits.ts`](src/hooks/useSubreddits.ts)) stores the ordered subreddit list in `localStorage` under the key `feedit_subreddits`. Defaults to `["programming", "javascript"]` on first load. Subreddit names are always stored lowercase.

### Theming

Dark/light mode is toggled by setting `data-theme="dark"` on `<html>` and stored in `localStorage` under `"theme"`. All colors are CSS custom properties defined in [`src/index.css`](src/index.css) under `:root` (light) and `[data-theme="dark"]`.

### Styling conventions

Plain CSS files co-located with each component (not CSS modules). BEM-style class names (`component__element--modifier`). No Tailwind. CSS custom properties (`var(--bg)`, `var(--text)`, etc.) are used everywhere — never hardcode theme colors except for the brand orange `#ff4500`.

### TypeScript strictness

`noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` are enabled. Use `import type` for type-only imports (`verbatimModuleSyntax` enforces this).
