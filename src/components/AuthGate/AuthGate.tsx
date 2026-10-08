import { useEffect, type ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Login } from "../Login/Login";
import "./AuthGate.css";

// A column of posts, drawn as the app actually draws it: fixed-width tracks
// side by side, each holding stacked entries.
// A column of posts, drawn the way the app draws them: fixed-width tracks
// side by side, each holding stacked entries. The lead card of every column
// is tinted with the brand orange.
const COLUMNS = [
  { x: 0, cards: [16, 26, 12] },
  { x: 30, cards: [22, 14, 20] },
  { x: 60, cards: [12, 24, 16] },
  { x: 90, cards: [20, 12, 24] },
  { x: 120, cards: [14, 22, 14] },
  { x: 150, cards: [24, 14, 18] },
];

function FeedColumns() {
  return (
    <svg
      className="auth-gate__motif"
      viewBox="0 0 180 70"
      fill="none"
      aria-hidden="true"
    >
      {COLUMNS.map((column) => (
        <rect
          key={column.x}
          x={column.x}
          y={0}
          width="24"
          height="70"
          rx="3"
          className="auth-gate__track"
        />
      ))}

      {COLUMNS.flatMap((column) =>
        column.cards.map((height, i) => {
          const top = column.cards
            .slice(0, i)
            .reduce((sum, h) => sum + h + 4, 4);
          return (
            <rect
              key={`${column.x}-${i}`}
              x={column.x + 3}
              y={top}
              width="18"
              height={height}
              rx="2"
              className={
                i === 0 ? "auth-gate__card auth-gate__card--lead" : "auth-gate__card"
              }
            />
          );
        }),
      )}
    </svg>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { status, login } = useAuth();

  // Theme initialisation lives here rather than in App so it also applies to
  // the login screen, which renders instead of the app while signed out. App
  // keeps ownership of the toggle; this only sets the starting value.
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark =
      saved === "dark" ||
      (saved === null &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.setAttribute(
      "data-theme",
      prefersDark ? "dark" : "light",
    );
  }, []);

  if (status === "loading") {
    return (
      <div className="auth-gate auth-gate--centered">
        <div
          className="auth-gate__spinner"
          role="status"
          aria-label="Checking session"
        />
      </div>
    );
  }

  // Once authenticated the app owns the whole viewport, so it is returned
  // unwrapped — the split layout below only belongs on the login screen.
  if (status === "authenticated") {
    return <>{children}</>;
  }

  return (
    <div className="auth-gate">
      <div className="auth-gate__inner">
        <div className="auth-gate__masthead">
          <p className="auth-gate__wordmark">
            <span className="auth-gate__wordmark-dot" aria-hidden="true" />
            FEEDIT
          </p>
          <h1 className="auth-gate__headline">
            Every subreddit,
            <br />
            one column.
          </h1>
          <p className="auth-gate__sub">
            A private reader. Enter your access code to open your feed.
          </p>
          <FeedColumns />
        </div>

        <div className="auth-gate__panel">
          <Login onLogin={login} />
        </div>
      </div>
    </div>
  );
}