import { describe, expect, it } from 'vitest';
import { idHariIni } from './idHariIni';

describe('idHariIni', () => {
  it('memformat tanggal sebagai YYYY-MM-DD', () => {
    expect(idHariIni(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('zero-pad bulan dan tanggal satu digit', () => {
    expect(idHariIni(new Date(2026, 8, 9))).toBe('2026-09-09');
  });

  it('tidak zero-pad tahun & benar untuk akhir tahun', () => {
    expect(idHariIni(new Date(2025, 11, 31))).toBe('2025-12-31');
  });
});
