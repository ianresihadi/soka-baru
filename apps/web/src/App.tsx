import { useEffect, useState } from "react";
import type { MembershipSummary } from "@soka/shared";
import {
  getMemberships,
  getSession,
  signOut,
  type Session,
} from "./api";
import { AppShell } from "./AppShell";
import { LoginPanel } from "./LoginPanel";

/**
 * Root of the SOKA web app. Resolves the session first: unauthenticated users
 * see the sign-in surface; authenticated users get the role-aware app shell.
 * This replaces the Sprint 002 raw "Foundation Validation" console.
 */
export function App() {
  const [phase, setPhase] = useState<"loading" | "signed-out" | "signed-in">(
    "loading",
  );
  const [memberships, setMemberships] = useState<MembershipSummary[]>([]);
  const [email, setEmail] = useState<string | null>(null);

  async function loadAuthedState(session: Session) {
    setMemberships(await getMemberships());
    setPhase("signed-in");
    void session;
  }

  // Resolve any existing session on first load (e.g. after a refresh).
  useEffect(() => {
    void (async () => {
      const session = await getSession();
      if (session) await loadAuthedState(session);
      else setPhase("signed-out");
    })();
  }, []);

  async function handleSignedIn(signedInEmail: string) {
    setEmail(signedInEmail);
    const session = await getSession();
    if (session) await loadAuthedState(session);
    else setPhase("signed-out");
  }

  async function handleSignOut() {
    await signOut();
    setMemberships([]);
    setEmail(null);
    setPhase("signed-out");
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Memuat…</p>
      </div>
    );
  }

  if (phase === "signed-out") {
    return <LoginPanel onSignedIn={handleSignedIn} />;
  }

  return (
    <AppShell
      email={email}
      memberships={memberships}
      onSignOut={handleSignOut}
    />
  );
}
