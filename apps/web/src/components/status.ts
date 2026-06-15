// Maps raw backend enum values to user-facing Indonesian labels + a badge tone.
// Keeps raw strings like "completed_late" / "draft" out of the UI.

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export interface StatusView {
  label: string;
  tone: Tone;
}

const ATTENDANCE: Record<string, StatusView> = {
  hadir: { label: "Hadir", tone: "success" },
  sakit: { label: "Sakit", tone: "info" },
  izin: { label: "Izin", tone: "info" },
  alpa: { label: "Alpa", tone: "danger" },
  terlambat: { label: "Terlambat", tone: "warning" },
};

export function attendanceStatus(status: string | null | undefined): StatusView {
  if (!status) return { label: "Belum tercatat", tone: "neutral" };
  return ATTENDANCE[status] ?? { label: status, tone: "neutral" };
}

const COMPLETION: Record<string, StatusView> = {
  not_started: { label: "Belum dimulai", tone: "neutral" },
  in_progress: { label: "Sedang berjalan", tone: "info" },
  completed_on_time: { label: "Selesai tepat waktu", tone: "success" },
  completed_late: { label: "Selesai terlambat", tone: "warning" },
};

export function completionStatus(value: string | null | undefined): StatusView {
  if (!value) return { label: "Belum dimulai", tone: "neutral" };
  return COMPLETION[value] ?? { label: value, tone: "neutral" };
}

export function gradeVisibility(status: string): StatusView {
  return status === "published"
    ? { label: "Dipublikasikan", tone: "success" }
    : { label: "Draf", tone: "neutral" };
}

export function noteVisibility(status: string): StatusView {
  return status === "published"
    ? { label: "Dibagikan", tone: "success" }
    : { label: "Internal", tone: "neutral" };
}

export function kkmView(isBelowKkm: boolean): StatusView {
  return isBelowKkm
    ? { label: "Di bawah KKM", tone: "danger" }
    : { label: "Memenuhi KKM", tone: "success" };
}

const LINK_CODE: Record<string, StatusView> = {
  active: { label: "Aktif", tone: "success" },
  used: { label: "Terpakai", tone: "neutral" },
  revoked: { label: "Dicabut", tone: "danger" },
};

export function linkCodeStatus(status: string): StatusView {
  return LINK_CODE[status] ?? { label: status, tone: "neutral" };
}

// Workspace/role accent labels for the shell.
export const WORKSPACE_LABEL: Record<string, string> = {
  teacher: "Guru",
  parent: "Orang Tua",
  admin: "Admin / Setup",
};
