import type { ProdukInput } from '../../../shared/types/produk';

export interface HasilValidasiProduk {
  valid: boolean;
  error: Partial<Record<keyof ProdukInput, string>>;
}

export function validasiProduk(input: ProdukInput): HasilValidasiProduk {
  const error: Partial<Record<keyof ProdukInput, string>> = {};

  if (!input.nama.trim()) {
    error.nama = 'Nama produk wajib diisi';
  }
  if (!input.kategori.trim()) {
    error.kategori = 'Kategori wajib diisi';
  }
  if (!input.satuan) {
    error.satuan = 'Satuan wajib dipilih';
  }
  if (!Number.isFinite(input.hargaBeli) || input.hargaBeli < 0) {
    error.hargaBeli = 'Harga beli tidak boleh negatif';
  }
  if (!Number.isFinite(input.hargaJual) || input.hargaJual < 0) {
    error.hargaJual = 'Harga jual tidak boleh negatif';
  }
  if (!Number.isInteger(input.stok) || input.stok < 0) {
    error.stok = 'Stok harus bilangan bulat, tidak boleh negatif';
  }

  return { valid: Object.keys(error).length === 0, error };
}
