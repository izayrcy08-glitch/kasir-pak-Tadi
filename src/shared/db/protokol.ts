// Format pesan antara main thread dan sqlite.worker.ts.
import type { GalatTerserialisasi } from './galat';

export type NilaiSql = string | number | null | Uint8Array;

export type DbRequest =
  | { id: number; type: 'query'; sql: string; bind?: NilaiSql[] }
  | { id: number; type: 'panggil'; nama: string; args: unknown[] }
  | { id: number; type: 'info' }
  | { id: number; type: 'export' };

export type DbResponse =
  | { id: number; ok: true; hasil: unknown }
  | { id: number; ok: false; galat: GalatTerserialisasi };

export interface InfoDb {
  versiSqlite: string;
  vfs: string;
  versiSkema: number;
  file: string[];
}
