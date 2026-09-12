import { describe, expect, it } from 'vitest';
import { hitungKembalian } from '../hitungKembalian';

describe('hitungKembalian', () => {
  it('menghitung kembalian sesuai contoh mockup', () => {
    expect(hitungKembalian(173000, 200000)).toBe(27000);
  });

  it('dibayar pas menghasilkan kembalian 0', () => {
    expect(hitungKembalian(50000, 50000)).toBe(0);
  });

  it('kurang bayar menghasilkan nilai negatif (caller wajib menganggap belum bisa dibayar)', () => {
    expect(hitungKembalian(50000, 30000)).toBe(-20000);
  });

  it('dibayar 0 (belum diisi) menghasilkan -total', () => {
    expect(hitungKembalian(50000, 0)).toBe(-50000);
  });
});
