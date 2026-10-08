// Shared client-side auth plumbing. The session itself lives in an HttpOnly
// cookie, so nothing here ever handles a credential — only the browser's
// automatic Cookie header does.

export const UNAUTHORIZED_EVENT = 'feedit:unauthorized';

export async function logout(): Promise<void> {
  await fetch('/api/logout', { method: 'POST' }).catch(() => null);
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}