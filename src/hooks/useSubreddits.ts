import { useState, useEffect } from "react";

const STORAGE_KEY = "feedit_subreddits";
const DEFAULTS = ["programming", "kochi", "developersindia"];

export function useSubreddits() {
  const [subreddits, setSubreddits] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subreddits));
  }, [subreddits]);

  function addSubreddit(name: string) {
    const normalized = name.trim().toLowerCase();
    setSubreddits((prev) =>
      prev.includes(normalized) ? prev : [...prev, normalized],
    );
  }

  function removeSubreddit(name: string) {
    setSubreddits((prev) => prev.filter((s) => s !== name));
  }

  return { subreddits, addSubreddit, removeSubreddit };
}
