// Shared helpers for the Edge Functions.
// The leading underscore stops Vercel from turning this file into a route.

const COOKIE_NAME = 'feedit_session'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

async function hmacKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

async function sign(payload: string): Promise<string> {
  const bytes = new Uint8Array(
    await crypto.subtle.sign('HMAC', await hmacKey(), new TextEncoder().encode(payload)),
  )
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Compared without early exit so the access code cannot be recovered by
// measuring how far a rejection got.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim()
  }
  return null
}

export function checkAccessCode(candidate: string): boolean {
  const expected = process.env.ACCESS_CODE
  if (!expected) return false
  return timingSafeEqual(candidate, expected)
}

export async function createSessionCookie(): Promise<string> {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000
  const token = `${expiresAt}.${await sign(String(expiresAt))}`
  return `${COOKIE_NAME}=${token}; Max-Age=${MAX_AGE_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`
}

export async function verifySession(request: Request): Promise<boolean> {
  const token = readCookie(request, COOKIE_NAME)
  if (!token) return false

  const dot = token.indexOf('.')
  if (dot === -1) return false

  const expiresAt = token.slice(0, dot)
  if (!timingSafeEqual(token.slice(dot + 1), await sign(expiresAt))) return false
  return Number(expiresAt) > Date.now()
}

// Responses from authenticated endpoints are never shared-cacheable. Vercel keys
// cache entries by URL, so a cacheable response would be handed to callers who
// never reached this code. Vary: Cookie states that intent explicitly.
function baseHeaders(extra: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Vary': 'Cookie',
    ...extra,
  }
}

export function json(
  value: unknown,
  status = 200,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: baseHeaders(extra),
  })
}

// For bodies that are already serialised, such as a proxied Reddit response.
export function passthrough(content: string, status: number, contentType: string): Response {
  return new Response(content, {
    status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
      'Vary': 'Cookie',
    },
  })
}