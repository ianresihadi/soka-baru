import { useState } from "react";
import { signInEmail } from "./api";
import { Button, Field, Input, Notice } from "./components/ui";

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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-brand-700">SOKA</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sekolah yang transparan, responsif, dan tertib.
          </p>
        </div>

        <div className="rounded-xl2 border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-slate-800">Masuk</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Buka ruang kerja guru, orang tua, atau admin.
          </p>

          <form className="mt-5 flex flex-col gap-3" onSubmit={submit}>
            <Field label="Email">
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sekolah.sch.id"
                required
              />
            </Field>
            <Field label="Kata sandi">
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>

            {error && <Notice tone="danger">{error}</Notice>}

            <Button type="submit" disabled={submitting} className="mt-1 w-full">
              {submitting ? "Memproses…" : "Masuk"}
            </Button>
          </form>
        </div>

        <p className="mt-4 px-2 text-center text-xs text-slate-400">
          Akun demo lokal (local-dev / latihan pilot saja) tersedia setelah{" "}
          <code className="rounded bg-slate-100 px-1">pnpm db:seed</code>. Lihat{" "}
          <code className="rounded bg-slate-100 px-1">docs/SETUP.md</code>.
        </p>
      </div>
    </div>
  );
}
