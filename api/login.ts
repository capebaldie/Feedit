// Exchanges the access code for a signed, HttpOnly session cookie.
// The code is read from the request body only — never a query string, which
// would land in Vercel's request logs in plaintext.
import { checkAccessCode, createSessionCookie, json } from './_helpers'

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'POST' },
    })
  }

  let code = ''
  try {
    const body = (await request.json()) as { code?: unknown }
    if (typeof body?.code === 'string') code = body.code
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  // Rate limit this route to ~5 requests/minute/IP in the Vercel dashboard.
  // That bound is what makes a 6-digit code viable.
  if (!code || !checkAccessCode(code)) {
    return json({ error: 'Incorrect code' }, 401)
  }

  return json({ ok: true }, 200, { 'Set-Cookie': await createSessionCookie() })
}