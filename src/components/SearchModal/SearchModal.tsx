import { useEffect, useRef } from 'react';
import { SearchBar } from '../SearchBar/SearchBar';
import './SearchModal.css';

interface Props {
  existingSubreddits: string[];
  onAdd: (name: string) => void;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function SearchModal({ existingSubreddits, onAdd, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Remember what opened the dialog and hand focus back to it on close.
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    return () => restoreFocusRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // aria-modal promises focus stays inside the dialog, so Tab and
      // Shift+Tab wrap rather than escaping to the page behind.
      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
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
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add subreddit"
        ref={dialogRef}
      >
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