import { useState } from "react";
import type { MembershipSummary } from "@soka/shared";

/**
 * Minimal Sprint 002 validation UI. Not a product screen.
 * It exists only to exercise auth, membership resolution, and tenant isolation
 * against the running API.
 */
export function App() {
  const [email, setEmail] = useState("guru.a@example.com");
  const [password, setPassword] = useState("LocalDevPassword123!");
  const [log, setLog] = useState<string[]>([]);
  const [memberships, setMemberships] = useState<MembershipSummary[]>([]);

  const append = (line: string) => setLog((prev) => [line, ...prev]);

  async function call(path: string, init?: RequestInit) {
    const res = await fetch(path, { credentials: "include", ...init });
    const text = await res.text();
    append(`${init?.method ?? "GET"} ${path} -> ${res.status} ${text}`);
    return { status: res.status, text };
  }

  async function signIn() {
    await call("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  }

  async function loadMemberships() {
    const res = await fetch("/me/memberships", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      setMemberships(data.memberships ?? []);
    }
    append(`GET /me/memberships -> ${res.status}`);
  }

  async function tenantCheckRead() {
    await call("/tenant-check/school");
  }

  async function tenantCheckWriteWithForeignId() {
    // Smuggle a fake foreign school_id; the server must ignore it.
    await call("/tenant-check/school", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Renamed by validation UI",
        schoolId: "00000000-0000-0000-0000-000000000000",
      }),
    });
  }

  return (
    <div className="mx-auto max-w-2xl p-6 font-sans">
      <h1 className="text-xl font-semibold">SOKA Baru — Foundation Validation</h1>
      <p className="mt-1 text-sm text-gray-500">
        Sprint 002 auth / membership / tenant-isolation checks. Local dev only.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <input
          className="rounded border px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
        />
        <input
          className="rounded border px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={signIn}>
          Sign in
        </button>
        <button className="rounded bg-gray-700 px-3 py-2 text-white" onClick={loadMemberships}>
          Load memberships
        </button>
        <button className="rounded bg-gray-700 px-3 py-2 text-white" onClick={tenantCheckRead}>
          Tenant read
        </button>
        <button
          className="rounded bg-amber-600 px-3 py-2 text-white"
          onClick={tenantCheckWriteWithForeignId}
        >
          Tenant write (foreign id)
        </button>
      </div>

      {memberships.length > 0 && (
        <ul className="mt-4 list-disc pl-6 text-sm">
          {memberships.map((m) => (
            <li key={m.membershipId}>
              {m.schoolName} ({m.schoolCode}) — roles: {m.roles.join(", ")}
            </li>
          ))}
        </ul>
      )}

      <pre className="mt-4 max-h-80 overflow-auto rounded bg-gray-900 p-3 text-xs text-green-300">
        {log.join("\n")}
      </pre>
    </div>
  );
}
