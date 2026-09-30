import { describe, expect, it } from 'vitest';
import type { Produk } from '../../../../shared/types/produk';
import { cariProduk } from '../cariProduk';

function produk(override: Partial<Produk> & { id: string; nama: string }): Produk {
  return {
    kategori: 'Umum',
    hargaBeli: 0,
    hargaJual: 1000,
    stok: 10,
    satuan: 'pcs',
    dibuatPada: 0,
    diperbaruiPada: 0,
    ...override,
  };
}

const daftar: Produk[] = [
  produk({ id: 'c7', nama: 'Busi NGK C7HSA', kodePart: 'BS-C7HSA', kategori: 'Busi', kompatibilitas: 'Supra, Revo' }),
  produk({ id: 'cpr', nama: 'Busi NGK CPR9EA-9', kodePart: 'BS-CPR9', kategori: 'Busi', kompatibilitas: 'Vario, Beat' }),
  produk({ id: 'kr', nama: 'Kampas Rem Depan Beat', kodePart: 'KR-BEAT-D', kategori: 'Kampas Rem', kompatibilitas: 'Beat' }),
  produk({ id: 'ol', nama: 'Oli Gardan Matic', kodePart: 'OL-GRD', kategori: 'Oli & Pelumas', stok: 0 }),
  produk({ id: 'ol2', nama: 'Oli Mesin Matic', kodePart: 'OL-MTC', kategori: 'Oli & Pelumas' }),
];

const id = (hasil: Produk[]) => hasil.map((p) => p.id);

describe('cariProduk', () => {
  it('kata kunci kosong → semua produk urut nama, stok habis paling bawah', () => {
    expect(id(cariProduk(daftar, ''))).toEqual(['c7', 'cpr', 'kr', 'ol2', 'ol']);
    expect(id(cariProduk(daftar, '   '))).toEqual(['c7', 'cpr', 'kr', 'ol2', 'ol']);
  });

  it('beberapa kata: semua harus cocok, boleh di kolom berbeda (nama + kompatibilitas)', () => {
    expect(id(cariProduk(daftar, 'busi beat'))).toEqual(['cpr']);
    expect(id(cariProduk(daftar, 'BEAT'))).toEqual(['kr', 'cpr']);
  });

  it('kode part cocok tanpa tanda baca & kode persis paling atas', () => {
    expect(id(cariProduk(daftar, 'c7hsa'))).toEqual(['c7']);
    expect(id(cariProduk(daftar, 'bs c7'))).toEqual(['c7']);
    expect(id(cariProduk(daftar, 'BS-CPR9'))[0]).toBe('cpr');
  });

  it('bisa mencari lewat kategori', () => {
    expect(id(cariProduk(daftar, 'kampas'))).toEqual(['kr']);
  });

  it('stok habis selalu paling bawah', () => {
    expect(id(cariProduk(daftar, 'oli'))).toEqual(['ol2', 'ol']);
  });

  it('nama diawali kata kunci di atas yang hanya memuat kata itu', () => {
    const d = [produk({ id: 'b', nama: 'Filter Oli' }), produk({ id: 'a', nama: 'Oli Samping' })];
    expect(id(cariProduk(d, 'oli'))).toEqual(['a', 'b']);
  });
});
