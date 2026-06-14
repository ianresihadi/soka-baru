import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Better Auth tables
//
// Property keys match Better Auth's expected model field names; the underlying
// column names are snake_case. The Better Auth Drizzle adapter is pointed at
// these tables in packages/auth.
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// SOKA foundation tables (tenant / membership / roles)
// ---------------------------------------------------------------------------

/** Tenant boundary. Every school-owned table scopes by schools.id. */
export const schools = pgTable("schools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  schoolCode: text("school_code").notNull().unique(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Connects a user (login identity) to a school. */
export const schoolMemberships = pgTable(
  "school_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    // Prevent duplicate memberships for the same user in the same school.
    uniqUserSchool: uniqueIndex("uniq_user_school").on(t.schoolId, t.userId),
  }),
);

/** One or more roles per membership (a user may hold multiple roles). */
export const membershipRoles = pgTable(
  "membership_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => schoolMemberships.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqMembershipRole: uniqueIndex("uniq_membership_role").on(
      t.membershipId,
      t.role,
    ),
  }),
);

// ---------------------------------------------------------------------------
// Sprint 003 — Admin onboarding tables (all school-owned / tenant-scoped)
// ---------------------------------------------------------------------------

/** Homeroom/class grouping. */
export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  gradeLevel: text("grade_level"),
  academicYear: text("academic_year"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Student/child record. A student belongs to at most one homeroom (class_id). */
export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  nisn: text("nisn"),
  classId: uuid("class_id").references(() => classes.id, {
    onDelete: "set null",
  }),
  status: text("status").notNull().default("active"),
  // Objective status for Papan Pagi (aman | perhatian | kritis). Separate from
  // the lifecycle `status` field; computed from attendance/grades in a later
  // sprint. Sprint 004 only stores/reads it.
  objectiveStatus: text("objective_status").notNull().default("aman"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Connects a teacher membership to a class as wali_kelas or guru. */
export const teacherAssignments = pgTable(
  "teacher_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => schoolMemberships.id, { onDelete: "cascade" }),
    roleInClass: text("role_in_class").notNull(), // wali_kelas | guru
    subject: text("subject"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqClassMemberRole: uniqueIndex("uniq_class_member_role").on(
      t.classId,
      t.membershipId,
      t.roleInClass,
    ),
  }),
);

/** School-issued, single-use code that links a parent to one student. */
export const parentLinkCodes = pgTable("parent_link_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  status: text("status").notNull().default("active"), // active | used | revoked
  expiresAt: timestamp("expires_at").notNull(),
  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id),
  redeemedByUserId: text("redeemed_by_user_id").references(() => user.id),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Connects a parent membership to a student. */
export const parentStudentLinks = pgTable(
  "parent_student_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => schoolMemberships.id, { onDelete: "cascade" }),
    relationship: text("relationship"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqStudentParent: uniqueIndex("uniq_student_parent").on(
      t.studentId,
      t.parentMembershipId,
    ),
  }),
);

/** Lightweight audit trail for trust-sensitive events (parent-link create/remove). */
export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  actorUserId: text("actor_user_id").references(() => user.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Sprint 004 — Guru daily loop (all school-owned / tenant-scoped)
// ---------------------------------------------------------------------------

/** Per-school configurable rules. Attendance cutoff is school-local wall-clock. */
export const schoolSettings = pgTable("school_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .unique()
    .references(() => schools.id, { onDelete: "cascade" }),
  attendanceCutoffTime: text("attendance_cutoff_time").notNull().default("07:30"),
  // IANA timezone used to interpret the cutoff as wall-clock time.
  schoolTimezone: text("school_timezone").notNull().default("Asia/Jakarta"),
  // Default KKM (0-100 threshold) applied when a grade omits its own KKM.
  defaultKkm: integer("default_kkm").notNull().default(75),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Daily attendance fact per student per date. */
export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    attendanceDate: date("attendance_date").notNull(), // YYYY-MM-DD
    status: text("status").notNull(), // hadir | sakit | izin | alpa | terlambat
    recordedByMembershipId: uuid("recorded_by_membership_id")
      .notNull()
      .references(() => schoolMemberships.id),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqStudentDate: uniqueIndex("uniq_student_date").on(
      t.schoolId,
      t.studentId,
      t.attendanceDate,
    ),
  }),
);

