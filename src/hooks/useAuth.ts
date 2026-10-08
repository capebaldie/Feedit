import { useCallback, useEffect, useState } from "react";
import { UNAUTHORIZED_EVENT } from "../utils/auth";

export type AuthStatus = "loading" | "unauthenticated" | "authenticated";

export interface UseAuthResult {
  status: AuthStatus;
  login: (code: string) => Promise<boolean>;
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

  const login = useCallback(async (code: string) => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => null);

    if (!res?.ok) return false;
    setStatus("authenticated");
    return true;
  }, []);

  return { status, login };
}
