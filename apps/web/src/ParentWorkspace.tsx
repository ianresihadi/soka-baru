import { ParentHome } from "./ParentHome";

/**
 * Parent workspace. Wraps the existing mobile-first, reassurance-first Beranda
 * Anak surface (summary, notifications, attendance, published grades, published
 * notes, messages). Parent visibility rules are unchanged: only published
 * grades and published notes ever reach this surface.
 */
export function ParentWorkspace() {
  return (
    <div className="px-4 pb-10 pt-2">
      <ParentHome />
    </div>
  );
}
