import { useState, useEffect } from "react";
import { useSubreddits } from "./hooks/useSubreddits";
import { SubredditSection } from "./components/SubredditSection/SubredditSection";
import { SearchModal } from "./components/SearchModal/SearchModal";
import { logout } from "./utils/auth";
import "./App.css";

export default function App() {
  const { subreddits, addSubreddit, removeSubreddit } = useSubreddits();
  const [modalOpen, setModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light"
    );
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Feedit</h1>
        <div className="app__header-actions">
          <button
            className="app__theme-btn"
            onClick={() => setDarkMode((d) => !d)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button
            className="app__add-btn"
            onClick={() => setModalOpen(true)}
            aria-label="Add subreddit"
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button
            className="app__logout-btn"
            onClick={() => void logout()}
            aria-label="Log out"
            title="Log out"
          >
            <svg
              aria-hidden="true"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {subreddits.length === 0 ? (
        <div className="app__empty">
          <p>
            Click <strong>+</strong> to add your first subreddit.
          </p>
        </div>
      ) : (
        <div className="app__feed">
          {subreddits.map((name) => (
            <SubredditSection
              key={name}
              subreddit={name}
              onRemove={removeSubreddit}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <SearchModal
          existingSubreddits={subreddits}
          onAdd={addSubreddit}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
