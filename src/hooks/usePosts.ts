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

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

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
