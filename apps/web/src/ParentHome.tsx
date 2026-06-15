import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Loading,
  NavChips,
  Select,
  SectionHeader,
} from "./components/ui";
import { attendanceStatus, kkmView } from "./components/status";

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

async function getJson<T>(path: string): Promise<T | null> {
  const res = await fetch(path, { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

const NAV = [
  { href: "#beranda", label: "Beranda" },
  { href: "#absensi-ortu", label: "Absensi" },
  { href: "#nilai-ortu", label: "Nilai" },
  { href: "#catatan-ortu", label: "Catatan" },
  { href: "#pesan-guru", label: "Pesan" },
  { href: "#notifikasi", label: "Notifikasi" },
];

/**
 * Mobile-first, reassurance-first parent home. Simple-card summaries, details
 * below. Only published grades and published notes ever appear here.
 */
export function ParentHome() {
  const [home, setHome] = useState<Home | null>(null);
  const [loading, setLoading] = useState(true);
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
    setLoading(false);
    const child = h?.selectedChild?.studentId;
    if (child) {
      setStudentId(child);
      setAttendance((await getJson<{ records: AttRow[] }>(`/parent/attendance?studentId=${child}`))?.records ?? []);
      setNotifs((await getJson<{ notifications: Notif[] }>(`/parent/notifications?studentId=${child}`))?.notifications ?? []);
      setThreads((await getJson<{ threads: Thread[] }>(`/parent/messages/threads?studentId=${child}`))?.threads ?? []);
      setGrades((await getJson<{ grades: typeof grades }>(`/parent/grades?studentId=${child}`))?.grades ?? []);
      setPubNotes((await getJson<{ notes: typeof pubNotes }>(`/parent/student-notes?studentId=${child}`))?.notes ?? []);
      setThread(null);
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

  if (loading) {
    return (
      <div className="mx-auto mt-6 max-w-md">
        <Loading label="Memuat Beranda Anak…" />
      </div>
    );
  }

  if (!home || !home.selectedChild) {
    return (
      <div className="mx-auto mt-6 max-w-md">
        <EmptyState
          tone="warning"
          title="Belum ada anak tertaut"
          description="Minta kode tautan dari sekolah untuk menghubungkan akun Anda dengan anak Anda."
        />
      </div>
    );
  }

  const child = home.selectedChild;
  const needsAction = home.reassurance?.needsAction ?? false;
  const todayStatus = attendanceStatus(home.today?.attendanceStatus);
  const unread = notifs.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto mt-2 max-w-md space-y-3">
      {/* Child switcher */}
      {home.children.length > 1 && (
        <Select value={studentId} onChange={(e) => loadHome(e.target.value)} aria-label="Pilih anak">
          {home.children.map((c) => (
            <option key={c.studentId} value={c.studentId}>
              {c.fullName} — {c.schoolName}
            </option>
          ))}
        </Select>
      )}

      <NavChips items={NAV} />

      {/* Beranda Anak reassurance summary */}
      <section
        id="beranda"
        className={`scroll-mt-24 rounded-xl2 border p-4 shadow-card ${
          needsAction ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"
        }`}
      >
        <p className="text-xs text-slate-500">
          {child.fullName} · {child.className ?? "-"} · {child.schoolName}
        </p>
        <p className="mt-1.5 text-lg font-semibold text-slate-800">
          {home.reassurance?.headline}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone={todayStatus.tone}>Hari ini: {todayStatus.label}</Badge>
          {needsAction ? (
            <Badge tone="warning">Perlu perhatian</Badge>
          ) : (
            <Badge tone="success">Aman</Badge>
          )}
          {unread > 0 && <Badge tone="info">{unread} notifikasi baru</Badge>}
        </div>
        {needsAction && home.reassurance?.reasons?.length ? (
          <p className="mt-2 text-sm text-amber-800">{home.reassurance.reasons.join(" · ")}</p>
        ) : null}
      </section>

      {/* Notifications */}
      <Card id="notifikasi">
        <SectionHeader
          title="Notifikasi"
          right={unread > 0 ? <Badge tone="info">{unread} baru</Badge> : undefined}
        />
        {notifs.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada notifikasi.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifs.map((n) => (
              <li key={n.id} className="flex items-start justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className={`text-sm ${n.readAt ? "text-slate-500" : "font-medium text-slate-800"}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500">{n.body}</p>
                </div>
                {!n.readAt && (
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => markNotifRead(n.id)}>
                    Tandai dibaca
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Attendance history */}
      <Card id="absensi-ortu">
        <SectionHeader title="Riwayat Absensi" />
        {attendance.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada catatan absensi.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {attendance.map((a) => {
              const st = attendanceStatus(a.status);
              return (
                <li key={a.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-slate-600">{a.attendanceDate}</span>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Nilai (published only) */}
      <Card id="nilai-ortu">
        <SectionHeader title="Nilai" />
        {grades.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada nilai dibagikan.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {grades.map((gr) => {
              const kkm = kkmView(gr.isBelowKkm);
              return (
                <li key={gr.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                  <span className="min-w-0 truncate text-slate-700">
                    {gr.subject} — {gr.assessmentName}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="font-medium text-slate-700">
                      {gr.score}/{gr.maxScore}
                    </span>
                    <Badge tone={kkm.tone}>{kkm.label}</Badge>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Catatan (published only) */}
      <Card id="catatan-ortu">
        <SectionHeader title="Catatan dari Guru" />
        {pubNotes.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada catatan dibagikan.</p>
        ) : (
          <ul className="space-y-2">
            {pubNotes.map((nt) => (
              <li key={nt.id} className="text-sm text-slate-700">
                <Badge tone="neutral">{nt.category}</Badge> <span className="align-middle">{nt.body}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Messages */}
      <Card id="pesan-guru">
        <SectionHeader title="Pesan Guru" />
        {threads.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {threads.map((t) => (
              <Button key={t.id} variant="secondary" size="sm" onClick={() => openThread(t.id)}>
                Lihat percakapan
              </Button>
            ))}
          </div>
        )}
        {thread && (
          <div className="mb-2 max-h-48 space-y-2 overflow-auto rounded-lg bg-slate-50 p-2.5">
            {thread.messages.map((m) => {
              const fromParent = m.senderRole === "orang_tua";
              return (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-sm ${
                    fromParent ? "ml-auto bg-brand-600 text-white" : "bg-white text-slate-700 shadow-card"
                  }`}
                >
                  {m.body}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Tulis pesan untuk guru…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
          />
          <Button onClick={sendMessage} disabled={!reply.trim()}>
            Kirim
          </Button>
        </div>
      </Card>
    </div>
  );
}
