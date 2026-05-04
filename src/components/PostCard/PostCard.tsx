import type { Post } from "../../types/reddit";
import { relativeTime } from "../../utils/reddit";
import "./PostCard.css";

type Props = Omit<Post, "id">;

export function PostCard({
  title,
  author,
  score,
  numComments,
  permalink,
  created,
  flair,
  domain,
}: Props) {
  return (
    <a
      className="post-card"
      href={`https://www.reddit.com${permalink}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="post-card__topline">
        <span className="post-card__author">u/{author}</span>
        <span className="post-card__age">{relativeTime(created)}</span>
      </div>
      {flair && <span className="post-card__flair">{flair}</span>}
      <div className="post-card__title">{title}</div>
      <div className="post-card__meta">
        <span>
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
          {score.toLocaleString()}
        </span>
        <span>
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {numComments.toLocaleString()}
        </span>
        {domain && <span className="post-card__domain">{domain}</span>}
      </div>
    </a>
  );
}
