// Membuat file backup berisi data dummy ±2 tahun (lihat scripts/dataDummy.ts).
// Pakai: node scripts/buat-data-dummy.mjs [folder-tujuan]
// Hasil: backup-kasir-DATA-DUMMY-YYYY-MM-DD.sqlite3 — muat lewat
// Pengaturan → Backup & Pulihkan Data → Pilih file backup.
// JANGAN dipulihkan di tablet toko yang sudah berisi data sungguhan.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { buatDataDummy } = await server.ssrLoadModule('/scripts/dataDummy.ts');
  const sekarang = new Date();
  const { bytes, ringkasan } = await buatDataDummy(sekarang);
  const tanggal = sekarang.toLocaleDateString('sv-SE');
  const tujuan = join(process.argv[2] ?? '.', `backup-kasir-DATA-DUMMY-${tanggal}.sqlite3`);
  writeFileSync(tujuan, bytes);
  console.log(`${tujuan}\n${ringkasan}\n${(bytes.length / 1024 / 1024).toFixed(1)} MB`);
} finally {
  await server.close();
}
