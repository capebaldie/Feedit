import { useState, type FormEvent } from "react";
import type { LoginFailure, LoginResult } from "../../hooks/useAuth";
import "./Login.css";

interface LoginProps {
  onLogin: (code: string) => Promise<LoginResult>;
}

const FAILURE_MESSAGE: Record<LoginFailure, string> = {
  incorrect: "Incorrect code.",
  "rate-limited": "Too many attempts. Try again in a few minutes.",
  unavailable: "Could not reach the server. Check your connection.",
};

export function Login({ onLogin }: LoginProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<LoginFailure | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !code.trim()) return;

    setBusy(true);
    setError(null);

    try {
      const result = await onLogin(code.trim());
      if (!result.ok) setError(result.reason);
    } finally {
      setBusy(false);
    }
  }

  const message = error ? FAILURE_MESSAGE[error] : null;

  return (
    <form className="login__form" onSubmit={handleSubmit}>
      <h2 className="login__title">Unlock your feed</h2>
      <p className="login__hint">
        This reader is private. Your session lasts 30 days on this browser.
      </p>

      <label className="login__label" htmlFor="login-code">
        Access code
      </label>
      <input
        id="login-code"
        className="login__input"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        autoFocus
        value={code}
        onChange={(event) => setCode(event.target.value)}
        disabled={busy}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? "login-error" : undefined}
      />

      {message && (
        <p className="login__error" id="login-error" role="alert">
          {message}
        </p>
      )}

      <button
        className="login__submit"
        type="submit"
        disabled={busy || !code.trim()}
      >
        {busy ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}