import {
  pgTable,
  uuid,
  varchar,
  text,
  real,
  integer,
  boolean,
  timestamp,
  geometry,
  customType
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Custom type for geometry(Polygon, 4326) since drizzle-orm has some basic postgis support but sometimes custom is safer
// Actually drizzle has `geometry` natively now: geometry('location', { type: 'point', srid: 4326 })
// We will use native drizzle geometry.

const customGeometry = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geometry(MultiPolygon, 4326)';
  },
});

export const companies = pgTable('companies', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
});

export const estates = pgTable('estates', {
  id: varchar('id', { length: 255 }).primaryKey(),
  companyId: varchar('company_id', { length: 255 }).references(() => companies.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  latitude: real('latitude'),
  longitude: real('longitude'),
  boundaryPolygon: customGeometry('boundary_polygon'),
});

export const afdelings = pgTable('afdelings', {
  id: varchar('id', { length: 255 }).primaryKey(),
  estateId: varchar('estate_id', { length: 255 }).references(() => estates.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  tipe: varchar('tipe', { length: 50 }), // INTI / PLASMA
  rayon: varchar('rayon', { length: 50 }),
  luasHa: real('luas_ha'),
  boundaryPolygon: customGeometry('boundary_polygon'),
});

export const bloks = pgTable('bloks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  afdelingId: varchar('afdeling_id', { length: 255 }).references(() => afdelings.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  tahunTanam: integer('tahun_tanam'),
  varietas: varchar('varietas', { length: 100 }),
  topografi: varchar('topografi', { length: 50 }),
  maturity: varchar('maturity', { length: 50 }),
  sph: real('sph'),
  luasHa: real('luas_ha'),
  totalPokokGis: integer('total_pokok_gis'),
  boundaryPolygon: customGeometry('boundary_polygon'),
});

export const baris = pgTable('baris', {
  id: varchar('id', { length: 255 }).primaryKey(),
  blokId: varchar('blok_id', { length: 255 }).references(() => bloks.id).notNull(),
  nomorBaris: integer('nomor_baris').notNull(),
});

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  nama: varchar('nama', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // admin, manajer, asisten, mandor
  estateId: varchar('estate_id', { length: 255 }).references(() => estates.id),
  isActive: boolean('is_active').default(true),
});

export const pokok = pgTable('pokok', {
  id: varchar('id', { length: 255 }).primaryKey(),
  barisId: varchar('baris_id', { length: 255 }).references(() => baris.id).notNull(),
  nomorPokok: integer('nomor_pokok').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  status: varchar('status', { length: 50 }).default('sehat'), // sehat, terserang, mati, tidak_produktif
  gpsRecordedAt: timestamp('gps_recorded_at'),
  gpsRecordedBy: varchar('gps_recorded_by', { length: 255 }).references(() => users.id),
});

export const hamaPenyakit = pgTable('hama_penyakit', {
  id: varchar('id', { length: 255 }).primaryKey(),
  namaId: varchar('nama_id', { length: 255 }).notNull(),
  namaLatin: varchar('nama_latin', { length: 255 }),
  namaEn: varchar('nama_en', { length: 255 }),
  kategori: varchar('kategori', { length: 50 }).notNull(), // hama, penyakit, defisiensi
  deskripsi: text('deskripsi'),
  gejalaVisual: text('gejala_visual'),
  tingkatBahaya: varchar('tingkat_bahaya', { length: 50 }).notNull(), // rendah, sedang, tinggi, kritis
  isCustom: boolean('is_custom').default(false),
  fotoReferensiUrl: text('foto_referensi_url'),
});

export const inspeksi = pgTable('inspeksi', {
  id: uuid('id').defaultRandom().primaryKey(),
  pokokId: varchar('pokok_id', { length: 255 }).references(() => pokok.id).notNull(),
  userId: varchar('user_id', { length: 255 }).references(() => users.id).notNull(),
  tanggalInspeksi: timestamp('tanggal_inspeksi').notNull(),
  latitude: real('latitude'),
  longitude: real('longitude'),
  catatan: text('catatan'),
  syncStatus: varchar('sync_status', { length: 50 }).default('synced'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  syncedAt: timestamp('synced_at').defaultNow(),
});

export const inspeksiDetail = pgTable('inspeksi_detail', {
  id: uuid('id').defaultRandom().primaryKey(),
  inspeksiId: uuid('inspeksi_id').references(() => inspeksi.id).notNull(),
  hamaPenyakitId: varchar('hama_penyakit_id', { length: 255 }).references(() => hamaPenyakit.id).notNull(),
  tingkatSerangan: varchar('tingkat_serangan', { length: 50 }), // ringan, sedang, berat, sangat_berat
  persentaseSerangan: integer('persentase_serangan'),
  bagianTerserang: varchar('bagian_terserang', { length: 255 }), // daun, batang, akar, buah, pelepah, pucuk (comma separated)
  catatan: text('catatan'),
});

export const fotoBukti = pgTable('foto_bukti', {
  id: uuid('id').defaultRandom().primaryKey(),
  inspeksiDetailId: uuid('inspeksi_detail_id').references(() => inspeksiDetail.id).notNull(),
  remoteUrl: text('remote_url').notNull(),
  capturedAt: timestamp('captured_at'),
  aiResultJson: text('ai_result_json'),
});

export const treatment = pgTable('treatment', {
  id: uuid('id').defaultRandom().primaryKey(),
  inspeksiDetailId: uuid('inspeksi_detail_id').references(() => inspeksiDetail.id).notNull(),
  userId: varchar('user_id', { length: 255 }).references(() => users.id).notNull(),
  jenisTreatment: varchar('jenis_treatment', { length: 100 }), // kimia, biologi, mekanis, kultur_teknis
  bahanKimia: varchar('bahan_kimia', { length: 255 }),
  dosis: real('dosis'),
  satuanDosis: varchar('satuan_dosis', { length: 50 }),
  tanggalTreatment: timestamp('tanggal_treatment').notNull(),
  hasil: varchar('hasil', { length: 50 }), // berhasil, gagal, dalam_proses
  catatan: text('catatan'),
});
