// Catatan backup terakhir (tabel status_backup, satu baris id = 1) — bahan
// pengingat backup rutin.
import type { Database } from '@sqlite.org/sqlite-wasm';
import { type Ketergantungan, ketergantunganBawaan } from './ketergantungan';

export interface StatusBackup {
  /** Epoch ms; null = belum pernah backup di device ini. */
  terakhirBackupPada: number | null;
  /** Ada produk atau transaksi — DB kosong tidak perlu diingatkan backup. */
  adaData: boolean;
}

export function ambilStatusBackup(db: Database): StatusBackup {
  const b = db.selectObject(
    `SELECT (SELECT terakhir_backup_pada FROM status_backup WHERE id = 1) AS terakhir,
            (EXISTS (SELECT 1 FROM produk) OR EXISTS (SELECT 1 FROM transaksi)) AS ada_data`,
  ) as { terakhir: number | null; ada_data: number };
  return { terakhirBackupPada: b.terakhir, adaData: b.ada_data === 1 };
}

// Dipanggil UI SETELAH file backup benar-benar tersimpan/terkirim (bukan saat
// file dibuat) — kalau pengguna membatalkan, pengingat tetap muncul.
export function catatBackup(db: Database, dep: Ketergantungan = ketergantunganBawaan): void {
  db.exec({
    sql: `INSERT INTO status_backup (id, terakhir_backup_pada) VALUES (1, ?)
          ON CONFLICT (id) DO UPDATE SET terakhir_backup_pada = excluded.terakhir_backup_pada`,
    bind: [dep.sekarang().getTime()],
  });
}
