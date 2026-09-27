/// <reference lib="webworker" />
// SQLite-WASM jalan di Web Worker karena VFS OPFS (penyimpanan permanen) hanya
// tersedia di worker. Pakai VFS "opfs-sahpool" — tidak butuh header COOP/COEP,
// jadi aman di Firebase Hosting maupun WebView Capacitor.
import sqlite3InitModule, { type Database, type SAHPoolUtil } from '@sqlite.org/sqlite-wasm';
import { AplikasiSudahTerbukaError, serialisasiGalat } from './galat';
import { jalankanMigrasi, versiSkema } from './migrasi';
import { OPERASI } from './operasi';
import type { DbRequest, DbResponse } from './protokol';

const NAMA_FILE_DB = '/kasir.sqlite3';

// Kunci eksklusif lintas tab/jendela/worker (Web Locks API). Tanpa ini, worker
// baru bisa mulai membuka file DB saat worker lama (mis. sebelum reload) belum
// melepasnya — pembukaan gagal, dan library asli lalu MENGHAPUS direktori DB
// (sudah ditambal, lihat tambalan.test.ts, tapi jangan sampai terjadi sama
// sekali). Kunci dilepas otomatis oleh browser saat worker mati.
const NAMA_KUNCI = 'kasir-db';
// Cukup lama untuk menunggu worker lama selesai ditutup saat reload, cukup
// singkat supaya jendela kedua segera diberi tahu.
const BATAS_TUNGGU_KUNCI_MS = 5000;

function ambilKunciEksklusif(): Promise<void> {
  return new Promise((resolve, reject) => {
    const batal = new AbortController();
    const timer = setTimeout(() => batal.abort(), BATAS_TUNGGU_KUNCI_MS);
    navigator.locks
      .request(NAMA_KUNCI, { mode: 'exclusive', signal: batal.signal }, () => {
        clearTimeout(timer);
        resolve();
        // Promise yang tidak pernah selesai = kunci dipegang sampai worker mati.
        return new Promise<never>(() => {});
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        reject(err instanceof DOMException && err.name === 'AbortError' ? new AplikasiSudahTerbukaError() : err);
      });
  });
}

let db: Database | null = null;
let pool: SAHPoolUtil | null = null;

async function siapkan(): Promise<void> {
  await ambilKunciEksklusif();
  const sqlite3 = await sqlite3InitModule();
  pool = await sqlite3.installOpfsSAHPoolVfs({ directory: '/kasir-db' });
  db = new pool.OpfsSAHPoolDb(NAMA_FILE_DB);
  // foreign_keys harus diset di luar transaksi, per koneksi.
  db.exec('PRAGMA foreign_keys = ON;');
  jalankanMigrasi(db);
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
    case 'panggil': {
      if (!Object.hasOwn(OPERASI, req.nama)) throw new Error(`Operasi tidak dikenal: ${req.nama}`);
      const op = OPERASI[req.nama as keyof typeof OPERASI] as (db: Database, ...args: unknown[]) => unknown;
      // Sinkron dari awal sampai akhir — tidak ada await di sini, jadi
      // operasi ini tidak bisa tersela pesan lain.
      return op(db, ...req.args);
    }
    case 'info':
      return {
        versiSqlite: db.selectValue('select sqlite_version()') as string,
        vfs: 'opfs-sahpool',
        versiSkema: versiSkema(db),
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
    res = { id: req.id, ok: false, galat: serialisasiGalat(err) };
  }
  self.postMessage(res);
};
