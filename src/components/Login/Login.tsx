import { useState, type FormEvent } from "react";
import "./Login.css";

interface LoginProps {
  onLogin: (code: string) => Promise<boolean>;
}

export function Login({ onLogin }: LoginProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !code.trim()) return;

    setBusy(true);
    setError(null);

    try {
      if ((await onLogin(code.trim())) === false) setError("Incorrect code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="login__form" onSubmit={handleSubmit}>
      <h1 className="login__title">Feedit</h1>
      <p className="login__hint">Enter your access code to continue.</p>

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
        aria-describedby={error ? "login-error" : undefined}
      />

      {error && (
        <p className="login__error" id="login-error" role="alert">
          {error}
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
