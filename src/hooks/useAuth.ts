import { useCallback, useEffect, useState } from "react";
import { UNAUTHORIZED_EVENT } from "../utils/auth";

export type AuthStatus = "loading" | "unauthenticated" | "authenticated";

// The WAF rate limit answers 403, the login function answers 401 for a wrong
// code. Telling them apart stops a lockout from reading as a bad password.
export type LoginFailure = "incorrect" | "rate-limited" | "unavailable";

export type LoginResult = { ok: true } | { ok: false; reason: LoginFailure };

export interface UseAuthResult {
  status: AuthStatus;
  login: (code: string) => Promise<LoginResult>;
}

export function useAuth(): UseAuthResult {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;

    fetch("/api/session")
      .then((res) => {
        if (active) setStatus(res.ok ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        if (active) setStatus("unauthenticated");
      });

    // A 30-day session can expire while the tab is open. src/utils/reddit.ts
    // turns that 401 into this event so the login screen comes back in place
    // rather than leaving stale error messages on screen.
    const onUnauthorized = () => setStatus("unauthenticated");
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);

    return () => {
      active = false;
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    };
  }, []);

  const login = useCallback(async (code: string): Promise<LoginResult> => {
    let res: Response;
    try {
      res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
    } catch {
      return { ok: false, reason: "unavailable" };
    }

    if (res.ok) {
      setStatus("authenticated");
      return { ok: true };
    }

    if (res.status === 401) return { ok: false, reason: "incorrect" };
    if (res.status === 403 || res.status === 429) {
      return { ok: false, reason: "rate-limited" };
    }
    return { ok: false, reason: "unavailable" };
  }, []);

  return { status, login };
}