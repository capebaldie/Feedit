// Vercel Edge Function — production proxy for Reddit API.
// Replaces the Vite dev proxy when deployed.
//
// Vercel rewrites /api/reddit/r/subReddit/hot.json?limit=15
//            to → /api/reddit?redditPath=r/subReddit/hot.json&limit=15
// This function reconstructs the Reddit URL and fetches server-side.

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request) {
  const url = new URL(request.url)

  // Extract the reddit path injected by the vercel.json rewrite
  const redditPath = url.searchParams.get('redditPath') || ''
  url.searchParams.delete('redditPath')

  // Preserve remaining query params (limit, t, etc.)
  const queryString = url.searchParams.toString()
  const targetUrl = `https://www.reddit.com/${redditPath}${queryString ? '?' + queryString : ''}`

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Cookie': process.env.REDDIT_COOKIE || '',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
        'Accept':
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })

    const data = await response.text()

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from Reddit' }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}
