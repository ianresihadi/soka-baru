import { useEffect, useState } from "react";
import { Badge, Button, Card, Input, Select, SectionHeader } from "./components/ui";
import { gradeVisibility, kkmView, noteVisibility } from "./components/status";

interface RosterChild {
  studentId: string;
  fullName: string;
}
interface Grade {
  id: string;
  studentId: string;
  subject: string;
  assessmentName: string;
  score: number;
  maxScore: number;
  kkm: number;
  isBelowKkm: boolean;
  visibilityStatus: string;
}
interface Note {
  id: string;
  studentId: string;
  category: string;
  body: string;
  visibilityStatus: string;
}

const NOTE_CATEGORIES = ["general", "academic", "attendance", "wellbeing"];

async function getJson<T>(path: string): Promise<T | null> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}
async function post(path: string, body?: unknown) {
  return fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Teacher-side Nilai & Catatan. Visually subordinate to the morning loop:
 * weekly/seasonal work, not a daily obligation. Grades start as draft and notes
 * as internal; only an explicit publish/share exposes them to parents.
 */
export function TeacherGradesNotes({
  classId,
  roster,
}: {
  classId: string;
  roster: RosterChild[];
}) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [g, setG] = useState({ studentId: "", subject: "", assessmentName: "", score: "", maxScore: "100", kkm: "" });
  const [n, setN] = useState({ studentId: "", category: "general", body: "" });
  const today = new Date().toISOString().slice(0, 10);

  const nameOf = (id: string) => roster.find((r) => r.studentId === id)?.fullName ?? "—";

  async function refresh() {
    setGrades((await getJson<{ grades: Grade[] }>(`/guru/classes/${classId}/grades`))?.grades ?? []);
    setNotes((await getJson<{ notes: Note[] }>(`/guru/classes/${classId}/student-notes`))?.notes ?? []);
  }
  useEffect(() => {
    if (classId) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function createGrade() {
    if (!g.studentId || !g.subject || !g.assessmentName || !g.score) return;
    await post(`/guru/classes/${classId}/grades`, {
      studentId: g.studentId,
      subject: g.subject,
      assessmentName: g.assessmentName,
      assessmentDate: today,
      score: Number(g.score),
      maxScore: Number(g.maxScore) || 100,
      ...(g.kkm ? { kkm: Number(g.kkm) } : {}),
    });
    setG({ studentId: "", subject: "", assessmentName: "", score: "", maxScore: "100", kkm: "" });
    void refresh();
  }
  async function createNote() {
    if (!n.studentId || !n.body) return;
    await post(`/guru/classes/${classId}/student-notes`, n);
    setN({ studentId: "", category: "general", body: "" });
    void refresh();
  }

  const inputSm = "px-2 py-1 text-sm";

  return (
    <div className="grid gap-4">
      {/* Grades */}
      <Card>
        <SectionHeader
          title="Nilai (terhadap KKM)"
          description="Mingguan / per penilaian — bukan tugas harian. Nilai draf belum terlihat orang tua."
        />
        <ul className="divide-y divide-slate-100">
          {grades.map((gr) => {
            const vis = gradeVisibility(gr.visibilityStatus);
            const kkm = kkmView(gr.isBelowKkm);
            return (
              <li key={gr.id} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-700">
                    <span className="font-medium">{nameOf(gr.studentId)}</span> · {gr.subject} —{" "}
                    {gr.assessmentName}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {gr.score}/{gr.maxScore}
                    </span>
                    <Badge tone={kkm.tone}>{kkm.label} {gr.kkm}</Badge>
                    <Badge tone={vis.tone}>{vis.label}</Badge>
                  </p>
                </div>
                {gr.visibilityStatus === "draft" && (
                  <Button
                    size="sm"
                    onClick={async () => {
                      await post(`/guru/grades/${gr.id}/publish`);
                      void refresh();
                    }}
                  >
                    Publikasikan
                  </Button>
                )}
              </li>
            );
          })}
          {grades.length === 0 && (
            <li className="py-2 text-sm text-slate-400">Belum ada nilai.</li>
          )}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Select className={`col-span-2 sm:col-span-1 ${inputSm}`} value={g.studentId} onChange={(e) => setG({ ...g, studentId: e.target.value })}>
            <option value="">Pilih siswa…</option>
            {roster.map((r) => <option key={r.studentId} value={r.studentId}>{r.fullName}</option>)}
          </Select>
          <Input className={inputSm} placeholder="Mapel" value={g.subject} onChange={(e) => setG({ ...g, subject: e.target.value })} />
          <Input className={inputSm} placeholder="Penilaian" value={g.assessmentName} onChange={(e) => setG({ ...g, assessmentName: e.target.value })} />
          <Input className={inputSm} placeholder="Nilai" value={g.score} onChange={(e) => setG({ ...g, score: e.target.value })} />
          <Input className={inputSm} placeholder="Maks" value={g.maxScore} onChange={(e) => setG({ ...g, maxScore: e.target.value })} />
          <Input className={inputSm} placeholder="KKM (ops.)" value={g.kkm} onChange={(e) => setG({ ...g, kkm: e.target.value })} />
        </div>
        <Button variant="secondary" size="sm" className="mt-2" onClick={createGrade}>
          Tambah nilai
        </Button>
      </Card>

      {/* Notes */}
      <Card>
        <SectionHeader
          title="Catatan Siswa"
          description="Kualitatif, tanpa skor. Catatan internal tidak terlihat orang tua sampai dibagikan."
        />
        <ul className="divide-y divide-slate-100">
          {notes.map((nt) => {
            const vis = noteVisibility(nt.visibilityStatus);
            const published = nt.visibilityStatus === "published";
            return (
              <li key={nt.id} className="flex items-start justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{nameOf(nt.studentId)}</span> {nt.body}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral">{nt.category}</Badge>
                    <Badge tone={vis.tone}>{vis.label}</Badge>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={published ? "danger" : "secondary"}
                  onClick={async () => {
                    await post(`/guru/student-notes/${nt.id}/${published ? "unpublish" : "publish"}`);
                    void refresh();
                  }}
                >
                  {published ? "Tarik" : "Bagikan"}
                </Button>
              </li>
            );
          })}
          {notes.length === 0 && (
            <li className="py-2 text-sm text-slate-400">Belum ada catatan.</li>
          )}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Select className={inputSm} value={n.studentId} onChange={(e) => setN({ ...n, studentId: e.target.value })}>
            <option value="">Pilih siswa…</option>
            {roster.map((r) => <option key={r.studentId} value={r.studentId}>{r.fullName}</option>)}
          </Select>
          <Select className={inputSm} value={n.category} onChange={(e) => setN({ ...n, category: e.target.value })}>
            {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input className={`col-span-2 ${inputSm}`} placeholder="Tulis catatan…" value={n.body} onChange={(e) => setN({ ...n, body: e.target.value })} />
        </div>
        <Button variant="secondary" size="sm" className="mt-2" onClick={createNote}>
          Tambah catatan
        </Button>
      </Card>
    </div>
  );
}
