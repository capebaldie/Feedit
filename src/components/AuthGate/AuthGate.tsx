import { useEffect, type ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Login } from "../Login/Login";
import "./AuthGate.css";

// Renders a loading screen while the session is checked, the login form while
// signed out, and the app once a valid session exists.
//
// Because this wraps <App />, no SubredditSection mounts until authentication
// succeeds — which is what stops the feed from flashing API errors before the
// user has entered their code.
export function AuthGate({ children }: { children: ReactNode }) {
  const { status, login } = useAuth();

  // Theme initialisation lives here rather than in App so it still applies to
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

  if (status === "unauthenticated") {
    return (
      <div className="auth-gate auth-gate--centered">
        <Login onLogin={login} />
      </div>
    );
  }

  return <>{children}</>;
}