// Helper KHUSUS unit test: DB SQLite in-memory (Node), sudah dimigrasi.
import sqlite3InitModule, { type Database } from '@sqlite.org/sqlite-wasm';
import { jalankanMigrasi } from './migrasi';

const sqlite3 = sqlite3InitModule();

export async function buatDbUji(opsi: { migrasi?: boolean } = {}): Promise<Database> {
  const db = new (await sqlite3).oo1.DB(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  if (opsi.migrasi !== false) jalankanMigrasi(db);
  return db;
}
