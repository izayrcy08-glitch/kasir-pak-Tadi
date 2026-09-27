// Pemeriksaan file backup (hasil Export) sebelum dipakai menimpa data toko.
// Dipakai di sqlite.worker.ts; tidak menyentuh OPFS, jadi bisa diuji di Node.
//
// File diperiksa di salinan in-memory — DB toko yang sedang dipakai tidak
// tersentuh sama sekali sampai file terbukti utuh & memang backup Kasir.
import type { Database, Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { BerkasBackupTidakValidError } from './galat';
import { jalankanMigrasi, versiSkema } from './migrasi';
import { MIGRASI } from './skema';

export interface RingkasanData {
  namaToko: string | null;
  jumlahProduk: number;
  jumlahTransaksi: number;
  /** Epoch ms transaksi terbaru; null kalau belum ada transaksi. */
  transaksiTerakhirPada: number | null;
}

// Tabel yang pasti ada sejak skema v1 — penanda file ini memang DB Kasir,
// bukan file SQLite milik aplikasi lain.
const TABEL_WAJIB = ['produk', 'transaksi', 'item_transaksi', 'pengaturan_toko'];

const HEADER_SQLITE = 'SQLite format 3\0';

// Isi DB secara ringkas — ditampilkan saat konfirmasi Pulihkan supaya
// pengguna bisa membandingkan data di file vs data di device ini.
export function ringkasData(db: Database): RingkasanData {
  const b = db.selectObject(
    `SELECT (SELECT nama_toko FROM pengaturan_toko WHERE id = 1) AS nama_toko,
            (SELECT count(*) FROM produk) AS jumlah_produk,
            (SELECT count(*) FROM transaksi) AS jumlah_transaksi,
            (SELECT max(dibuat_pada) FROM transaksi) AS transaksi_terakhir_pada`,
  ) as {
    nama_toko: string | null;
    jumlah_produk: number;
    jumlah_transaksi: number;
    transaksi_terakhir_pada: number | null;
  };
  return {
    namaToko: b.nama_toko,
    jumlahProduk: b.jumlah_produk,
    jumlahTransaksi: b.jumlah_transaksi,
    transaksiTerakhirPada: b.transaksi_terakhir_pada,
  };
}

function berheaderSqlite(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 512 || bytes.byteLength % 512 !== 0) return false;
  for (let i = 0; i < HEADER_SQLITE.length; i++) {
    if (bytes[i] !== HEADER_SQLITE.charCodeAt(i)) return false;
  }
  return true;
}

// Buka salinan bytes sebagai DB in-memory (sqlite3_deserialize).
function bukaDariBytes(sqlite3: Sqlite3Static, bytes: Uint8Array): Database {
  const db = new sqlite3.oo1.DB(':memory:');
  const p = sqlite3.wasm.allocFromTypedArray(bytes);
  const rc = sqlite3.capi.sqlite3_deserialize(
    db,
    'main',
    p,
    bytes.byteLength,
    bytes.byteLength,
    // FREEONCLOSE: memori p dibebaskan SQLite saat db ditutup (atau saat
    // deserialize gagal). RESIZEABLE: migrasi di salinan ini boleh menambah
    // halaman.
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE,
  );
  if (rc !== 0) {
    db.close();
    throw new BerkasBackupTidakValidError('rusak');
  }
  return db;
}

// Lempar BerkasBackupTidakValidError kalau file tidak boleh dipakai; kalau
// lolos, kembalikan ringkasan isinya (sesudah dibawa ke skema terbaru).
export function periksaBerkasBackup(
  sqlite3: Sqlite3Static,
  bytes: Uint8Array,
  migrasi: readonly string[] = MIGRASI,
): RingkasanData {
  if (!berheaderSqlite(bytes)) throw new BerkasBackupTidakValidError('bukanBackup');

  const db = bukaDariBytes(sqlite3, bytes);
  try {
    let hasilCek: unknown[];
    try {
      hasilCek = db.selectValues('PRAGMA integrity_check');
    } catch {
      throw new BerkasBackupTidakValidError('rusak');
    }
    if (hasilCek.length !== 1 || hasilCek[0] !== 'ok') throw new BerkasBackupTidakValidError('rusak');

    const versi = versiSkema(db);
    if (versi > migrasi.length) throw new BerkasBackupTidakValidError('versiLebihBaru');
    const tabel = db.selectValues("SELECT name FROM sqlite_schema WHERE type = 'table'");
    if (versi < 1 || !TABEL_WAJIB.every((t) => tabel.includes(t))) {
      throw new BerkasBackupTidakValidError('bukanBackup');
    }

    db.exec('PRAGMA foreign_keys = ON');
    try {
      jalankanMigrasi(db, migrasi);
    } catch {
      throw new BerkasBackupTidakValidError('rusak');
    }
    if (db.selectValues('PRAGMA foreign_key_check').length > 0) throw new BerkasBackupTidakValidError('rusak');

    return ringkasData(db);
  } finally {
    db.close();
  }
}
