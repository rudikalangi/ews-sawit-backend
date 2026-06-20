import { db } from '../db';
import { hamaPenyakit } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

async function addNilPest() {
  const existing = await db.select().from(hamaPenyakit).where(eq(hamaPenyakit.namaId, 'Tidak Ada Serangan'));
  if (existing.length > 0) {
    console.log('Already exists:', existing[0].id);
    process.exit(0);
  }

  const newId = crypto.randomUUID();
  await db.insert(hamaPenyakit).values({
    id: newId,
    namaId: 'Tidak Ada Serangan',
    kategori: 'sehat',
    tingkatBahaya: 'rendah',
    deskripsi: 'Pokok kelapa sawit dalam kondisi sehat, tidak ditemukan gejala serangan hama atau penyakit.',
    gejalaVisual: 'Daun hijau normal, tidak ada bekas gigitan hama, tidak ada busuk atau bercak.',
    isCustom: false
  });
  
  console.log('Successfully inserted Tidak Ada Serangan with ID:', newId);
  process.exit(0);
}

addNilPest().catch(e => {
  console.error(e);
  process.exit(1);
});
