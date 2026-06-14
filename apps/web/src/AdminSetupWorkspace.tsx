import { useEffect, useMemo, useState } from "react";
import {
  assignStudentClass,
  assignTeacher,
  bulkStudents,
  createClass,
  createLinkCode,
  createStudent,
  getSettings,
  listClasses,
  listLinkCodes,
  listStudents,
  listTeacherMemberships,
  revokeLinkCode,
  updateSettings,
  type AdminClass,
  type AdminStudent,
  type ApiResult,
  type ParentLinkCode,
  type SchoolSettings,
  type TeacherMembership,
} from "./adminSetupApi";

const NAV = [
  { href: "#setup-overview", label: "Ringkasan" },
  { href: "#setup-classes", label: "Kelas" },
  { href: "#setup-students", label: "Siswa" },
  { href: "#setup-teachers", label: "Penugasan Guru" },
  { href: "#setup-codes", label: "Kode Ortu" },
  { href: "#setup-settings", label: "Pengaturan" },
];

const ERROR_COPY: Record<string, string> = {
  membership_not_teacher: "Akun ini bukan guru/wali kelas, tidak bisa ditugaskan.",
  membership_not_found: "Keanggotaan tidak ditemukan di sekolah ini.",
  class_not_found: "Kelas tidak ditemukan di sekolah ini.",
  student_not_found: "Siswa tidak ditemukan di sekolah ini.",
  invalid_input: "Input tidak valid. Periksa kembali isian.",
  forbidden_role: "Anda tidak memiliki akses untuk tindakan ini.",
};
const friendly = (code: string) => ERROR_COPY[code] ?? `Gagal (${code}).`;

type Notice = { kind: "ok" | "err"; text: string } | null;

/**
 * Admin / Setup workspace. A compact, operational wrapper over the existing
 * tenant-scoped onboarding APIs. Admin-only (gated by AppShell + backend
 * `/admin/*` guards). Never sends `school_id`.
 */
