/// <reference lib="webworker" />
// SQLite-WASM jalan di Web Worker karena VFS OPFS (penyimpanan permanen) hanya
// tersedia di worker. Pakai VFS "opfs-sahpool" — tidak butuh header COOP/COEP,
// jadi aman di Firebase Hosting maupun WebView Capacitor.
import sqlite3InitModule, { type Database, type SAHPoolUtil, type Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { periksaBerkasBackup, type RingkasanData } from './berkasBackup';
import { AplikasiSudahTerbukaError, serialisasiGalat } from './galat';
import { jalankanMigrasi, versiSkema } from './migrasi';
import { OPERASI } from './operasi';
import { catatBackup } from './operasi/backup';
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

let sqlite3: Sqlite3Static | null = null;
let db: Database | null = null;
let pool: SAHPoolUtil | null = null;

function bukaDb(p: SAHPoolUtil): Database {
  const d = new p.OpfsSAHPoolDb(NAMA_FILE_DB);
  try {
    // foreign_keys harus diset di luar transaksi, per koneksi.
    d.exec('PRAGMA foreign_keys = ON;');
    jalankanMigrasi(d);
    return d;
  } catch (err) {
    d.close();
    throw err;
  }
}

async function siapkan(): Promise<void> {
  await ambilKunciEksklusif();
  sqlite3 = await sqlite3InitModule();
  pool = await sqlite3.installOpfsSAHPoolVfs({ directory: '/kasir-db' });
  db = bukaDb(pool);
}

const siap = siapkan();

// Tulis `bytes` sebagai file DB lalu buka. unlink dulu: importDb() tidak
// memotong file lama, jadi tanpa ini sisa ekor file lama bisa tertinggal
// kalau file baru lebih kecil.
async function pasangFileDb(p: SAHPoolUtil, bytes: Uint8Array): Promise<Database> {
  p.unlink(NAMA_FILE_DB);
  await p.importDb(NAMA_FILE_DB, bytes);
  const d = bukaDb(p);
  if (d.selectValue('PRAGMA quick_check') !== 'ok') {
    d.close();
    throw new Error('Database hasil pulihkan tidak utuh.');
  }
  return d;
}

// Ganti seluruh DB toko dengan isi file backup. File diperiksa ulang di sini
// (jangan percaya hasil periksa sebelumnya dari UI). Salinan DB lama dipegang
// di memori; kalau penggantian gagal di tengah, salinan itu dipasang kembali.
async function pulihkanBackup(s: Sqlite3Static, p: SAHPoolUtil, bytes: Uint8Array): Promise<RingkasanData> {
  const ringkasan = periksaBerkasBackup(s, bytes);
  const salinanLama = await p.exportFile(NAMA_FILE_DB);
  db?.close();
  db = null;
  try {
    db = await pasangFileDb(p, bytes);
  } catch (err) {
    // Kalau pemasangan kembali ini juga gagal, db tetap null: semua operasi
    // berikutnya ditolak ("Database belum siap") alih-alih menulis ke DB
    // yang tidak jelas isinya. Buka ulang app = coba buka file yang ada.
    db = await pasangFileDb(p, salinanLama);
    throw err;
  }
  // Isi device sekarang = isi file backup yang sudah ada di luar device, jadi
  // belum ada data yang "belum di-backup" — pengingat mulai dihitung dari sini.
  catatBackup(db);
  return ringkasan;
}

async function tangani(req: DbRequest): Promise<unknown> {
  await siap;
  if (!db || !pool || !sqlite3) throw new Error('Database belum siap');
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
    case 'periksaBackup':
      return periksaBerkasBackup(sqlite3, req.bytes);
    case 'pulihkanBackup':
      return pulihkanBackup(sqlite3, pool, req.bytes);
  }
}

async function proses(req: DbRequest): Promise<void> {
  let res: DbResponse;
  try {
    res = { id: req.id, ok: true, hasil: await tangani(req) };
  } catch (err) {
    res = { id: req.id, ok: false, galat: serialisasiGalat(err) };
  }
  self.postMessage(res);
}

// Pesan diproses satu per satu sampai selesai. pulihkanBackup punya `await` di
// tengah (db sempat ditutup); tanpa antrian ini, operasi lain bisa menyela
// dan gagal di celah itu.
let antrian: Promise<void> = Promise.resolve();

self.onmessage = (e: MessageEvent<DbRequest>) => {
  antrian = antrian.then(() => proses(e.data));
};
