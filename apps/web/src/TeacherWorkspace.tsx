import { PapanPagi } from "./PapanPagi";
import { NavChips } from "./components/ui";

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
    <div className="mx-auto max-w-4xl px-4 py-4">
      <div className="sticky top-[3.25rem] z-[5] -mx-4 mb-3 border-b border-slate-100 bg-stone-50/95 px-4 py-2 backdrop-blur sm:top-[3.5rem]">
        <NavChips items={NAV} />
      </div>
      <PapanPagi />
    </div>
  );
}
