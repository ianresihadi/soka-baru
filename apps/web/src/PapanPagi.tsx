import { useEffect, useState } from "react";
import type { AttendanceStatus } from "@soka/shared";
import { TeacherGradesNotes } from "./TeacherGradesNotes";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Loading,
  Notice,
  Select,
  SectionHeader,
} from "./components/ui";
import { attendanceStatus, completionStatus, type Tone } from "./components/status";

const STATUSES: AttendanceStatus[] = ["hadir", "sakit", "izin", "alpa", "terlambat"];

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

// Selected-state colour for an attendance status button, by semantic tone.
const SELECTED_BTN: Record<Tone, string> = {
  neutral: "bg-slate-600 text-white border-slate-600",
  brand: "bg-brand-600 text-white border-brand-600",
  success: "bg-emerald-600 text-white border-emerald-600",
  warning: "bg-amber-500 text-white border-amber-500",
  danger: "bg-rose-600 text-white border-rose-600",
  info: "bg-sky-600 text-white border-sky-600",
};

/**
 * Task-first Papan Pagi. Dense-but-calm; follows the approved section order:
 * 1) Status Absensi, 2) Pesan Ortu Belum Dibalas, 3) Siswa Perlu Perhatian,
 * 4) Jadwal Mengajar.
 */
export function PapanPagi() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [data, setData] = useState<PapanPagiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  const [save, setSave] = useState<{ tone: Tone; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    getJson<{ classes: ClassItem[] }>("/guru/classes").then((d) => {
      if (d?.classes?.length) {
        setClasses(d.classes);
        setClassId((prev) => prev || d.classes[0]!.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  async function refresh(cid: string) {
    const pp = await getJson<PapanPagiData>(
      `/guru/papan-pagi?classId=${cid}&date=${today}`,
    );
    setData(pp);
    setLoading(false);
  }

  useEffect(() => {
    if (classId) {
      setLoading(true);
      setDraft({});
      setSave(null);
      void refresh(classId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function saveAttendance() {
    const records = Object.entries(draft).map(([studentId, status]) => ({
      studentId,
      status,
    }));
    if (records.length === 0) {
      setSave({ tone: "warning", text: "Pilih status minimal satu siswa dulu." });
      return;
    }
    setSaving(true);
    const res = await fetch(`/guru/classes/${classId}/attendance/${today}`, {
      method: "PUT",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ records }),
    });
    setSaving(false);
    if (res.ok) {
      setSave({ tone: "success", text: `Absensi tersimpan (${records.length} siswa).` });
      setDraft({});
      void refresh(classId);
    } else {
      setSave({ tone: "danger", text: "Gagal menyimpan absensi. Coba lagi." });
    }
  }

  if (loading) {
    return (
      <div className="pt-2">
        <Loading label="Memuat Papan Pagi…" />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Belum ada kelas untuk Papan Pagi"
        description="Masuk sebagai guru/wali kelas yang sudah ditugaskan ke sebuah kelas untuk melihat Papan Pagi."
      />
    );
  }

  const att = data.attendance;
  const completion = completionStatus(att.completion);
  const progressPct = att.total > 0 ? Math.round((att.recorded / att.total) * 100) : 0;

  return (
    <section id="papan-pagi" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Papan Pagi</h2>
          <p className="text-xs text-slate-500">Loop pagi: absensi dulu, lalu pesan orang tua.</p>
        </div>
        {classes.length > 0 && (
          <Select
            className="w-auto"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            aria-label="Pilih kelas"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {/* 1. Status Absensi Hari Ini */}
      <Card>
        <SectionHeader
          step={1}
          title="Status Absensi Hari Ini"
          right={<Badge tone={completion.tone}>{completion.label}</Badge>}
        />
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-700">
            {att.recorded}/{att.total}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Cutoff {att.cutoffTime} ({att.timezone})
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {STATUSES.map((s) =>
            att.byStatus[s] ? (
              <Badge key={s} tone={attendanceStatus(s).tone}>
                {attendanceStatus(s).label}: {att.byStatus[s]}
              </Badge>
            ) : null,
          )}
          {att.recorded === 0 && (
            <span className="text-xs text-slate-400">Belum ada catatan.</span>
          )}
        </div>
      </Card>

      {/* 2. Pesan Ortu Belum Dibalas */}
      <Card id="pesan-ortu">
        <SectionHeader
          step={2}
          title="Pesan Ortu Belum Dibalas"
          right={
            <Badge tone={data.unrepliedMessages.count > 0 ? "warning" : "success"}>
              {data.unrepliedMessages.count} menunggu
            </Badge>
          }
        />
        <p className="text-sm text-slate-600">
          {data.unrepliedMessages.count === 0
            ? "Semua pesan orang tua sudah dibalas."
            : data.unrepliedMessages.oldestWaitingAt
              ? `Pesan tertua menunggu sejak ${new Date(
                  data.unrepliedMessages.oldestWaitingAt,
                ).toLocaleString("id-ID")}.`
              : "Ada pesan yang menunggu balasan."}
        </p>
      </Card>

      {/* 3. Siswa Perlu Perhatian */}
      <Card>
        <SectionHeader
          step={3}
          title="Siswa Perlu Perhatian"
          right={
            data.attentionStudents.length > 0 ? (
              <Badge tone="warning">{data.attentionStudents.length}</Badge>
            ) : undefined
          }
        />
        {data.attentionStudents.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada. Semua aman hari ini.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.attentionStudents.map((a) => (
              <li key={a.studentId} className="flex items-center justify-between gap-2 py-2">
                <span className="text-sm font-medium text-slate-700">{a.fullName}</span>
                <span className="text-xs text-slate-500">{a.reasons.join(", ")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* 4. Jadwal Mengajar Hari Ini */}
      <Card>
        <SectionHeader step={4} title="Jadwal Mengajar Hari Ini" />
        {data.schedule.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada penugasan.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {data.schedule.map((s, i) => (
              <Badge key={i} tone="info">
                {s.roleInClass}
                {s.subject ? ` · ${s.subject}` : ""}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* Attendance capture */}
      <Card id="absensi">
        <SectionHeader
          title="Isi Absensi"
          description={`Tanggal ${today}. Pilih status tiap siswa, lalu simpan.`}
        />
        <ul className="divide-y divide-slate-100">
          {data.roster.map((s) => {
            const current = attendanceStatus(s.status);
            return (
              <li key={s.studentId} className="py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-700">{s.fullName}</span>
                  {s.status && (
                    <Badge tone={current.tone}>Tersimpan: {current.label}</Badge>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {STATUSES.map((st) => {
                    const sel = draft[s.studentId] === st;
                    const tone = attendanceStatus(st).tone;
                    return (
                      <button
                        key={st}
                        type="button"
                        aria-pressed={sel}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          sel
                            ? SELECTED_BTN[tone]
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                        onClick={() => setDraft((d) => ({ ...d, [s.studentId]: st }))}
                      >
                        {attendanceStatus(st).label}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={saveAttendance} disabled={saving}>
            {saving ? "Menyimpan…" : "Simpan absensi"}
          </Button>
          {Object.keys(draft).length > 0 && (
            <span className="text-xs text-slate-500">
              {Object.keys(draft).length} perubahan belum disimpan
            </span>
          )}
        </div>
        {save && (
          <Notice tone={save.tone} className="mt-3">
            {save.text}
          </Notice>
        )}
      </Card>

      <div id="nilai-catatan" className="scroll-mt-24">
        <TeacherGradesNotes classId={classId} roster={data.roster} />
      </div>
    </section>
  );
}
