CREATE TABLE "afdelings" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"estate_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"tipe" varchar(50),
	"rayon" varchar(50),
	"luas_ha" real,
	"boundary_polygon" geometry(MultiPolygon, 4326)
);
--> statement-breakpoint
CREATE TABLE "baris" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"blok_id" varchar(255) NOT NULL,
	"nomor_baris" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bloks" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"afdeling_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"tahun_tanam" integer,
	"varietas" varchar(100),
	"topografi" varchar(50),
	"maturity" varchar(50),
	"sph" real,
	"luas_ha" real,
	"total_pokok_gis" integer,
	"boundary_polygon" geometry(MultiPolygon, 4326)
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "estates" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"company_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(50),
	"latitude" real,
	"longitude" real,
	"boundary_polygon" geometry(MultiPolygon, 4326)
);
--> statement-breakpoint
CREATE TABLE "foto_bukti" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspeksi_detail_id" uuid NOT NULL,
	"remote_url" text NOT NULL,
	"captured_at" timestamp,
	"ai_result_json" text
);
--> statement-breakpoint
CREATE TABLE "hama_penyakit" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"nama_id" varchar(255) NOT NULL,
	"nama_latin" varchar(255),
	"nama_en" varchar(255),
	"kategori" varchar(50) NOT NULL,
	"deskripsi" text,
	"gejala_visual" text,
	"tingkat_bahaya" varchar(50) NOT NULL,
	"is_custom" boolean DEFAULT false,
	"foto_referensi_url" text
);
--> statement-breakpoint
CREATE TABLE "inspeksi" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pokok_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"tanggal_inspeksi" timestamp NOT NULL,
	"latitude" real,
	"longitude" real,
	"catatan" text,
	"sync_status" varchar(50) DEFAULT 'synced',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inspeksi_detail" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspeksi_id" uuid NOT NULL,
	"hama_penyakit_id" varchar(255) NOT NULL,
	"tingkat_serangan" varchar(50),
	"persentase_serangan" integer,
	"bagian_terserang" varchar(255),
	"catatan" text
);
--> statement-breakpoint
CREATE TABLE "pokok" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"baris_id" varchar(255) NOT NULL,
	"nomor_pokok" integer NOT NULL,
	"latitude" real,
	"longitude" real,
	"status" varchar(50) DEFAULT 'sehat',
	"gps_recorded_at" timestamp,
	"gps_recorded_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "treatment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspeksi_detail_id" uuid NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"jenis_treatment" varchar(100),
	"bahan_kimia" varchar(255),
	"dosis" real,
	"satuan_dosis" varchar(50),
	"tanggal_treatment" timestamp NOT NULL,
	"hasil" varchar(50),
	"catatan" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"nama" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) NOT NULL,
	"estate_id" varchar(255),
	"is_active" boolean DEFAULT true,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "afdelings" ADD CONSTRAINT "afdelings_estate_id_estates_id_fk" FOREIGN KEY ("estate_id") REFERENCES "public"."estates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "baris" ADD CONSTRAINT "baris_blok_id_bloks_id_fk" FOREIGN KEY ("blok_id") REFERENCES "public"."bloks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bloks" ADD CONSTRAINT "bloks_afdeling_id_afdelings_id_fk" FOREIGN KEY ("afdeling_id") REFERENCES "public"."afdelings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estates" ADD CONSTRAINT "estates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foto_bukti" ADD CONSTRAINT "foto_bukti_inspeksi_detail_id_inspeksi_detail_id_fk" FOREIGN KEY ("inspeksi_detail_id") REFERENCES "public"."inspeksi_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspeksi" ADD CONSTRAINT "inspeksi_pokok_id_pokok_id_fk" FOREIGN KEY ("pokok_id") REFERENCES "public"."pokok"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspeksi" ADD CONSTRAINT "inspeksi_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspeksi_detail" ADD CONSTRAINT "inspeksi_detail_inspeksi_id_inspeksi_id_fk" FOREIGN KEY ("inspeksi_id") REFERENCES "public"."inspeksi"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspeksi_detail" ADD CONSTRAINT "inspeksi_detail_hama_penyakit_id_hama_penyakit_id_fk" FOREIGN KEY ("hama_penyakit_id") REFERENCES "public"."hama_penyakit"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokok" ADD CONSTRAINT "pokok_baris_id_baris_id_fk" FOREIGN KEY ("baris_id") REFERENCES "public"."baris"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pokok" ADD CONSTRAINT "pokok_gps_recorded_by_users_id_fk" FOREIGN KEY ("gps_recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment" ADD CONSTRAINT "treatment_inspeksi_detail_id_inspeksi_detail_id_fk" FOREIGN KEY ("inspeksi_detail_id") REFERENCES "public"."inspeksi_detail"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatment" ADD CONSTRAINT "treatment_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_estate_id_estates_id_fk" FOREIGN KEY ("estate_id") REFERENCES "public"."estates"("id") ON DELETE no action ON UPDATE no action;