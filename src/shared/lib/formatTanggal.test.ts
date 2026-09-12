import { describe, expect, it } from 'vitest';
import { formatRentangTanggal, formatTanggalPendek, formatWaktu } from './formatTanggal';

describe('formatTanggalPendek', () => {
  it('memformat tanggal ala "11 Sep 2026"', () => {
    expect(formatTanggalPendek(new Date(2026, 8, 11))).toBe('11 Sep 2026');
  });
});

describe('formatWaktu', () => {
  it('zero-pad jam dan menit tengah malam', () => {
    expect(formatWaktu(new Date(2026, 8, 11, 0, 0))).toBe('00:00');
  });

  it('zero-pad jam satu digit', () => {
    expect(formatWaktu(new Date(2026, 8, 11, 9, 5))).toBe('09:05');
  });

  it('menampilkan jam mendekati tengah malam dengan benar', () => {
    expect(formatWaktu(new Date(2026, 8, 11, 23, 59))).toBe('23:59');
  });
});

describe('formatRentangTanggal', () => {
  it('rentang dalam bulan yang sama hanya menampilkan tanggal awal, bukan bulan/tahun ganda', () => {
    expect(formatRentangTanggal(new Date(2026, 8, 1), new Date(2026, 8, 11))).toBe('1 – 11 Sep 2026');
  });

  it('rentang lintas bulan menampilkan tanggal lengkap di kedua sisi', () => {
    expect(formatRentangTanggal(new Date(2026, 7, 28), new Date(2026, 8, 3))).toBe('28 Agu 2026 – 3 Sep 2026');
  });

  it('rentang lintas tahun menampilkan tahun di kedua sisi', () => {
    expect(formatRentangTanggal(new Date(2025, 11, 29), new Date(2026, 0, 4))).toBe('29 Des 2025 – 4 Jan 2026');
  });
});
