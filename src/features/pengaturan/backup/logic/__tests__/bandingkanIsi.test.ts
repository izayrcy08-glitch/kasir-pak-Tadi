import { describe, expect, it } from 'vitest';
import { adaTransaksiLebihBaru } from '../bandingkanIsi';

const isi = (transaksiTerakhirPada: number | null) => ({ transaksiTerakhirPada });

describe('adaTransaksiLebihBaru', () => {
  it('a kosong tidak pernah lebih baru', () => {
    expect(adaTransaksiLebihBaru(isi(null), isi(null))).toBe(false);
    expect(adaTransaksiLebihBaru(isi(null), isi(100))).toBe(false);
  });

  it('a punya transaksi, b kosong → lebih baru', () => {
    expect(adaTransaksiLebihBaru(isi(100), isi(null))).toBe(true);
  });

  it('membandingkan waktu transaksi terakhir; sama persis bukan lebih baru', () => {
    expect(adaTransaksiLebihBaru(isi(200), isi(100))).toBe(true);
    expect(adaTransaksiLebihBaru(isi(100), isi(200))).toBe(false);
    expect(adaTransaksiLebihBaru(isi(100), isi(100))).toBe(false);
  });
});
