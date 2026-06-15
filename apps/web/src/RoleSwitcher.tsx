import type { Workspace } from "./api";

const LABELS: Record<Workspace, string> = {
  teacher: "Guru",
  parent: "Orang Tua",
  admin: "Admin / Setup",
};

/**
 * Context switcher shown only when the signed-in user has more than one
 * available workspace. Renders exactly the workspaces passed in `available`.
 */
export function RoleSwitcher({
  value,
  available,
  onChange,
}: {
  value: Workspace;
  available: Workspace[];
  onChange: (next: Workspace) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
      {available.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          className={`rounded-md px-3 py-1 font-medium ${
            value === key
              ? "bg-slate-800 text-white"
              : "text-slate-600 hover:text-slate-800"
          }`}
          onClick={() => onChange(key)}
        >
          {LABELS[key]}
        </button>
      ))}
    </div>
  );
}
