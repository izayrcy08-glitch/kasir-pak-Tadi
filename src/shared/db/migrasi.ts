import type { Database } from '@sqlite.org/sqlite-wasm';
import { MIGRASI } from './skema';

export class VersiDbTerlaluBaruError extends Error {
  readonly versiDb: number;
  readonly versiApp: number;

  constructor(versiDb: number, versiApp: number) {
    super(
      `Database dibuat oleh versi aplikasi yang lebih baru (skema v${versiDb}, aplikasi ini v${versiApp}). Perbarui aplikasi dulu.`,
    );
    this.name = 'VersiDbTerlaluBaruError';
    this.versiDb = versiDb;
    this.versiApp = versiApp;
  }
}

export function versiSkema(db: Database): number {
  return db.selectValue('PRAGMA user_version') as number;
}

// Bawa DB ke versi skema terbaru. Tiap migrasi + kenaikan user_version jalan
// dalam satu transaksi: kalau migrasi gagal di tengah, DB tetap di versi lama
// (tidak setengah jadi). Menolak DB dari aplikasi yang lebih baru — penting
// untuk import file backup dari device yang aplikasinya sudah diupdate.
export function jalankanMigrasi(db: Database, migrasi: readonly string[] = MIGRASI): number {
  const versiAwal = versiSkema(db);
  if (versiAwal > migrasi.length) {
    throw new VersiDbTerlaluBaruError(versiAwal, migrasi.length);
  }
  for (let v = versiAwal; v < migrasi.length; v++) {
    db.transaction('IMMEDIATE', (tx) => {
      tx.exec(migrasi[v]);
      tx.exec(`PRAGMA user_version = ${v + 1}`);
    });
  }
  return migrasi.length;
}
