import { useMemo, useState } from "react";
import type { MembershipSummary } from "@soka/shared";
import { deriveWorkspaceAccess } from "./api";
import { RoleSwitcher, type Workspace } from "./RoleSwitcher";
import { TeacherWorkspace } from "./TeacherWorkspace";
import { ParentWorkspace } from "./ParentWorkspace";

/**
 * Authenticated app shell. Detects supported workspaces from membership roles,
 * lets a multi-role user switch context, shows signed-in/membership context in
 * the header, and offers a real sign-out. Raw API logs are not shown.
 */
export function AppShell({
  email,
  memberships,
  onSignOut,
  signingOut = false,
  signOutError = null,
}: {
  email: string | null;
  memberships: MembershipSummary[];
  onSignOut: () => void;
  signingOut?: boolean;
  signOutError?: string | null;
}) {
  const access = useMemo(
    () => deriveWorkspaceAccess(memberships),
    [memberships],
  );
  const [workspace, setWorkspace] = useState<Workspace>(
    access.teacher ? "teacher" : "parent",
  );

  const both = access.teacher && access.parent;
  const active: Workspace = both
    ? workspace
    : access.teacher
      ? "teacher"
      : "parent";

  const primary = memberships[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-2">
          <div className="min-w-0">
            <span className="text-base font-semibold text-slate-800">SOKA</span>
            {primary && (
              <span className="ml-2 truncate text-xs text-slate-500">
                {primary.schoolName} · {primary.roles.join(", ")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {both && <RoleSwitcher value={active} onChange={setWorkspace} />}
            <div className="hidden text-right sm:block">
              {email && (
                <span className="block text-xs text-slate-500">{email}</span>
              )}
            </div>
            <button
              type="button"
              onClick={onSignOut}
              disabled={signingOut}
              className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-60"
            >
              {signingOut ? "Keluar…" : "Keluar"}
            </button>
          </div>
        </div>
        {signOutError && (
          <div className="border-t border-red-100 bg-red-50">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-1.5">
              <span className="text-xs text-red-700">{signOutError}</span>
              <button
                type="button"
                onClick={onSignOut}
                disabled={signingOut}
                className="shrink-0 rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-100 disabled:opacity-60"
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}
      </header>

      <main>
        {!access.teacher && !access.parent ? (
          <EmptyState />
        ) : active === "teacher" ? (
          <TeacherWorkspace />
        ) : (
          <ParentWorkspace />
        )}
      </main>
    </div>
  );
}

/** Shown when the user has no supported membership/role yet. */
function EmptyState() {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
      <p className="font-medium text-slate-800">Belum ada akses ruang kerja.</p>
      <p className="mt-1 text-sm text-slate-600">
        Akun Anda belum terhubung sebagai guru/wali kelas atau orang tua di
        sekolah mana pun. Minta kode sekolah atau kode tautan anak dari pihak
        sekolah untuk melanjutkan.
      </p>
    </div>
  );
}
