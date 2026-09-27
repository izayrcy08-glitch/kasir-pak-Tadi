// Operasi pengaturan toko di SQLite — satu baris saja (id = 1).
import type { Database } from '@sqlite.org/sqlite-wasm';
import type { PengaturanToko, PengaturanTokoInput } from '../../types/pengaturanToko';
import { type Ketergantungan, ketergantunganBawaan } from './ketergantungan';

export function ambilPengaturanToko(db: Database): PengaturanToko | null {
  const b = db.selectObject('SELECT nama_toko, logo_webp, diperbarui_pada FROM pengaturan_toko WHERE id = 1') as
    | { nama_toko: string; logo_webp: string | null; diperbarui_pada: number }
    | undefined;
  if (!b) return null;
  return { namaToko: b.nama_toko, logoWebp: b.logo_webp ?? undefined, diperbaruiPada: b.diperbarui_pada };
}

export function simpanPengaturanToko(
  db: Database,
  input: PengaturanTokoInput,
  dep: Ketergantungan = ketergantunganBawaan,
): void {
  db.exec({
    sql: `INSERT INTO pengaturan_toko (id, nama_toko, logo_webp, diperbarui_pada) VALUES (1, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET nama_toko = excluded.nama_toko, logo_webp = excluded.logo_webp,
            diperbarui_pada = excluded.diperbarui_pada`,
    bind: [input.namaToko, input.logoWebp ?? null, dep.sekarang().getTime()],
  });
}
