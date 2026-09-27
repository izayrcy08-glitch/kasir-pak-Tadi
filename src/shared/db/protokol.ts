// Format pesan antara main thread dan sqlite.worker.ts.
import type { GalatTerserialisasi } from './galat';

export type NilaiSql = string | number | null | Uint8Array;

export type DbRequest =
  | { id: number; type: 'query'; sql: string; bind?: NilaiSql[] }
  | { id: number; type: 'panggil'; nama: string; args: unknown[] }
  | { id: number; type: 'info' }
  | { id: number; type: 'export' }
  // Periksa file backup tanpa mengubah apa pun → RingkasanData.
  | { id: number; type: 'periksaBackup'; bytes: Uint8Array }
  // Ganti SELURUH DB dengan isi file backup → RingkasanData.
  | { id: number; type: 'pulihkanBackup'; bytes: Uint8Array };

export type DbResponse =
  | { id: number; ok: true; hasil: unknown }
  | { id: number; ok: false; galat: GalatTerserialisasi };

export interface InfoDb {
  versiSqlite: string;
  vfs: string;
  versiSkema: number;
  file: string[];
}
