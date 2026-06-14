export type Workspace = "teacher" | "parent";

/**
 * Context switcher shown only when the signed-in user has both a teacher and a
 * parent workspace. A single-workspace user never sees it.
 */
export function RoleSwitcher({
  value,
  onChange,
}: {
  value: Workspace;
  onChange: (next: Workspace) => void;
}) {
  const items: { key: Workspace; label: string }[] = [
    { key: "teacher", label: "Guru" },
    { key: "parent", label: "Orang Tua" },
  ];
  return (
    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          aria-pressed={value === it.key}
          className={`rounded-md px-3 py-1 font-medium ${
            value === it.key
              ? "bg-slate-800 text-white"
              : "text-slate-600 hover:text-slate-800"
          }`}
          onClick={() => onChange(it.key)}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
