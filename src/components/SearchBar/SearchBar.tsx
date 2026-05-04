import { useState, useRef } from 'react';
import { validateSubreddit } from '../../utils/reddit';
import './SearchBar.css';

interface Props {
  existingSubreddits: string[];
  onAdd: (name: string) => void;
  autoFocus?: boolean;
}

type Status = 'idle' | 'loading' | 'not_found' | 'duplicate';

export function SearchBar({ existingSubreddits, onAdd, autoFocus }: Props) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const abortRef = useRef<AbortController | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = value.trim().toLowerCase();
    if (!name) return;

    if (existingSubreddits.includes(name)) {
      setStatus('duplicate');
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setStatus('loading');
    const valid = await validateSubreddit(name, abortRef.current.signal);

    if (valid) {
      onAdd(name);
      setValue('');
      setStatus('idle');
    } else {
      setStatus('not_found');
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    if (status !== 'idle') setStatus('idle');
  }

  const feedbackMap: Record<Exclude<Status, 'idle' | 'loading'>, string> = {
    not_found: 'Subreddit not found or private.',
    duplicate: 'Already in your list.',
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Add a subreddit..."
        value={value}
        onChange={handleChange}
        disabled={status === 'loading'}
        aria-label="Subreddit name"
        autoFocus={autoFocus}
      />
      <button type="submit" disabled={status === 'loading' || !value.trim()}>
        {status === 'loading' ? 'Adding…' : 'Add'}
      </button>
      {status !== 'idle' && status !== 'loading' && (
        <span className="search-bar__feedback" role="alert">{feedbackMap[status]}</span>
      )}
    </form>
  );
}
