import { useEffect, useState } from "react";
import type { AttendanceStatus } from "@soka/shared";
import { TeacherGradesNotes } from "./TeacherGradesNotes";

const STATUSES: AttendanceStatus[] = [
  "hadir",
  "sakit",
  "izin",
  "alpa",
  "terlambat",
];

interface ClassItem {
  id: string;
  name: string;
}
interface PapanPagiData {
  classId: string;
  date: string;
  attendance: {
    total: number;
    recorded: number;
    missing: number;
    byStatus: Record<string, number>;
    completion: string;
    cutoffTime: string;
    timezone: string;
  };
  unrepliedMessages: {
    count: number;
    oldestWaitingAt: string | null;
    threads: { threadId: string; studentId: string }[];
  };
  attentionStudents: { studentId: string; fullName: string; reasons: string[] }[];
  schedule: { subject: string | null; roleInClass: string }[];
  roster: { studentId: string; fullName: string; status: string | null }[];
}

async function getJson<T>(path: string): Promise<T | null> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/**
 * Minimal, task-first Papan Pagi validation UI (Sprint 004). Dense-but-calm,
 * follows the approved section order. Not a marketing page.
 */
export function PapanPagi() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [data, setData] = useState<PapanPagiData | null>(null);
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const [msg, setMsg] = useState<string>("");

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    getJson<{ classes: ClassItem[] }>("/guru/classes").then((d) => {
      if (d?.classes?.length) {
        setClasses(d.classes);
        setClassId((prev) => prev || d.classes[0]!.id);
      }
    });
  }, []);

  async function refresh(cid: string) {
    const pp = await getJson<PapanPagiData>(
      `/guru/papan-pagi?classId=${cid}&date=${today}`,
    );
    setData(pp);
  }

  useEffect(() => {
    if (classId) void refresh(classId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function saveAttendance() {
    const records = Object.entries(draft).map(([studentId, status]) => ({
      studentId,
      status,
    }));
    if (records.length === 0) {
      setMsg("Pilih status minimal satu siswa.");
      return;
    }
    const res = await fetch(
      `/guru/classes/${classId}/attendance/${today}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ records }),
      },
    );
    setMsg(`Simpan absensi: ${res.status}`);
    if (res.ok) void refresh(classId);
  }

  return (
    <section className="mt-8 border-t pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Papan Pagi</h2>
        {classes.length > 0 && (
          <select
            className="rounded border px-2 py-1 text-sm"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {!data && (
        <p className="mt-2 text-sm text-gray-500">
          Sign in as a guru/wali_kelas with an assigned class to load Papan Pagi.
        </p>
      )}

      {data && (
        <div className="mt-4 grid gap-4">
          {/* 1. Status Absensi Hari Ini */}
          <div className="rounded border p-3">
            <h3 className="font-medium">1. Status Absensi Hari Ini</h3>
            <p className="text-sm text-gray-600">
              {data.attendance.recorded}/{data.attendance.total} tercatat ·{" "}
              <strong>{data.attendance.completion}</strong> · cutoff{" "}
              {data.attendance.cutoffTime} ({data.attendance.timezone})
            </p>
            <p className="text-xs text-gray-500">
              {Object.entries(data.attendance.byStatus)
                .map(([s, n]) => `${s}: ${n}`)
                .join("  ·  ") || "belum ada catatan"}
            </p>
          </div>

          {/* 2. Pesan Ortu Belum Dibalas */}
          <div className="rounded border p-3">
            <h3 className="font-medium">2. Pesan Ortu Belum Dibalas</h3>
            <p className="text-sm text-gray-600">
              {data.unrepliedMessages.count} menunggu balasan
              {data.unrepliedMessages.oldestWaitingAt
                ? ` · tertua: ${new Date(data.unrepliedMessages.oldestWaitingAt).toLocaleString()}`
                : ""}
            </p>
          </div>

          {/* 3. Siswa Perlu Perhatian */}
          <div className="rounded border p-3">
            <h3 className="font-medium">3. Siswa Perlu Perhatian</h3>
            {data.attentionStudents.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada.</p>
            ) : (
              <ul className="text-sm">
                {data.attentionStudents.map((a) => (
                  <li key={a.studentId}>
                    {a.fullName} — {a.reasons.join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 4. Jadwal Mengajar Hari Ini */}
          <div className="rounded border p-3">
            <h3 className="font-medium">4. Jadwal Mengajar Hari Ini</h3>
            <p className="text-sm text-gray-600">
              {data.schedule.length === 0
                ? "Belum ada penugasan."
                : data.schedule
                    .map((s) => `${s.roleInClass}${s.subject ? ` (${s.subject})` : ""}`)
                    .join("  ·  ")}
            </p>
          </div>

          {/* Attendance capture */}
          <div className="rounded border p-3">
            <h3 className="font-medium">Isi Absensi ({today})</h3>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {data.roster.map((s) => (
                  <tr key={s.studentId} className="border-t">
                    <td className="py-1 pr-2">{s.fullName}</td>
                    <td className="py-1">
                      <div className="flex flex-wrap gap-1">
                        {STATUSES.map((st) => (
                          <button
                            key={st}
                            type="button"
                            className={`rounded px-2 py-0.5 text-xs ${
                              draft[s.studentId] === st
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100"
                            }`}
                            onClick={() =>
                              setDraft((d) => ({ ...d, [s.studentId]: st }))
                            }
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="mt-3 rounded bg-blue-600 px-3 py-2 text-sm text-white"
              onClick={saveAttendance}
            >
              Simpan absensi
            </button>
            {msg && <span className="ml-2 text-xs text-gray-600">{msg}</span>}
          </div>

          <TeacherGradesNotes classId={classId} roster={data.roster} />
        </div>
      )}
    </section>
  );
}
