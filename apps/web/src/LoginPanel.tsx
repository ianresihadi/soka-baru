import { useState } from "react";
import { signInEmail } from "./api";

/**
 * Sign-in surface, clearly separated from the logged-in app. Shows sign-in
 * errors plainly. Not a raw API console.
 */
export function LoginPanel({
  onSignedIn,
}: {
  onSignedIn: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signInEmail(email.trim(), password);
    setSubmitting(false);
    if (result.ok) {
      onSignedIn(email.trim());
    } else {
      setError(result.error ?? "Gagal masuk.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-800">SOKA</h1>
        <p className="mt-1 text-sm text-slate-500">
          Masuk untuk membuka ruang kerja guru atau orang tua.
        </p>

        <form className="mt-5 flex flex-col gap-3" onSubmit={submit}>
          <label className="text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@sekolah.sch.id"
              required
            />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Kata sandi
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {submitting ? "Memproses…" : "Masuk"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          Akun demo lokal (local-dev / latihan pilot saja) tersedia setelah
          <code className="mx-1 rounded bg-slate-100 px-1">pnpm db:seed</code>.
          Lihat <code className="rounded bg-slate-100 px-1">docs/SETUP.md</code>.
        </p>
      </div>
    </div>
  );
}
