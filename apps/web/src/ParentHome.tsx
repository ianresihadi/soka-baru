import { useEffect, useState } from "react";

interface Child {
  studentId: string;
  fullName: string;
  schoolName: string;
  className: string | null;
  objectiveStatus: string;
}
interface Home {
  children: Child[];
  selectedChild: Child | null;
  today: {
    date: string;
    attendanceStatus: string | null;
    attendanceNote: string | null;
  } | null;
  reassurance: { headline: string; needsAction: boolean; reasons: string[] } | null;
  latestNotification: { title: string; body: string; readAt: string | null } | null;
}
interface AttRow {
  id: string;
  attendanceDate: string;
  status: string;
  note: string | null;
}
interface Notif {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
}
interface Thread {
  id: string;
  lastMessageAt: string | null;
}
interface Msg {
  id: string;
  senderRole: string;
  body: string;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  hadir: "Hadir",
  sakit: "Sakit",
  izin: "Izin",
  alpa: "Alpa",
  terlambat: "Terlambat",
};

async function getJson<T>(path: string): Promise<T | null> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/**
 * Mobile-first, reassurance-first parent validation UI (Sprint 005).
 * Simple-card summaries, details below. Not a teacher/admin dashboard.
 */
export function ParentHome() {
  const [home, setHome] = useState<Home | null>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [attendance, setAttendance] = useState<AttRow[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [thread, setThread] = useState<{ messages: Msg[] } | null>(null);
  const [reply, setReply] = useState("");
  const [grades, setGrades] = useState<
    { id: string; subject: string; assessmentName: string; score: number; maxScore: number; kkm: number; isBelowKkm: boolean }[]
  >([]);
  const [pubNotes, setPubNotes] = useState<{ id: string; category: string; body: string }[]>([]);

  async function loadHome(sid?: string) {
    const h = await getJson<Home>(`/parent/home${sid ? `?studentId=${sid}` : ""}`);
    setHome(h);
    const child = h?.selectedChild?.studentId;
    if (child) {
      setStudentId(child);
      setAttendance((await getJson<{ records: AttRow[] }>(`/parent/attendance?studentId=${child}`))?.records ?? []);
      setNotifs((await getJson<{ notifications: Notif[] }>(`/parent/notifications?studentId=${child}`))?.notifications ?? []);
      setThreads((await getJson<{ threads: Thread[] }>(`/parent/messages/threads?studentId=${child}`))?.threads ?? []);
      setGrades((await getJson<{ grades: typeof grades }>(`/parent/grades?studentId=${child}`))?.grades ?? []);
      setPubNotes((await getJson<{ notes: typeof pubNotes }>(`/parent/student-notes?studentId=${child}`))?.notes ?? []);
    }
  }

  useEffect(() => {
    void loadHome();
  }, []);

  async function markNotifRead(notificationId: string) {
    await fetch("/parent/notifications/read", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ notificationIds: [notificationId] }),
    });
    void loadHome(studentId);
  }

  async function openThread(threadId: string) {
    setThread(await getJson(`/parent/messages/threads/${threadId}`));
  }

  async function sendMessage() {
    if (!reply.trim() || !studentId) return;
    await fetch("/parent/messages", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId, body: reply }),
    });
    setReply("");
    void loadHome(studentId);
  }

  if (!home) {
    return <p className="mt-4 text-sm text-gray-500">Sign in as orang tua to load Beranda Anak.</p>;
  }

  if (!home.selectedChild) {
    return (
      <div className="mx-auto mt-6 max-w-md rounded-xl border bg-amber-50 p-4 text-center">
        <p className="font-medium">Belum ada anak tertaut.</p>
        <p className="mt-1 text-sm text-gray-600">
          Minta kode tautan dari sekolah untuk menghubungkan akun Anda dengan anak Anda.
        </p>
      </div>
    );
  }

  const child = home.selectedChild;
  return (
    <div className="mx-auto mt-6 max-w-md space-y-4">
      {/* Child switcher */}
      {home.children.length > 1 && (
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={studentId}
          onChange={(e) => loadHome(e.target.value)}
        >
          {home.children.map((c) => (
            <option key={c.studentId} value={c.studentId}>
              {c.fullName} — {c.schoolName}
            </option>
          ))}
        </select>
      )}

      {/* Beranda Anak summary */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">
          {child.fullName} · {child.className ?? "-"} · {child.schoolName}
        </p>
        <p className="mt-2 text-lg font-semibold">{home.reassurance?.headline}</p>
        {home.reassurance?.needsAction && (
          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
            Perlu perhatian
          </span>
        )}
      </div>

      {/* Notifications */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="text-sm font-semibold">Notifikasi</h3>
        {notifs.length === 0 ? (
          <p className="text-sm text-gray-500">Tidak ada notifikasi.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {notifs.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-2 text-sm">
                <span className={n.readAt ? "text-gray-500" : "font-medium"}>
                  {n.title}: {n.body}
                </span>
                {!n.readAt && (
                  <button
                    type="button"
                    className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs"
                    onClick={() => markNotifRead(n.id)}
                  >
                    Tandai dibaca
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Attendance history */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="text-sm font-semibold">Riwayat Absensi</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {attendance.map((a) => (
            <li key={a.id} className="flex justify-between">
              <span>{a.attendanceDate}</span>
              <span>{STATUS_LABEL[a.status] ?? a.status}</span>
            </li>
          ))}
          {attendance.length === 0 && (
            <li className="text-gray-500">Belum ada catatan absensi.</li>
          )}
        </ul>
      </div>

      {/* Nilai (published only) */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="text-sm font-semibold">Nilai</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {grades.map((gr) => (
            <li key={gr.id} className="flex justify-between">
              <span>{gr.subject} — {gr.assessmentName}</span>
              <span className={gr.isBelowKkm ? "text-red-600" : "text-green-700"}>
                {gr.score}/{gr.maxScore} {gr.isBelowKkm ? "(di bawah KKM)" : "(memenuhi KKM)"}
              </span>
            </li>
          ))}
          {grades.length === 0 && <li className="text-gray-500">Belum ada nilai dipublikasikan.</li>}
        </ul>
      </div>

      {/* Catatan (published only) */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="text-sm font-semibold">Catatan dari Guru</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {pubNotes.map((nt) => (
            <li key={nt.id}>
              <span className="text-xs text-gray-500">[{nt.category}]</span> {nt.body}
            </li>
          ))}
          {pubNotes.length === 0 && <li className="text-gray-500">Belum ada catatan dibagikan.</li>}
        </ul>
      </div>

      {/* Messages */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="text-sm font-semibold">Pesan Guru</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {threads.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="text-blue-600 underline"
                onClick={() => openThread(t.id)}
              >
                Lihat percakapan
              </button>
            </li>
          ))}
        </ul>
        {thread && (
          <div className="mt-2 max-h-40 space-y-1 overflow-auto rounded bg-gray-50 p-2 text-sm">
            {thread.messages.map((m) => (
              <div key={m.id}>
                <span className="text-xs text-gray-500">{m.senderRole}:</span> {m.body}
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 rounded border px-2 py-1 text-sm"
            placeholder="Tulis pesan untuk guru…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <button
            type="button"
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
            onClick={sendMessage}
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
