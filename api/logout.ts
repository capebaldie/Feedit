// Clears the session cookie. Rotating SESSION_SECRET revokes every session
// without needing this endpoint.
import { clearSessionCookie, json } from './_helpers'

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

  return json({ ok: true }, 200, { 'Set-Cookie': clearSessionCookie() })
}