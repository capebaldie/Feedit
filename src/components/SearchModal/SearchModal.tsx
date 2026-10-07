import { useEffect, useRef } from 'react';
import { SearchBar } from '../SearchBar/SearchBar';
import './SearchModal.css';

interface Props {
  existingSubreddits: string[];
  onAdd: (name: string) => void;
  onClose: () => void;
}

export function SearchModal({ existingSubreddits, onAdd, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleAdd(name: string) {
    onAdd(name);
    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Add subreddit">
        <div className="modal__header">
          <span className="modal__title">Add subreddit</span>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <SearchBar existingSubreddits={existingSubreddits} onAdd={handleAdd} autoFocus />
      </div>
    </div>
  );
}
