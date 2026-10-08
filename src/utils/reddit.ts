import type { Post, RedditListing, RedditAbout } from "../types/reddit";
import { UNAUTHORIZED_EVENT } from "./auth";

// In development, requests go through the Vite proxy (/api/reddit → www.reddit.com)
// In production, requests go through the Vercel edge function (api/reddit → www.reddit.com)
// which injects auth cookies server-side, bypassing CORS and Reddit's login requirement.
const REDDIT_BASE = "/api/reddit";

// The session cookie rides along automatically on these same-origin requests.
async function request(path: string, signal?: AbortSignal): Promise<Response> {
  const res = await fetch(`${REDDIT_BASE}${path}`, { signal });

  if (res.status === 401) {
    // Session expired mid-use. Hand control back to the login screen instead of
    // leaving "Could not load r/…" errors all over the feed.
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }

  return res;
}

export function relativeTime(utcSeconds: number): string {
  const seconds = Math.floor(Date.now() / 1000) - utcSeconds;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

export function parsePosts(json: RedditListing): Post[] {
  return json.data.children.map(({ data }) => ({
    id: data.id,
    title: data.title,
    author: data.author,
    score: data.score,
    numComments: data.num_comments,
    permalink: data.permalink,
    created: data.created,
    flair: data.link_flair_text ?? null,
    domain: data.is_self ? null : data.domain,
    isSelf: data.is_self,
  }));
}

export async function validateSubreddit(
  name: string,
  signal?: AbortSignal,
): Promise<boolean> {
  try {
    const res = await request(`/r/${name}/about.json`, signal);
    if (!res.ok) return false;
    const json: RedditAbout = await res.json();
    return json?.data?.subreddit_type === "public";
  } catch {
    return false;
  }
}

export async function fetchPosts(
  subreddit: string,
  sort: string,
  timeFilter: string | undefined,
  signal?: AbortSignal,
): Promise<Post[]> {
  const params = new URLSearchParams({ limit: "15" });
  if (timeFilter) params.set("t", timeFilter);

  const res = await request(`/r/${subreddit}/${sort}.json?${params}`, signal);
  if (!res.ok) throw new Error(`Failed to load r/${subreddit}`);
  const json: RedditListing = await res.json();
  return parsePosts(json);
}
