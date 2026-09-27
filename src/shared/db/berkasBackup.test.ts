import type { Database, Sqlite3Static } from '@sqlite.org/sqlite-wasm';
import { beforeAll, describe, expect, it } from 'vitest';
import { periksaBerkasBackup } from './berkasBackup';
import { BerkasBackupTidakValidError, type AlasanBerkasTidakValid } from './galat';
import { MIGRASI } from './skema';
import { ambilSqlite3Uji, buatDbUji } from './ujiDb';

let sqlite3: Sqlite3Static;
beforeAll(async () => {
  sqlite3 = await ambilSqlite3Uji();
});

function keBytes(db: Database): Uint8Array {
  return sqlite3.capi.sqlite3_js_db_export(db);
}

function isiContoh(db: Database): void {
  db.exec(`
    INSERT INTO pengaturan_toko (id, nama_toko, diperbarui_pada) VALUES (1, 'Toko Maju', 0);
    INSERT INTO produk (id, nama, kategori, harga_beli, harga_jual, stok, satuan, dibuat_pada, diperbarui_pada)
      VALUES ('p1', 'Busi', 'Mesin', 10000, 15000, 5, 'pcs', 0, 0),
             ('p2', 'Oli', 'Oli', 40000, 50000, 3, 'liter', 0, 0);
    INSERT INTO transaksi (id, subtotal, total_diskon, total, metode_bayar, dibayar, kembalian, dibuat_pada, tanggal_lokal)
      VALUES ('t1', 15000, 0, 15000, 'tunai', 20000, 5000, 1000, '2026-09-27'),
             ('t2', 15000, 0, 15000, 'qris_transfer', NULL, NULL, 5000, '2026-09-27');
    INSERT INTO item_transaksi (transaksi_id, urutan, produk_id, nama, harga_satuan, qty, subtotal_item)
      VALUES ('t1', 0, 'p1', 'Busi', 15000, 1, 15000), ('t2', 0, 'p1', 'Busi', 15000, 1, 15000);
  `);
}

function alasanGagal(bytes: Uint8Array): AlasanBerkasTidakValid | 'lolos' {
  try {
    periksaBerkasBackup(sqlite3, bytes);
    return 'lolos';
  } catch (err) {
    if (err instanceof BerkasBackupTidakValidError) return err.alasan;
    throw err;
  }
}

describe('periksaBerkasBackup', () => {
  it('menerima backup valid dan meringkas isinya', async () => {
    const db = await buatDbUji();
    isiContoh(db);
    expect(periksaBerkasBackup(sqlite3, keBytes(db))).toEqual({
      namaToko: 'Toko Maju',
      jumlahProduk: 2,
      jumlahTransaksi: 2,
      transaksiTerakhirPada: 5000,
    });
  });

  it('menerima backup dari DB kosong (toko baru)', async () => {
    const db = await buatDbUji();
    expect(periksaBerkasBackup(sqlite3, keBytes(db))).toEqual({
      namaToko: null,
      jumlahProduk: 0,
      jumlahTransaksi: 0,
      transaksiTerakhirPada: null,
    });
  });

  it('menerima backup versi skema lama (dibawa ke versi terbaru di salinan)', async () => {
    const db = await buatDbUji({ migrasi: MIGRASI.slice(0, 1) });
    isiContoh(db);
    expect(periksaBerkasBackup(sqlite3, keBytes(db)).jumlahProduk).toBe(2);
  });

  it('menolak file yang bukan SQLite', () => {
    expect(alasanGagal(new TextEncoder().encode('halo'.repeat(256)))).toBe('bukanBackup');
    expect(alasanGagal(new Uint8Array(0))).toBe('bukanBackup');
  });

  it('menolak file SQLite milik aplikasi lain', async () => {
    const lain = await buatDbUji({ migrasi: false });
    lain.exec('CREATE TABLE catatan (isi TEXT)');
    expect(alasanGagal(keBytes(lain))).toBe('bukanBackup');

    // Punya user_version tapi tabelnya bukan tabel Kasir.
    lain.exec('PRAGMA user_version = 1');
    expect(alasanGagal(keBytes(lain))).toBe('bukanBackup');
  });

  it('menolak backup dari versi aplikasi yang lebih baru', async () => {
    const db = await buatDbUji();
    db.exec(`PRAGMA user_version = ${MIGRASI.length + 1}`);
    expect(alasanGagal(keBytes(db))).toBe('versiLebihBaru');
  });

  it('menolak file yang isinya rusak', async () => {
    const db = await buatDbUji();
    isiContoh(db);
    const bytes = keBytes(db);
    const ukuranHalaman = (bytes[16] << 8) | bytes[17];
    // Timpa halaman ke-2 dst. — header utuh, tapi isi tabel hancur.
    bytes.fill(0xff, ukuranHalaman, bytes.byteLength);
    expect(alasanGagal(bytes)).toBe('rusak');
  });

  it('menolak file dengan relasi transaksi yang putus', async () => {
    const db = await buatDbUji();
    db.exec('PRAGMA foreign_keys = OFF');
    db.exec(`INSERT INTO item_transaksi (transaksi_id, urutan, produk_id, nama, harga_satuan, qty, subtotal_item)
             VALUES ('tidak-ada', 0, 'p1', 'Busi', 15000, 1, 15000)`);
    expect(alasanGagal(keBytes(db))).toBe('rusak');
  });
});
