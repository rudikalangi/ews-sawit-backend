import { db } from '../db';
import { hamaPenyakit } from '../db/schema';
import crypto from 'crypto';

const masterData = [
  // Hama
  {
    namaId: 'Ulat Kantong',
    namaLatin: 'Mahasena corbetti',
    namaEn: 'Bagworm',
    kategori: 'hama',
    tingkatBahaya: 'tingkat_tinggi',
    deskripsi: 'Menyerang daun kelapa sawit hingga menyebabkan daun berlubang dan kering.',
    gejalaVisual: 'Adanya kantong-kantong kecil menggantung di daun, daun tampak robek dan mengering.'
  },
  {
    namaId: 'Kumbang Tanduk',
    namaLatin: 'Oryctes rhinoceros',
    namaEn: 'Rhinoceros Beetle',
    kategori: 'hama',
    tingkatBahaya: 'tingkat_kritis',
    deskripsi: 'Hama utama pada tanaman belum menghasilkan (TBM) dan tanaman baru (TB). Merusak titik tumbuh.',
    gejalaVisual: 'Pelepah daun muda patah atau berbentuk huruf V, titik tumbuh rusak.'
  },
  {
    namaId: 'Tikus Pohon',
    namaLatin: 'Rattus tiomanicus',
    namaEn: 'Wood Rat',
    kategori: 'hama',
    tingkatBahaya: 'tingkat_sedang',
    deskripsi: 'Memakan buah sawit yang matang maupun mentah, serta merusak bunga jantan.',
    gejalaVisual: 'Adanya bekas gigitan pada buah sawit di tandan, brondolan berserakan.'
  },
  {
    namaId: 'Rayap',
    namaLatin: 'Coptotermes curvignathus',
    namaEn: 'Termite',
    kategori: 'hama',
    tingkatBahaya: 'tingkat_kritis',
    deskripsi: 'Menyerang batang sawit terutama di lahan gambut, dapat menyebabkan pokok tumbang.',
    gejalaVisual: 'Adanya terowongan tanah pada pangkal batang hingga ke tajuk daun.'
  },
  // Penyakit
  {
    namaId: 'Busuk Pangkal Batang (BPB)',
    namaLatin: 'Ganoderma boninense',
    namaEn: 'Basal Stem Rot',
    kategori: 'penyakit',
    tingkatBahaya: 'tingkat_kritis',
    deskripsi: 'Penyakit paling mematikan pada kelapa sawit. Menyerang jaringan pembuluh di pangkal batang.',
    gejalaVisual: 'Terdapat tubuh buah (basidiokarp) Ganoderma di pangkal batang, pelepah tua berpatahan menggantung.'
  },
  {
    namaId: 'Busuk Tandan (Marasmius)',
    namaLatin: 'Marasmius palmivorus',
    namaEn: 'Marasmius Bunch Rot',
    kategori: 'penyakit',
    tingkatBahaya: 'tingkat_sedang',
    deskripsi: 'Menyerang tandan buah, terutama pada kondisi kelembaban tinggi.',
    gejalaVisual: 'Adanya miselium putih menutupi permukaan tandan buah, buah menjadi busuk.'
  },
  {
    namaId: 'Bercak Daun',
    namaLatin: 'Curvularia sp.',
    namaEn: 'Leaf Spot',
    kategori: 'penyakit',
    tingkatBahaya: 'tingkat_rendah',
    deskripsi: 'Umumnya menyerang bibit di pre-nursery dan main-nursery.',
    gejalaVisual: 'Bercak kuning hingga coklat pada daun, lama kelamaan membesar dan mengering.'
  },
  // Defisiensi
  {
    namaId: 'Kekurangan Nitrogen',
    kategori: 'defisiensi',
    tingkatBahaya: 'tingkat_sedang',
    deskripsi: 'Kekurangan unsur N menyebabkan pertumbuhan terhambat dan produksi turun.',
    gejalaVisual: 'Daun berwarna hijau pucat hingga kekuningan merata pada seluruh tajuk.'
  },
  {
    namaId: 'Kekurangan Magnesium',
    kategori: 'defisiensi',
    tingkatBahaya: 'tingkat_sedang',
    deskripsi: 'Kekurangan Mg sering terjadi pada tanah berpasir atau curah hujan tinggi.',
    gejalaVisual: 'Daun tua berwarna kuning cerah (oranye) terutama di bagian yang terkena sinar matahari.'
  },
  {
    namaId: 'Kekurangan Boron',
    kategori: 'defisiensi',
    tingkatBahaya: 'tingkat_sedang',
    deskripsi: 'Kekurangan Boron mengganggu perkembangan meristem apikal.',
    gejalaVisual: 'Daun mengerut (crinkled leaf), ujung daun berbentuk seperti kail (hook leaf).'
  }
];

async function seedHamaPenyakit() {
  console.log('Seeding Master Data Hama & Penyakit...');
  
  for (const item of masterData) {
    await db.insert(hamaPenyakit).values({ id: crypto.randomUUID(), ...item }).onConflictDoNothing();
  }
  
  console.log('Seeding Hama & Penyakit completed successfully!');
}

seedHamaPenyakit().catch(err => {
  console.error('Seed Hama failed:', err);
  process.exit(1);
});
