import { useState, useEffect, useCallback } from 'react';
import type { Post } from '../types/reddit';
import { fetchPosts } from '../utils/reddit';

interface UsePostsResult {
  posts: Post[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePosts(subreddit: string, sort: string, timeFilter?: string): UsePostsResult {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const requestKey = `${subreddit}/${sort}/${timeFilter ?? ''}/${tick}`;
  const [activeKey, setActiveKey] = useState(requestKey);

  // Reset to the loading state while rendering rather than from inside the
  // effect, which would trigger a cascading render.
  // https://react.dev/learn/you-might-not-need-an-effect
  if (requestKey !== activeKey) {
    setActiveKey(requestKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    const controller = new AbortController();

    fetchPosts(subreddit, sort, timeFilter, controller.signal)
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setError(`Could not load r/${subreddit}`);
        setLoading(false);
      });

    return () => controller.abort();
  }, [subreddit, sort, timeFilter, tick]);

  return { posts, loading, error, refresh };
}
