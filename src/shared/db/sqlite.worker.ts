/// <reference lib="webworker" />
// SQLite-WASM jalan di Web Worker karena VFS OPFS (penyimpanan permanen) hanya
// tersedia di worker. Pakai VFS "opfs-sahpool" — tidak butuh header COOP/COEP,
// jadi aman di Firebase Hosting maupun WebView Capacitor.
import sqlite3InitModule, { type Database, type SAHPoolUtil } from '@sqlite.org/sqlite-wasm';
import type { DbRequest, DbResponse } from './protokol';

const NAMA_FILE_DB = '/kasir.sqlite3';

let db: Database | null = null;
let pool: SAHPoolUtil | null = null;

async function siapkan(): Promise<void> {
  const sqlite3 = await sqlite3InitModule();
  pool = await sqlite3.installOpfsSAHPoolVfs({ directory: '/kasir-db' });
  db = new pool.OpfsSAHPoolDb(NAMA_FILE_DB);
  db.exec('PRAGMA foreign_keys = ON;');
}

const siap = siapkan();

async function tangani(req: DbRequest): Promise<unknown> {
  await siap;
  if (!db || !pool) throw new Error('Database belum siap');
  switch (req.type) {
    case 'query':
      return db.exec({
        sql: req.sql,
        bind: req.bind,
        rowMode: 'object',
        returnValue: 'resultRows',
      });
    case 'info':
      return {
        versiSqlite: db.selectValue('select sqlite_version()') as string,
        vfs: 'opfs-sahpool',
        file: pool.getFileNames(),
      };
    case 'export':
      return pool.exportFile(NAMA_FILE_DB);
  }
}

self.onmessage = async (e: MessageEvent<DbRequest>) => {
  const req = e.data;
  let res: DbResponse;
  try {
    res = { id: req.id, ok: true, hasil: await tangani(req) };
  } catch (err) {
    res = { id: req.id, ok: false, pesan: err instanceof Error ? err.message : String(err) };
  }
  self.postMessage(res);
};
