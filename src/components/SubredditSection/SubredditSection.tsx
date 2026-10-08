import { useState } from "react";
import { usePosts } from "../../hooks/usePosts";
import { PostCard } from "../PostCard/PostCard";
import "./SubredditSection.css";

interface Props {
  subreddit: string;
  onRemove: (name: string) => void;
}

interface SortOption {
  label: string;
  sort: string;
  timeFilter?: string;
}

const SORT_OPTIONS: SortOption[] = [
  { label: "Rising", sort: "rising" },
  { label: "Hot", sort: "hot" },
  { label: "New", sort: "new" },
  { label: "Top — Today", sort: "top", timeFilter: "day" },
  { label: "Top — Week", sort: "top", timeFilter: "week" },
  { label: "Top — Month", sort: "top", timeFilter: "month" },
  { label: "Top — All Time", sort: "top", timeFilter: "all" },
];

export // A small stack of blocks echoing the corner mark on the login panel, so each
// column is identified the same way the app identifies itself.
function ColumnMark() {
  return (
    <svg className="subreddit-section__mark" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="0" y="0" width="10" height="10" rx="1.5" />
      <rect x="14" y="0" width="10" height="10" rx="1.5" />
      <rect x="0" y="14" width="10" height="10" rx="1.5" />
    </svg>
  );
}

export function SubredditSection({ subreddit, onRemove }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { sort, timeFilter } = SORT_OPTIONS[selectedIndex];
  const { posts, loading, error, refresh } = usePosts(
    subreddit,
    sort,
    timeFilter,
  );

  return (
    <section className="subreddit-section">
      <div className="subreddit-section__header">
        <ColumnMark />
        <h2><span>r/</span>{subreddit}</h2>
        <div className="subreddit-section__header-right">
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            aria-label="Sort posts"
          >
            {SORT_OPTIONS.map((opt, i) => (
              <option key={i} value={i}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            className="subreddit-section__refresh"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh posts"
          >
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          <button
            className="subreddit-section__remove"
            onClick={() => onRemove(subreddit)}
            aria-label={`Remove r/${subreddit}`}
          >
            <svg
              aria-hidden="true"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="subreddit-section__posts" aria-live="polite" aria-busy={loading}>
        {loading && (
          <div className="post-list">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="post-skeleton" />
            ))}
          </div>
        )}

        {error && (
          <div className="subreddit-section__error">
            <span>{error}</span>
            <button onClick={refresh}>Retry</button>
          </div>
        )}

        {!loading && !error && (
          <div className="post-list">
            {posts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
