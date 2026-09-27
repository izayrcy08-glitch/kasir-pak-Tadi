import type { Database } from '@sqlite.org/sqlite-wasm';
import { beforeEach, describe, expect, it } from 'vitest';
import { buatDbUji } from '../ujiDb';
import { ambilStatusBackup, catatBackup } from './backup';
import type { Ketergantungan } from './ketergantungan';

function depPada(ms: number): Ketergantungan {
  return { sekarang: () => new Date(ms), buatId: () => 'x' };
}

describe('operasi status backup', () => {
  let db: Database;
  beforeEach(async () => {
    db = await buatDbUji();
  });

  it('DB baru: belum pernah backup, tidak ada data', () => {
    expect(ambilStatusBackup(db)).toEqual({ terakhirBackupPada: null, adaData: false });
  });

  it('adaData true begitu ada produk', () => {
    db.exec(`INSERT INTO produk (id, nama, kategori, harga_beli, harga_jual, stok, satuan, dibuat_pada, diperbarui_pada)
             VALUES ('p1', 'Busi', 'Mesin', 1, 2, 1, 'pcs', 0, 0)`);
    expect(ambilStatusBackup(db).adaData).toBe(true);
  });

  it('catatBackup menyimpan lalu memperbarui waktu backup terakhir', () => {
    catatBackup(db, depPada(1000));
    expect(ambilStatusBackup(db).terakhirBackupPada).toBe(1000);
    catatBackup(db, depPada(2000));
    expect(ambilStatusBackup(db).terakhirBackupPada).toBe(2000);
  });
});
