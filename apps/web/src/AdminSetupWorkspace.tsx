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
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Loading,
  NavChips,
  Notice,
  SectionHeader,
  Select,
} from "./components/ui";
import { linkCodeStatus, type Tone } from "./components/status";

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

type Notice = { tone: Tone; text: string } | null;

/**
 * Admin / Setup workspace. A compact, guided wrapper over the existing
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
      setNotice({ tone: "success", text: okText });
      after();
      return true;
    }
    setNotice({ tone: "danger", text: friendly(r.error) });
    return false;
  }

  const classCount = classes?.length ?? 0;
  const studentCount = students?.length ?? 0;
  const codeCount = codes?.length ?? 0;
  const anyAssigned = (students ?? []).some((s) => s.classId);

  const checklist = [
    { label: "Buat kelas", done: classCount > 0 },
    { label: "Tambah siswa", done: studentCount > 0 },
    { label: "Tempatkan siswa di kelas", done: anyAssigned },
    { label: "Buat kode tautan orang tua", done: codeCount > 0 },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-4">
      <div className="sticky top-[3.25rem] z-[5] -mx-4 mb-3 border-b border-slate-100 bg-stone-50/95 px-4 py-2 backdrop-blur sm:top-[3.5rem]">
        <NavChips items={NAV} />
      </div>

      {notice && (
        <Notice tone={notice.tone} className="mb-3">
          {notice.text}
        </Notice>
      )}

      <div className="space-y-4">
        {/* 1. Overview */}
        <Card id="setup-overview">
          <SectionHeader
            title="Admin / Setup"
            description={`Sekolah aktif: ${schoolName ?? "—"}${schoolCode ? ` (${schoolCode})` : ""}`}
          />
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Kelas" value={classCount} />
            <Stat label="Siswa" value={studentCount} />
            <Stat label="Kode tautan" value={codeCount} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {checklist.map((c) => (
              <Badge key={c.label} tone={c.done ? "success" : "neutral"}>
                {c.done ? "✓" : "○"} {c.label}
              </Badge>
            ))}
          </div>
        </Card>

        {/* 2. Classes */}
        <Card id="setup-classes">
          <SectionHeader title="Kelas" />
          <List
            loading={classes === null}
            empty="Belum ada kelas."
            rows={(classes ?? []).map((c) => (
              <li key={c.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm font-medium text-slate-700">{c.name}</span>
                <span className="text-xs text-slate-500">
                  {[c.gradeLevel, c.academicYear].filter(Boolean).join(" · ") || "—"}
                </span>
              </li>
            ))}
          />
          <ClassForm onCreate={(input) => run(() => createClass(input), "Kelas dibuat.", refreshClasses)} />
        </Card>

        {/* 3. Students */}
        <Card id="setup-students">
          <SectionHeader title="Siswa" />
          <List
            loading={students === null}
            empty="Belum ada siswa."
            rows={(students ?? []).map((s) => (
              <li key={s.id} className="flex items-center justify-between py-1.5">
                <span className="text-sm font-medium text-slate-700">{s.fullName}</span>
                {s.classId ? (
                  <Badge tone="brand">{classNameById.get(s.classId) ?? "kelas lain"}</Badge>
                ) : (
                  <Badge tone="neutral">belum ada kelas</Badge>
                )}
              </li>
            ))}
          />
          <StudentForms
            classes={classes ?? []}
            students={students ?? []}
            onCreate={(input) => run(() => createStudent(input), "Siswa dibuat.", refreshStudents)}
            onBulk={(names) =>
              run(() => bulkStudents(names), `${names.length} siswa ditambahkan.`, refreshStudents)
            }
            onAssign={(studentId, classId) =>
              run(() => assignStudentClass(studentId, classId), "Siswa dipindahkan ke kelas.", refreshStudents)
            }
          />
        </Card>

        {/* 4. Teacher assignment */}
        <Card id="setup-teachers">
          <SectionHeader
            title="Penugasan Guru"
            description="Pilih guru/wali kelas yang sudah punya akun di sekolah ini. Setup ini tidak membuat akun atau peran baru."
          />
          <TeacherForm
            classes={classes ?? []}
            teachers={teachers ?? []}
            onAssign={(classId, input) => run(() => assignTeacher(classId, input), "Guru ditugaskan ke kelas.")}
          />
        </Card>

        {/* 5. Parent link codes */}
        <Card id="setup-codes">
          <SectionHeader title="Kode Tautan Orang Tua" description="Hanya kode terbitan sekolah; tidak ada klaim bebas." />
          <List
            loading={codes === null}
            empty="Belum ada kode."
            rows={(codes ?? []).map((c) => {
              const st = linkCodeStatus(c.status);
              return (
                <li key={c.id} className="flex items-center justify-between gap-2 py-1.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-800">
                      {c.code}
                    </code>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <span className="truncate text-xs text-slate-500">
                      {students?.find((s) => s.id === c.studentId)?.fullName ?? c.studentId.slice(0, 8)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => void navigator.clipboard?.writeText(c.code)}>
                      Salin
                    </Button>
                    {c.status === "active" && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Cabut kode ${c.code}?`))
                            void run(() => revokeLinkCode(c.id), "Kode dicabut.", refreshCodes);
                        }}
                      >
                        Cabut
                      </Button>
                    )}
                  </span>
                </li>
              );
            })}
          />
          <CodeForm
            students={students ?? []}
            onGenerate={(studentId) => run(() => createLinkCode(studentId), "Kode dibuat.", refreshCodes)}
          />
        </Card>

        {/* 6. School settings */}
        <Card id="setup-settings">
          <SectionHeader title="Pengaturan Sekolah" />
          {settings === null ? (
            <Loading />
          ) : (
            <SettingsForm
              settings={settings}
              onSave={(input) => run(() => updateSettings(input), "Pengaturan disimpan.", refreshSettings)}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

// --- Small presentational helpers ------------------------------------------

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
      <p className="text-xl font-semibold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
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
  if (loading) return <Loading />;
  if (rows.length === 0) return <EmptyState title={empty} />;
  return <ul className="mb-3 divide-y divide-slate-100">{rows}</ul>;
}

function ClassForm({
  onCreate,
}: {
  onCreate: (i: { name: string; gradeLevel?: string; academicYear?: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [gradeLevel, setGrade] = useState("");
  const [academicYear, setYear] = useState("");
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Input className="col-span-2 sm:col-span-1" placeholder="Nama kelas" value={name} onChange={(e) => setName(e.target.value)} />
      <Input placeholder="Tingkat" value={gradeLevel} onChange={(e) => setGrade(e.target.value)} />
      <Input placeholder="Tahun ajaran" value={academicYear} onChange={(e) => setYear(e.target.value)} />
      <Button
        disabled={!name.trim()}
        onClick={async () => {
          const ok = await onCreate({
            name: name.trim(),
            gradeLevel: gradeLevel.trim() || undefined,
            academicYear: academicYear.trim() || undefined,
          });
          if (ok) {
            setName("");
            setGrade("");
            setYear("");
          }
        }}
      >
        Tambah kelas
      </Button>
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Input className="col-span-2 sm:col-span-1" placeholder="Nama siswa" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input placeholder="NISN (opsional)" value={nisn} onChange={(e) => setNisn(e.target.value)} />
        <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
          <option value="">Tanpa kelas</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Button
          disabled={!fullName.trim()}
          onClick={async () => {
            const ok = await onCreate({
              fullName: fullName.trim(),
              nisn: nisn.trim() || undefined,
              classId: classId || undefined,
            });
            if (ok) {
              setFullName("");
              setNisn("");
              setClassId("");
            }
          }}
        >
          Tambah siswa
        </Button>
      </div>

      <Field label="Tambah banyak (satu nama per baris)">
        <textarea
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400"
          rows={3}
          placeholder={"Adinda Putri\nBagas Pratama"}
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
        />
      </Field>
      <Button
        variant="secondary"
        onClick={async () => {
          const names = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
          if (names.length === 0) return;
          const ok = await onBulk(names);
          if (ok) setBulk("");
        }}
      >
        Tambah daftar
      </Button>

      <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-3">
        <Select value={assignStudent} onChange={(e) => setAssignStudent(e.target.value)}>
          <option value="">Pilih siswa…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.fullName}</option>
          ))}
        </Select>
        <Select value={assignClass} onChange={(e) => setAssignClass(e.target.value)}>
          <option value="">Pilih kelas…</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Button
          variant="secondary"
          disabled={!assignStudent || !assignClass}
          onClick={() => void onAssign(assignStudent, assignClass)}
        >
          Pindahkan ke kelas
        </Button>
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

  const eligible = teachers.filter((t) => t.roles.some((r) => r === "guru" || r === "wali_kelas"));

  if (eligible.length === 0) {
    return <EmptyState title="Belum ada akun guru/wali kelas di sekolah ini." />;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Select value={classId} onChange={(e) => setClassId(e.target.value)}>
        <option value="">Pilih kelas…</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </Select>
      <Select value={membershipId} onChange={(e) => setMembershipId(e.target.value)}>
        <option value="">Pilih guru…</option>
        {eligible.map((t) => (
          <option key={t.membershipId} value={t.membershipId}>
            {t.name} ({t.email})
          </option>
        ))}
      </Select>
      <Select value={roleInClass} onChange={(e) => setRole(e.target.value as "wali_kelas" | "guru")}>
        <option value="wali_kelas">Wali kelas</option>
        <option value="guru">Guru</option>
      </Select>
      {roleInClass === "guru" ? (
        <Input placeholder="Mapel (opsional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
      ) : (
        <span className="hidden sm:block" />
      )}
      <Button
        className="sm:col-span-2"
        disabled={!classId || !membershipId}
        onClick={async () => {
          const ok = await onAssign(classId, {
            membershipId,
            roleInClass,
            subject: roleInClass === "guru" && subject.trim() ? subject.trim() : undefined,
          });
          if (ok) {
            setMembershipId("");
            setSubject("");
          }
        }}
      >
        Tugaskan
      </Button>
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
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
        <option value="">Pilih siswa…</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>{s.fullName}</option>
        ))}
      </Select>
      <Button
        disabled={!studentId}
        onClick={async () => {
          const ok = await onGenerate(studentId);
          if (ok) setStudentId("");
        }}
      >
        Buat kode
      </Button>
    </div>
  );
}

function SettingsForm({
  settings,
  onSave,
}: {
  settings: SchoolSettings;
  onSave: (i: {
    attendanceCutoffTime?: string;
    schoolTimezone?: string;
    defaultKkm?: number;
  }) => Promise<boolean>;
}) {
  const [cutoff, setCutoff] = useState(settings.attendanceCutoffTime);
  const [tz, setTz] = useState(settings.schoolTimezone);
  const [kkm, setKkm] = useState(String(settings.defaultKkm));
  const [localError, setLocalError] = useState<string | null>(null);

  function save() {
    setLocalError(null);
    const kkmNum = Number(kkm);
    if (!Number.isInteger(kkmNum) || kkmNum < 0 || kkmNum > 100) {
      setLocalError("KKM default harus bilangan bulat 0–100.");
      return;
    }
    void onSave({ attendanceCutoffTime: cutoff.trim(), schoolTimezone: tz.trim(), defaultKkm: kkmNum });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Cutoff absensi" hint="Format HH:mm">
          <Input placeholder="07:30" value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
        </Field>
        <Field label="Zona waktu">
          <Input placeholder="Asia/Jakarta" value={tz} onChange={(e) => setTz(e.target.value)} />
        </Field>
        <Field label="KKM default" hint="0–100" error={localError ?? undefined}>
          <Input type="number" min={0} max={100} value={kkm} onChange={(e) => setKkm(e.target.value)} />
        </Field>
      </div>
      <p className="text-xs text-slate-500">
        KKM default dipakai saat sebuah nilai tidak menyetel KKM-nya sendiri.
      </p>
      <Button onClick={save}>Simpan pengaturan</Button>
    </div>
  );
}
