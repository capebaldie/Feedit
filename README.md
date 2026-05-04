# Feedit

A TweetDeck-style Reddit feed reader. Each subreddit renders as a fixed-width column; columns scroll horizontally so you can monitor multiple feeds at once.

No backend, no auth — all data comes from Reddit's public JSON API.

## Getting started

```bash
npm install
npm run dev
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check then build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Serve the production build locally |

## Features

- Add and remove subreddit columns
- Sort posts by Hot, New, Top, or Rising
- Dark / light mode toggle
- Subreddit list and theme persist across sessions via `localStorage`

## Architecture

### Data flow

- `validateSubreddit(name)` — confirms a subreddit is public via `GET /r/{name}/about.json` before adding it
- `fetchPosts(subreddit, sort, timeFilter?)` — fetches up to 10 posts via `GET /r/{name}/{sort}.json`, parsed by `parsePosts()` in [src/utils/reddit.ts](src/utils/reddit.ts)

`usePosts` ([src/hooks/usePosts.ts](src/hooks/usePosts.ts)) wraps `fetchPosts` with loading/error state and an `AbortController` for cleanup.

### Persistence

`useSubreddits` ([src/hooks/useSubreddits.ts](src/hooks/useSubreddits.ts)) stores the ordered subreddit list in `localStorage` under `feedit_subreddits`. Defaults to `["programming", "javascript"]`.

### Theming

Dark/light mode is toggled via `data-theme="dark"` on `<html>` and stored in `localStorage` under `"theme"`. All colors are CSS custom properties in [src/index.css](src/index.css).

### Styling

Plain CSS co-located with each component, BEM-style class names, CSS custom properties throughout. No Tailwind, no CSS modules.

## Stack

React · TypeScript · Vite
