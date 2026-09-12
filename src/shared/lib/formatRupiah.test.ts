import { describe, expect, it } from 'vitest';
import { formatRupiah } from './formatRupiah';

// Intl.NumberFormat menyisipkan non-breaking space (U+00A0) antara "Rp" dan
// angka, bukan spasi biasa — dibentuk lewat fromCharCode supaya eksplisit.
const NBSP = String.fromCharCode(0xa0);

describe('formatRupiah', () => {
  it('memformat angka bulat sebagai Rupiah tanpa desimal', () => {
    expect(formatRupiah(15000)).toBe(`Rp${NBSP}15.000`);
  });

  it('memformat nol sebagai Rp 0', () => {
    expect(formatRupiah(0)).toBe(`Rp${NBSP}0`);
  });
});
