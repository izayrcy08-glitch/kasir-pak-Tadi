import { describe, expect, it } from 'vitest';
import { jalankanMigrasi, VersiDbTerlaluBaruError, versiSkema } from './migrasi';
import { VERSI_SKEMA } from './skema';
import { buatDbUji } from './ujiDb';

describe('jalankanMigrasi', () => {
  it('membawa DB baru ke versi skema terbaru', async () => {
    const db = await buatDbUji({ migrasi: false });
    expect(versiSkema(db)).toBe(0);
    jalankanMigrasi(db);
    expect(versiSkema(db)).toBe(VERSI_SKEMA);
    const tabel = db.selectValues("select name from sqlite_schema where type = 'table' order by name");
    expect(tabel).toEqual(['item_transaksi', 'pengaturan_toko', 'produk', 'status_backup', 'transaksi']);
  });

  it('aman dijalankan ulang (tiap app dibuka)', async () => {
    const db = await buatDbUji();
    expect(() => jalankanMigrasi(db)).not.toThrow();
    expect(versiSkema(db)).toBe(VERSI_SKEMA);
  });

  it('hanya menjalankan migrasi yang belum pernah jalan', async () => {
    const db = await buatDbUji({ migrasi: false });
    jalankanMigrasi(db, ['create table a (x integer)']);
    jalankanMigrasi(db, ['create table a (x integer)', 'create table b (y integer)']);
    expect(versiSkema(db)).toBe(2);
    expect(db.selectValues("select name from sqlite_schema where type = 'table' order by name")).toEqual(['a', 'b']);
  });

  it('migrasi yang gagal di tengah tidak meninggalkan DB setengah jadi', async () => {
    const db = await buatDbUji({ migrasi: false });
    expect(() => jalankanMigrasi(db, ['create table a (x integer); ini bukan sql'])).toThrow();
    expect(versiSkema(db)).toBe(0);
    expect(db.selectValue("select count(*) from sqlite_schema where name = 'a'")).toBe(0);
  });

  it('menolak DB dari versi aplikasi yang lebih baru', async () => {
    const db = await buatDbUji({ migrasi: false });
    db.exec(`PRAGMA user_version = ${VERSI_SKEMA + 1}`);
    expect(() => jalankanMigrasi(db)).toThrow(VersiDbTerlaluBaruError);
  });
});
