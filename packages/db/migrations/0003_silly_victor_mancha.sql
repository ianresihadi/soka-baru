CREATE TABLE IF NOT EXISTS "grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"class_id" uuid,
	"student_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"assessment_name" text NOT NULL,
	"assessment_date" date NOT NULL,
	"score" integer NOT NULL,
	"max_score" integer DEFAULT 100 NOT NULL,
	"kkm" integer NOT NULL,
	"visibility_status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"recorded_by_membership_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "student_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"class_id" uuid,
	"student_id" uuid NOT NULL,
	"author_membership_id" uuid NOT NULL,
	"category" text NOT NULL,
	"body" text NOT NULL,
	"visibility_status" text DEFAULT 'internal' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "school_settings" ADD COLUMN "default_kkm" integer DEFAULT 75 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grades" ADD CONSTRAINT "grades_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grades" ADD CONSTRAINT "grades_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "grades" ADD CONSTRAINT "grades_recorded_by_membership_id_school_memberships_id_fk" FOREIGN KEY ("recorded_by_membership_id") REFERENCES "public"."school_memberships"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "student_notes" ADD CONSTRAINT "student_notes_author_membership_id_school_memberships_id_fk" FOREIGN KEY ("author_membership_id") REFERENCES "public"."school_memberships"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "grades_class_date" ON "grades" USING btree ("school_id","class_id","assessment_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "grades_student_date" ON "grades" USING btree ("school_id","student_id","assessment_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "grades_student_visibility" ON "grades" USING btree ("school_id","student_id","visibility_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_notes_student_created" ON "student_notes" USING btree ("school_id","student_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_notes_student_visibility" ON "student_notes" USING btree ("school_id","student_id","visibility_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_notes_class_created" ON "student_notes" USING btree ("school_id","class_id","created_at");