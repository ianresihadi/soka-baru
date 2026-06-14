import { PapanPagi } from "./PapanPagi";

const NAV = [
  { href: "#papan-pagi", label: "Papan Pagi" },
  { href: "#absensi", label: "Absensi" },
  { href: "#nilai-catatan", label: "Nilai & Catatan" },
  { href: "#pesan-ortu", label: "Pesan Ortu" },
];

/**
 * Teacher workspace. Wraps the existing Papan Pagi surface (Papan Pagi +
 * attendance + Nilai & Catatan + the unreplied-messages status section). The
 * nav anchors to real sections only — no dead menu items.
 */
export function TeacherWorkspace() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <nav className="mb-2 flex flex-wrap gap-2">
        {NAV.map((n) => (
          <a
            key={n.href}
            href={n.href}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-slate-400 hover:text-slate-800"
          >
            {n.label}
          </a>
        ))}
      </nav>
      <PapanPagi />
    </div>
  );
}
