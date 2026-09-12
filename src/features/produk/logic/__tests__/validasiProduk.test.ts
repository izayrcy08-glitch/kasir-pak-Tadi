import { describe, expect, it } from 'vitest';
import { validasiProduk } from '../validasiProduk';
import type { ProdukInput } from '../../../../shared/types/produk';

const produkValid: ProdukInput = {
  nama: 'Kampas Rem Depan — Beat',
  kategori: 'Kampas Rem',
  hargaBeli: 32000,
  hargaJual: 45000,
  stok: 24,
  satuan: 'pcs',
};

describe('validasiProduk', () => {
  it('meloloskan produk dengan field lengkap dan valid', () => {
    const hasil = validasiProduk(produkValid);
    expect(hasil.valid).toBe(true);
    expect(hasil.error).toEqual({});
  });

  it('menolak nama kosong', () => {
    const hasil = validasiProduk({ ...produkValid, nama: '  ' });
    expect(hasil.valid).toBe(false);
    expect(hasil.error.nama).toBeDefined();
  });

  it('menolak harga beli negatif', () => {
    const hasil = validasiProduk({ ...produkValid, hargaBeli: -1000 });
    expect(hasil.valid).toBe(false);
    expect(hasil.error.hargaBeli).toBeDefined();
  });

  it('menolak stok pecahan atau negatif', () => {
    expect(validasiProduk({ ...produkValid, stok: -1 }).valid).toBe(false);
    expect(validasiProduk({ ...produkValid, stok: 1.5 }).valid).toBe(false);
  });

  it('menolak kategori kosong', () => {
    const hasil = validasiProduk({ ...produkValid, kategori: '' });
    expect(hasil.valid).toBe(false);
    expect(hasil.error.kategori).toBeDefined();
  });
});