export function AdminSetupWorkspace({
  schoolName,
  schoolCode,
}: {
  schoolName?: string;
  schoolCode?: string;
}) {
  const [classes, setClasses] = useState<AdminClass[] | null>(null);
  const [students, setStudents] = useState<AdminStudent[] | null>(null);
  const [teachers, setTeachers] = useState<TeacherMembership[] | null>(null);
  const [codes, setCodes] = useState<ParentLinkCode[] | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const classNameById = useMemo(() => {
    const m = new Map<string, string>();
    (classes ?? []).forEach((c) => m.set(c.id, c.name));
    return m;
  }, [classes]);

  async function refreshClasses() {
    const r = await listClasses();
    if (r.ok) setClasses(r.data);
  }
  async function refreshStudents() {
    const r = await listStudents();
    if (r.ok) setStudents(r.data);
  }
  async function refreshTeachers() {
    const r = await listTeacherMemberships();
    if (r.ok) setTeachers(r.data);
  }
  async function refreshCodes() {
    const r = await listLinkCodes();
    if (r.ok) setCodes(r.data);
  }
  async function refreshSettings() {
    const r = await getSettings();
    if (r.ok) setSettings(r.data);
  }

  useEffect(() => {
    void refreshClasses();
    void refreshStudents();
    void refreshTeachers();
    void refreshCodes();
    void refreshSettings();
  }, []);

  /** Run a write, surface a notice, and run any refreshers on success. */
  async function run<T>(
    action: () => Promise<ApiResult<T>>,
    okText: string,
    after: () => void = () => {},
  ): Promise<boolean> {
    setNotice(null);
    const r = await action();
    if (r.ok) {
      setNotice({ kind: "ok", text: okText });
      after();
      return true;
    }
    setNotice({ kind: "err", text: friendly(r.error) });
    return false;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-4">
      <nav className="mb-3 flex flex-wrap gap-2">
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

      {notice && (
        <div
          className={`mb-3 rounded-lg px-3 py-2 text-sm ${
            notice.kind === "ok"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* 1. Overview */}
      <section id="setup-overview" className="scroll-mt-20 rounded-xl border bg-white p-4">
        <h2 className="text-base font-semibold text-slate-800">Admin / Setup</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sekolah aktif: <strong>{schoolName ?? "—"}</strong>
          {schoolCode ? ` (${schoolCode})` : ""}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {(classes?.length ?? 0)} kelas · {(students?.length ?? 0)} siswa ·{" "}
          {(codes?.length ?? 0)} kode tautan
        </p>
      </section>

      {/* 2. Classes */}
      <Section id="setup-classes" title="Kelas">
        <List
          empty="Belum ada kelas."
          loading={classes === null}
          rows={(classes ?? []).map((c) => (
            <li key={c.id} className="flex justify-between border-t py-1">
              <span>{c.name}</span>
              <span className="text-xs text-slate-500">
                {[c.gradeLevel, c.academicYear].filter(Boolean).join(" · ") || "—"}
              </span>
            </li>
          ))}
        />
        <ClassForm
          onCreate={(input) =>
            run(() => createClass(input), "Kelas dibuat.", refreshClasses)
          }
        />
      </Section>

      {/* 3. Students */}
      <Section id="setup-students" title="Siswa">
        <List
          empty="Belum ada siswa."
          loading={students === null}
          rows={(students ?? []).map((s) => (
            <li key={s.id} className="flex justify-between border-t py-1">
              <span>{s.fullName}</span>
              <span className="text-xs text-slate-500">
                {s.classId ? (classNameById.get(s.classId) ?? "kelas lain") : "belum ada kelas"}
              </span>
            </li>
          ))}
        />
        <StudentForms
          classes={classes ?? []}
          students={students ?? []}
          onCreate={(input) =>
            run(() => createStudent(input), "Siswa dibuat.", refreshStudents)
          }
          onBulk={(names) =>
            run(() => bulkStudents(names), `${names.length} siswa ditambahkan.`, refreshStudents)
          }
          onAssign={(studentId, classId) =>
            run(
              () => assignStudentClass(studentId, classId),
              "Siswa dipindahkan ke kelas.",
              refreshStudents,
            )
          }
        />
      </Section>

      {/* 4. Teacher assignment */}
      <Section id="setup-teachers" title="Penugasan Guru">
        <p className="text-xs text-slate-500">
          Pilih guru/wali kelas yang sudah punya akun di sekolah ini. Sprint ini
          tidak membuat akun atau peran baru.
        </p>
        <TeacherForm
          classes={classes ?? []}
          teachers={teachers ?? []}
          onAssign={(classId, input) =>
            run(() => assignTeacher(classId, input), "Guru ditugaskan ke kelas.")
          }
        />
      </Section>

      {/* 5. Parent link codes */}
      <Section id="setup-codes" title="Kode Tautan Orang Tua">
        <List
          empty="Belum ada kode."
          loading={codes === null}
          rows={(codes ?? []).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-2 border-t py-1">
              <span>
                <code className="rounded bg-slate-100 px-1">{c.code}</code>{" "}
                <span className="text-xs text-slate-500">
                  [{c.status}] · {students?.find((s) => s.id === c.studentId)?.fullName ?? c.studentId.slice(0, 8)}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded bg-slate-100 px-2 py-0.5 text-xs"
                  onClick={() => void navigator.clipboard?.writeText(c.code)}
                >
                  Salin
                </button>
                {c.status === "active" && (
                  <button
                    type="button"
                    className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-700"
                    onClick={() => {
                      if (confirm(`Cabut kode ${c.code}?`))
                        void run(() => revokeLinkCode(c.id), "Kode dicabut.", refreshCodes);
                    }}
                  >
                    Cabut
                  </button>
                )}
              </span>
            </li>
          ))}
        />
        <CodeForm
          students={students ?? []}
          onGenerate={(studentId) =>
            run(() => createLinkCode(studentId), "Kode dibuat.", refreshCodes)
          }
        />
      </Section>

      {/* 6. School settings */}
      <Section id="setup-settings" title="Pengaturan Sekolah">
        {settings === null ? (
          <p className="text-sm text-slate-500">Memuat…</p>
        ) : (
          <SettingsForm
            settings={settings}
            onSave={(input) =>
              run(() => updateSettings(input), "Pengaturan disimpan.", refreshSettings)
            }
          />
        )}
      </Section>
    </div>
  );
}

// --- Small presentational helpers ------------------------------------------

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 mt-4 rounded-xl border bg-white p-4">
      <h3 className="font-medium text-slate-800">{title}</h3>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

function List({
  rows,
  empty,
  loading,
}: {
  rows: React.ReactNode[];
  empty: string;
  loading: boolean;
}) {
  if (loading) return <p className="text-sm text-slate-500">Memuat…</p>;
  if (rows.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
  return <ul className="text-sm">{rows}</ul>;
}

const input = "rounded border border-slate-300 px-2 py-1 text-sm";
const btn = "rounded bg-slate-800 px-3 py-1 text-sm font-medium text-white hover:bg-slate-700";

function ClassForm({
  onCreate,
}: {
  onCreate: (i: { name: string; gradeLevel?: string; academicYear?: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [gradeLevel, setGrade] = useState("");
  const [academicYear, setYear] = useState("");
  return (
    <div className="flex flex-wrap items-end gap-2">
      <input className={input} placeholder="Nama kelas" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={`${input} w-24`} placeholder="Tingkat" value={gradeLevel} onChange={(e) => setGrade(e.target.value)} />
      <input className={`${input} w-28`} placeholder="Tahun ajaran" value={academicYear} onChange={(e) => setYear(e.target.value)} />
      <button
        type="button"
        className={btn}
        disabled={!name.trim()}
        onClick={async () => {
          const ok = await onCreate({
            name: name.trim(),
            gradeLevel: gradeLevel.trim() || undefined,
            academicYear: academicYear.trim() || undefined,
          });
          if (ok) { setName(""); setGrade(""); setYear(""); }
        }}
      >
        Tambah kelas
      </button>
    </div>
  );
}

function StudentForms({
  classes,
  students,
  onCreate,
  onBulk,
  onAssign,
}: {
  classes: AdminClass[];
  students: AdminStudent[];
  onCreate: (i: { fullName: string; nisn?: string; classId?: string }) => Promise<boolean>;
  onBulk: (names: string[]) => Promise<boolean>;
  onAssign: (studentId: string, classId: string) => Promise<boolean>;
}) {
  const [fullName, setFullName] = useState("");
  const [nisn, setNisn] = useState("");
  const [classId, setClassId] = useState("");
  const [bulk, setBulk] = useState("");
  const [assignStudent, setAssignStudent] = useState("");
  const [assignClass, setAssignClass] = useState("");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <input className={input} placeholder="Nama siswa" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className={`${input} w-28`} placeholder="NISN (opsional)" value={nisn} onChange={(e) => setNisn(e.target.value)} />
        <select className={input} value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Tanpa kelas</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          type="button"
          className={btn}
          disabled={!fullName.trim()}
          onClick={async () => {
            const ok = await onCreate({
              fullName: fullName.trim(),
              nisn: nisn.trim() || undefined,
              classId: classId || undefined,
            });
            if (ok) { setFullName(""); setNisn(""); setClassId(""); }
          }}
        >
          Tambah siswa
        </button>
      </div>

      <div>
        <label className="text-xs text-slate-500">Tambah banyak (satu nama per baris)</label>
        <textarea
          className={`${input} mt-1 w-full`}
          rows={3}
          placeholder={"Adinda Putri\nBagas Pratama"}
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
        />
        <button
          type="button"
          className={`${btn} mt-1`}
          onClick={async () => {
            const names = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
            if (names.length === 0) return;
            const ok = await onBulk(names);
            if (ok) setBulk("");
          }}
        >
          Tambah daftar
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <select className={input} value={assignStudent} onChange={(e) => setAssignStudent(e.target.value)}>
          <option value="">Pilih siswa…</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
        </select>
        <select className={input} value={assignClass} onChange={(e) => setAssignClass(e.target.value)}>
          <option value="">Pilih kelas…</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          type="button"
          className={btn}
          disabled={!assignStudent || !assignClass}
          onClick={() => void onAssign(assignStudent, assignClass)}
        >
          Pindahkan ke kelas
        </button>
      </div>
    </div>
  );
}

function TeacherForm({
  classes,
  teachers,
  onAssign,
}: {
  classes: AdminClass[];
  teachers: TeacherMembership[];
  onAssign: (
    classId: string,
    input: { membershipId: string; roleInClass: "wali_kelas" | "guru"; subject?: string },
  ) => Promise<boolean>;
}) {
  const [classId, setClassId] = useState("");
  const [membershipId, setMembershipId] = useState("");
  const [roleInClass, setRole] = useState<"wali_kelas" | "guru">("wali_kelas");
  const [subject, setSubject] = useState("");

  const eligible = teachers.filter((t) =>
    t.roles.some((r) => r === "guru" || r === "wali_kelas"),
  );

  return (
    <div className="flex flex-wrap items-end gap-2">
      <select className={input} value={classId} onChange={(e) => setClassId(e.target.value)}>
        <option value="">Pilih kelas…</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select className={input} value={membershipId} onChange={(e) => setMembershipId(e.target.value)}>
        <option value="">Pilih guru…</option>
        {eligible.map((t) => (
          <option key={t.membershipId} value={t.membershipId}>
            {t.name} ({t.email})
          </option>
        ))}
      </select>
      <select className={input} value={roleInClass} onChange={(e) => setRole(e.target.value as "wali_kelas" | "guru")}>
        <option value="wali_kelas">Wali kelas</option>
        <option value="guru">Guru</option>
      </select>
      {roleInClass === "guru" && (
        <input className={`${input} w-28`} placeholder="Mapel (opsional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
      )}
      <button
        type="button"
        className={btn}
        disabled={!classId || !membershipId}
        onClick={async () => {
          const ok = await onAssign(classId, {
            membershipId,
            roleInClass,
            subject: roleInClass === "guru" && subject.trim() ? subject.trim() : undefined,
          });
          if (ok) { setMembershipId(""); setSubject(""); }
        }}
      >
        Tugaskan
      </button>
      {eligible.length === 0 && (
        <span className="text-xs text-slate-500">Belum ada akun guru/wali kelas di sekolah ini.</span>
      )}
    </div>
  );
}

function CodeForm({
  students,
  onGenerate,
}: {
  students: AdminStudent[];
  onGenerate: (studentId: string) => Promise<boolean>;
}) {
  const [studentId, setStudentId] = useState("");
  return (
    <div className="flex flex-wrap items-end gap-2">
      <select className={input} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
        <option value="">Pilih siswa…</option>
        {students.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
      </select>
      <button
        type="button"
        className={btn}
        disabled={!studentId}
        onClick={async () => {
          const ok = await onGenerate(studentId);
          if (ok) setStudentId("");
        }}
      >
        Buat kode
      </button>
    </div>
  );
}

function SettingsForm({
  settings,
  onSave,
}: {
  settings: SchoolSettings;
  onSave: (i: { attendanceCutoffTime?: string; schoolTimezone?: string }) => Promise<boolean>;
}) {
  const [cutoff, setCutoff] = useState(settings.attendanceCutoffTime);
  const [tz, setTz] = useState(settings.schoolTimezone);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-sm text-slate-700">
        Cutoff absensi
        <input className={`${input} ml-2`} placeholder="HH:mm" value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
      </label>
      <label className="text-sm text-slate-700">
        Zona waktu
        <input className={`${input} ml-2`} placeholder="Asia/Jakarta" value={tz} onChange={(e) => setTz(e.target.value)} />
      </label>
      <span className="text-xs text-slate-500">
        KKM default: <strong>{settings.defaultKkm}</strong> (atur per nilai; ubah massal belum didukung)
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => void onSave({ attendanceCutoffTime: cutoff.trim(), schoolTimezone: tz.trim() })}
      >
        Simpan
      </button>
    </div>
  );
}