/** Minimal parent-teacher communication thread used by Papan Pagi. */
export const messageThreads = pgTable(
  "message_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    parentMembershipId: uuid("parent_membership_id")
      .notNull()
      .references(() => schoolMemberships.id, { onDelete: "cascade" }),
    classId: uuid("class_id").references(() => classes.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("open"),
    lastMessageAt: timestamp("last_message_at"),
    lastParentMessageAt: timestamp("last_parent_message_at"),
    lastTeacherReplyAt: timestamp("last_teacher_reply_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniqStudentParentThread: uniqueIndex("uniq_student_parent_thread").on(
      t.studentId,
      t.parentMembershipId,
    ),
  }),
);

/** Individual message entries within a thread. */
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  threadId: uuid("thread_id")
    .notNull()
    .references(() => messageThreads.id, { onDelete: "cascade" }),
  studentId: uuid("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  senderMembershipId: uuid("sender_membership_id")
    .notNull()
    .references(() => schoolMemberships.id),
  senderRole: text("sender_role").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** In-app notification records (no push delivery in Sprint 004). */
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  schoolId: uuid("school_id")
    .notNull()
    .references(() => schools.id, { onDelete: "cascade" }),
  recipientMembershipId: uuid("recipient_membership_id")
    .notNull()
    .references(() => schoolMemberships.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").references(() => students.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  payload: jsonb("payload"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Sprint 006 — Nilai & Catatan (all school-owned / tenant-scoped)
// ---------------------------------------------------------------------------

/** Basic grade record ("nilai dasar terhadap KKM"), not a full raport. */
export const grades = pgTable(
  "grades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    classId: uuid("class_id").references(() => classes.id, {
      onDelete: "set null",
    }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    assessmentName: text("assessment_name").notNull(),
    assessmentDate: date("assessment_date").notNull(),
    score: integer("score").notNull(),
    maxScore: integer("max_score").notNull().default(100),
    // KKM threshold (0-100) stored per record so later setting changes do not
    // rewrite historical meaning.
    kkm: integer("kkm").notNull(),
    visibilityStatus: text("visibility_status").notNull().default("draft"), // draft | published
    publishedAt: timestamp("published_at"),
    recordedByMembershipId: uuid("recorded_by_membership_id")
      .notNull()
      .references(() => schoolMemberships.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    byClassDate: index("grades_class_date").on(
      t.schoolId,
      t.classId,
      t.assessmentDate,
    ),
    byStudentDate: index("grades_student_date").on(
      t.schoolId,
      t.studentId,
      t.assessmentDate,
    ),
    byStudentVisibility: index("grades_student_visibility").on(
      t.schoolId,
      t.studentId,
      t.visibilityStatus,
    ),
  }),
);

/** Qualitative student note, internal-only by default. No scoring. */
export const studentNotes = pgTable(
  "student_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    schoolId: uuid("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    classId: uuid("class_id").references(() => classes.id, {
      onDelete: "set null",
    }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    authorMembershipId: uuid("author_membership_id")
      .notNull()
      .references(() => schoolMemberships.id),
    category: text("category").notNull(), // general | academic | attendance | wellbeing
    body: text("body").notNull(),
    visibilityStatus: text("visibility_status").notNull().default("internal"), // internal | published
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    byStudentCreated: index("student_notes_student_created").on(
      t.schoolId,
      t.studentId,
      t.createdAt,
    ),
    byStudentVisibility: index("student_notes_student_visibility").on(
      t.schoolId,
      t.studentId,
      t.visibilityStatus,
    ),
    byClassCreated: index("student_notes_class_created").on(
      t.schoolId,
      t.classId,
      t.createdAt,
    ),
  }),
);
