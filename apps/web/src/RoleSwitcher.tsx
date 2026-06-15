import type { Workspace } from "./api";
import { WORKSPACE_LABEL } from "./components/status";

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
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-sm">
      {available.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          className={`rounded-md px-3 py-1 font-medium transition-colors ${
            value === key
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
          onClick={() => onChange(key)}
        >
          {WORKSPACE_LABEL[key]}
        </button>
      ))}
    </div>
  );
}

