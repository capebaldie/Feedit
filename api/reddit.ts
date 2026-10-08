// Vercel Edge Function — production proxy for Reddit API.
// Replaces the Vite dev proxy when deployed.
//
// Vercel rewrites /api/reddit/r/subReddit/hot.json?limit=15
//            to → /api/reddit?redditPath=r/subReddit/hot.json&limit=15
// This function reconstructs the Reddit URL and fetches server-side.
//
// The checks run in a deliberate order — authenticate, restrict the path,
// serve from cache, and only then contact Reddit. Each step assumes the one
// before it already succeeded.
import { json, passthrough, verifySession } from './_helpers'

export const config = {
  runtime: 'edge',
}

// Only subreddit listings are proxied. Without this, any path could be
// requested through the session cookie: /message/inbox.json returns private
// messages, /api/v1/me.json and friends expose account data. `about` is
// required because validateSubreddit() calls it when a subreddit is added.
const ALLOWED_PATH = /^r\/[A-Za-z0-9_]+\/(about|hot|new|top|rising)\.json$/

const ALLOWED_TIME_FILTERS = new Set(['hour', 'day', 'week', 'month', 'year', 'all'])

const CACHE_TTL_MS = 60_000
const CACHE_MAX_ENTRIES = 100

// Vercel reuses an Edge isolate across requests, so this map survives between
// requests served by the same isolate.
//
// This is deliberately NOT the CDN cache. Vercel keys cache entries by URL
// only, so a cacheable response would also be served to callers who never
// reach this function — and therefore never get authenticated. Keeping the
// cache here means the session check runs on every single request.
const cache = new Map<string, { at: number; body: string }>()

function readCache(key: string): string | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return hit.body
}

function writeCache(key: string, body: string): void {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next()
    if (!oldest.done) cache.delete(oldest.value)
  }
  cache.set(key, { at: Date.now(), body })
}

// Collapses the query string to a fixed set of values. Vercel's cache keyed on
// the raw URL, which meant every extra parameter created a new entry and a new
// request to Reddit; junk parameters also widen the range of responses the
// proxy is willing to fetch.
function normalizeQuery(params: URLSearchParams): string {
  const requested = Number(params.get('limit'))
  const limit = Number.isFinite(requested) ? Math.min(100, Math.max(1, requested)) : 15
  const normalized = new URLSearchParams({ limit: String(limit) })
  const t = params.get('t')
  if (t && ALLOWED_TIME_FILTERS.has(t)) normalized.set('t', t)
  return normalized.toString()
}

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET' },
    })
  }

  if (!(await verifySession(request))) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const url = new URL(request.url)
  const redditPath = url.searchParams.get('redditPath') || ''
  if (!ALLOWED_PATH.test(redditPath)) {
    return json({ error: 'Not Found' }, 404)
  }

  const query = normalizeQuery(url.searchParams)
  const cacheKey = `${redditPath}?${query}`

  const cached = readCache(cacheKey)
  if (cached !== null) {
    return passthrough(cached, 200, 'application/json')
  }

  try {
    const response = await fetch(`https://www.reddit.com/${redditPath}?${query}`, {
      headers: {
        'Cookie': process.env.REDDIT_COOKIE || '',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    const body = await response.text()

    // Failures are never cached: a stored 403 would keep being served for the
    // whole TTL. Reddit replies with an HTML error page here, not JSON, so the
    // content type is set from the status instead of being assumed.
    if (!response.ok) {
      return passthrough(body, response.status, 'text/plain; charset=utf-8')
    }

    writeCache(cacheKey, body)
    return passthrough(body, 200, 'application/json')
  } catch {
    return json({ error: 'Failed to fetch from Reddit' }, 502)
  }
}