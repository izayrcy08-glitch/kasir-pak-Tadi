// Helper KHUSUS unit test: DB SQLite in-memory (Node), sudah dimigrasi.
import sqlite3InitModule, { type Database, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { jalankanMigrasi } from './migrasi';

const sqlite3 = sqlite3InitModule();

export function ambilSqlite3Uji(): Promise<Sqlite3Static> {
  return sqlite3;
}

// `migrasi`: false = DB kosong tanpa skema; array = hanya jalankan migrasi itu
// (mis. MIGRASI.slice(0, 1) untuk meniru DB versi lama).
export async function buatDbUji(opsi: { migrasi?: boolean | readonly string[] } = {}): Promise<Database> {
  const db = new (await sqlite3).oo1.DB(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  if (Array.isArray(opsi.migrasi)) jalankanMigrasi(db, opsi.migrasi);
  else if (opsi.migrasi !== false) jalankanMigrasi(db);
  return db;
}
