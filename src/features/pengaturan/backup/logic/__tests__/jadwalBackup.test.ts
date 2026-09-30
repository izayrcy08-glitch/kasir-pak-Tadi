import { describe, expect, it } from 'vitest';
import {
  BATAS_HARI_PENGINGAT,
  namaBerkasBackup,
  pengingatDitutupHariIni,
  perluPengingatBackup,
  selisihHariKalender,
} from '../jadwalBackup';

describe('namaBerkasBackup', () => {
  it('memakai tanggal & jam lokal, dua digit', () => {
    expect(namaBerkasBackup(new Date(2026, 0, 5, 7, 3))).toBe('backup-kasir-2026-01-05-0703.sqlite3');
    expect(namaBerkasBackup(new Date(2026, 8, 27, 14, 45))).toBe('backup-kasir-2026-09-27-1445.sqlite3');
  });
});

describe('selisihHariKalender', () => {
  it('menghitung hari kalender, bukan kelipatan 24 jam', () => {
    expect(selisihHariKalender(new Date(2026, 8, 26, 23, 0), new Date(2026, 8, 27, 8, 0))).toBe(1);
    expect(selisihHariKalender(new Date(2026, 8, 27, 1, 0), new Date(2026, 8, 27, 23, 0))).toBe(0);
    expect(selisihHariKalender(new Date(2026, 8, 25), new Date(2026, 9, 2))).toBe(7);
  });
});

describe('perluPengingatBackup', () => {
  const sekarang = new Date(2026, 8, 27, 10, 0);

  it('belum pernah backup: ingatkan hanya kalau sudah ada data', () => {
    expect(perluPengingatBackup({ terakhirBackupPada: null, adaData: true }, sekarang)).toBe(true);
    expect(perluPengingatBackup({ terakhirBackupPada: null, adaData: false }, sekarang)).toBe(false);
  });

  it(`ingatkan mulai ${BATAS_HARI_PENGINGAT} hari setelah backup terakhir`, () => {
    const hariLalu = (n: number) => new Date(2026, 8, 27 - n, 18, 0).getTime();
    expect(perluPengingatBackup({ terakhirBackupPada: hariLalu(0), adaData: true }, sekarang)).toBe(false);
    expect(perluPengingatBackup({ terakhirBackupPada: hariLalu(6), adaData: true }, sekarang)).toBe(false);
    expect(perluPengingatBackup({ terakhirBackupPada: hariLalu(7), adaData: true }, sekarang)).toBe(true);
    expect(perluPengingatBackup({ terakhirBackupPada: hariLalu(30), adaData: true }, sekarang)).toBe(true);
  });
});

describe('pengingatDitutupHariIni', () => {
  it('tersembunyi hanya pada hari kalender yang sama saat ditutup', () => {
    expect(pengingatDitutupHariIni('2026-09-30', new Date(2026, 8, 30, 23, 59))).toBe(true);
    expect(pengingatDitutupHariIni('2026-09-30', new Date(2026, 9, 1, 0, 0))).toBe(false);
    expect(pengingatDitutupHariIni(null, new Date(2026, 8, 30))).toBe(false);
  });
});
