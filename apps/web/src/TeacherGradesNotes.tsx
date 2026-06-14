import { useEffect, useState } from "react";

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

/** Teacher-side Nilai & Catatan validation UI (Sprint 006). Dense-but-calm. */
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

  return (
    <div className="mt-4 grid gap-4">
      {/* Grades */}
      <div className="rounded border p-3">
        <h3 className="font-medium">Nilai (terhadap KKM)</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {grades.map((gr) => (
            <li key={gr.id} className="flex items-center justify-between gap-2">
              <span>
                {gr.subject} — {gr.assessmentName}: {gr.score}/{gr.maxScore}{" "}
                <span className={gr.isBelowKkm ? "text-red-600" : "text-green-700"}>
                  ({gr.isBelowKkm ? "di bawah" : "memenuhi"} KKM {gr.kkm})
                </span>{" "}
                <span className="text-xs text-gray-500">[{gr.visibilityStatus}]</span>
              </span>
              {gr.visibilityStatus === "draft" && (
                <button
                  type="button"
                  className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white"
                  onClick={async () => { await post(`/guru/grades/${gr.id}/publish`); void refresh(); }}
                >
                  Publish
                </button>
              )}
            </li>
          ))}
          {grades.length === 0 && <li className="text-gray-500">Belum ada nilai.</li>}
        </ul>
        <div className="mt-2 flex flex-wrap gap-1 text-sm">
          <select className="rounded border px-1 py-0.5" value={g.studentId} onChange={(e) => setG({ ...g, studentId: e.target.value })}>
            <option value="">Siswa…</option>
            {roster.map((r) => <option key={r.studentId} value={r.studentId}>{r.fullName}</option>)}
          </select>
          <input className="w-24 rounded border px-1 py-0.5" placeholder="Mapel" value={g.subject} onChange={(e) => setG({ ...g, subject: e.target.value })} />
          <input className="w-24 rounded border px-1 py-0.5" placeholder="Penilaian" value={g.assessmentName} onChange={(e) => setG({ ...g, assessmentName: e.target.value })} />
          <input className="w-14 rounded border px-1 py-0.5" placeholder="Nilai" value={g.score} onChange={(e) => setG({ ...g, score: e.target.value })} />
          <input className="w-14 rounded border px-1 py-0.5" placeholder="Maks" value={g.maxScore} onChange={(e) => setG({ ...g, maxScore: e.target.value })} />
          <input className="w-14 rounded border px-1 py-0.5" placeholder="KKM" value={g.kkm} onChange={(e) => setG({ ...g, kkm: e.target.value })} />
          <button type="button" className="rounded bg-gray-700 px-2 py-0.5 text-white" onClick={createGrade}>Tambah</button>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded border p-3">
        <h3 className="font-medium">Catatan Siswa</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {notes.map((nt) => (
            <li key={nt.id} className="flex items-center justify-between gap-2">
              <span>
                [{nt.category}] {nt.body}{" "}
                <span className="text-xs text-gray-500">
                  ({nt.visibilityStatus === "published" ? "Dibagikan" : "Internal"})
                </span>
              </span>
              <button
                type="button"
                className="rounded bg-gray-200 px-2 py-0.5 text-xs"
                onClick={async () => {
                  const action = nt.visibilityStatus === "published" ? "unpublish" : "publish";
                  await post(`/guru/student-notes/${nt.id}/${action}`);
                  void refresh();
                }}
              >
                {nt.visibilityStatus === "published" ? "Tarik" : "Bagikan"}
              </button>
            </li>
          ))}
          {notes.length === 0 && <li className="text-gray-500">Belum ada catatan.</li>}
        </ul>
        <div className="mt-2 flex flex-wrap gap-1 text-sm">
          <select className="rounded border px-1 py-0.5" value={n.studentId} onChange={(e) => setN({ ...n, studentId: e.target.value })}>
            <option value="">Siswa…</option>
            {roster.map((r) => <option key={r.studentId} value={r.studentId}>{r.fullName}</option>)}
          </select>
          <select className="rounded border px-1 py-0.5" value={n.category} onChange={(e) => setN({ ...n, category: e.target.value })}>
            {["general", "academic", "attendance", "wellbeing"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="flex-1 rounded border px-1 py-0.5" placeholder="Catatan…" value={n.body} onChange={(e) => setN({ ...n, body: e.target.value })} />
          <button type="button" className="rounded bg-gray-700 px-2 py-0.5 text-white" onClick={createNote}>Tambah</button>
        </div>
      </div>
    </div>
  );
}
