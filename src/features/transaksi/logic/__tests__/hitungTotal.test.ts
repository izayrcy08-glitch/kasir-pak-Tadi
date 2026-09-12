import { describe, expect, it } from 'vitest';
import { hitungTotal } from '../hitungTotal';

describe('hitungTotal', () => {
  it('keranjang kosong menghasilkan semua nol', () => {
    expect(hitungTotal([], null)).toEqual({ subtotal: 0, totalDiskon: 0, total: 0 });
  });

  it('menjumlahkan beberapa item sesuai qty x harga (contoh dari mockup)', () => {
    const item = [
      { hargaSatuan: 45000, qty: 2 },
      { hargaSatuan: 58000, qty: 1 },
      { hargaSatuan: 35000, qty: 1 },
    ];
    expect(hitungTotal(item, null)).toEqual({ subtotal: 183000, totalDiskon: 0, total: 183000 });
  });

  it('diskon null tidak mengubah total', () => {
    const item = [{ hargaSatuan: 100000, qty: 1 }];
    const hasil = hitungTotal(item, null);
    expect(hasil.totalDiskon).toBe(0);
    expect(hasil.total).toBe(hasil.subtotal);
  });

  it('diskon nominal melebihi subtotal membuat total 0, tidak minus', () => {
    const item = [{ hargaSatuan: 20000, qty: 1 }];
    expect(hitungTotal(item, { tipe: 'nominal', nilai: 999999 })).toEqual({
      subtotal: 20000,
      totalDiskon: 20000,
      total: 0,
    });
  });

  it('diskon persen dengan pembulatan diterapkan ke total', () => {
    const item = [{ hargaSatuan: 33333, qty: 1 }];
    expect(hitungTotal(item, { tipe: 'persen', nilai: 15 })).toEqual({
      subtotal: 33333,
      totalDiskon: 5000,
      total: 28333,
    });
  });
});
