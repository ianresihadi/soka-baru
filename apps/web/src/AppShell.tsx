import { useMemo, useState } from "react";
import type { MembershipSummary } from "@soka/shared";
import {
  availableWorkspaces,
  deriveWorkspaceAccess,
  type Workspace,
} from "./api";
import { RoleSwitcher } from "./RoleSwitcher";
import { TeacherWorkspace } from "./TeacherWorkspace";
import { ParentWorkspace } from "./ParentWorkspace";
import { AdminSetupWorkspace } from "./AdminSetupWorkspace";
import { Badge, Button, EmptyState as EmptyStateCard } from "./components/ui";
import { WORKSPACE_LABEL } from "./components/status";

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
  const workspaces = useMemo(() => availableWorkspaces(access), [access]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  // Active workspace = the user's chosen one if still available, else the first.
  const active: Workspace | null =
    workspace && workspaces.includes(workspace)
      ? workspace
      : (workspaces[0] ?? null);

  const primary = memberships[0];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-brand-700">SOKA</span>
            {primary && (
              <span className="hidden min-w-0 items-center gap-2 sm:flex">
                <span className="h-4 w-px bg-slate-200" />
                <span className="truncate text-sm font-medium text-slate-700">
                  {primary.schoolName}
                </span>
                {active && <Badge tone="brand">{WORKSPACE_LABEL[active]}</Badge>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {workspaces.length > 1 && active && (
              <RoleSwitcher value={active} available={workspaces} onChange={setWorkspace} />
            )}
            {email && (
              <span className="hidden max-w-[12rem] truncate text-xs text-slate-500 md:block">
                {email}
              </span>
            )}
            <Button variant="secondary" size="sm" onClick={onSignOut} disabled={signingOut}>
              {signingOut ? "Keluar…" : "Keluar"}
            </Button>
          </div>
        </div>
        {/* On mobile, show school context on its own line so nothing overflows. */}
        {primary && (
          <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-1.5 sm:hidden">
            <span className="truncate text-xs font-medium text-slate-600">
              {primary.schoolName}
            </span>
            {active && <Badge tone="brand">{WORKSPACE_LABEL[active]}</Badge>}
          </div>
        )}
        {signOutError && (
          <div className="border-t border-rose-100 bg-rose-50">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-1.5">
              <span className="text-xs text-rose-700">{signOutError}</span>
              <Button variant="danger" size="sm" onClick={onSignOut} disabled={signingOut}>
                Coba lagi
              </Button>
            </div>
          </div>
        )}
      </header>

      <main>
        {active === null ? (
          <div className="mx-auto mt-10 max-w-md px-4">
            <EmptyStateCard
              tone="warning"
              title="Belum ada akses ruang kerja"
              description="Akun Anda belum terhubung sebagai guru/wali kelas atau orang tua di sekolah mana pun. Minta kode sekolah atau kode tautan anak dari pihak sekolah untuk melanjutkan."
            />
          </div>
        ) : active === "teacher" ? (
          <TeacherWorkspace />
        ) : active === "parent" ? (
          <ParentWorkspace />
        ) : (
          <AdminSetupWorkspace
            schoolName={primary?.schoolName}
            schoolCode={primary?.schoolCode}
          />
        )}
      </main>
    </div>
  );
}
