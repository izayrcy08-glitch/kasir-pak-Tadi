import { describe, expect, it } from 'vitest';
import { filterProduk } from '../filterProduk';
import type { Produk } from '../../../../shared/types/produk';

function buatProduk(override: Partial<Produk>): Produk {
  return {
    id: 'x',
    nama: 'Produk',
    kategori: 'Umum',
    hargaBeli: 0,
    hargaJual: 0,
    stok: 0,
    satuan: 'pcs',
    dibuatPada: null,
    diperbaruiPada: null,
    ...override,
  } as unknown as Produk;
}

const daftar: Produk[] = [
  buatProduk({ id: '1', nama: 'Kampas Rem Depan — Beat', kodePart: 'KRD-014', kategori: 'Kampas Rem' }),
  buatProduk({ id: '2', nama: 'Oli Mesin 1L — Shell Advance', kodePart: 'OMS-001', kategori: 'Oli' }),
  buatProduk({ id: '3', nama: 'Busi NGK Iridium', kodePart: 'BSN-220', kategori: 'Busi' }),
];

describe('filterProduk', () => {
  it('mengembalikan semua produk kalau kata kunci kosong dan kategori Semua', () => {
    expect(filterProduk(daftar, '', 'Semua')).toHaveLength(3);
  });

  it('memfilter by nama, tidak case-sensitive', () => {
    const hasil = filterProduk(daftar, 'kampas', 'Semua');
    expect(hasil.map((p) => p.id)).toEqual(['1']);
  });

  it('memfilter by kode part', () => {
    const hasil = filterProduk(daftar, 'oms-001', 'Semua');
    expect(hasil.map((p) => p.id)).toEqual(['2']);
  });

  it('memfilter by kategori', () => {
    const hasil = filterProduk(daftar, '', 'Busi');
    expect(hasil.map((p) => p.id)).toEqual(['3']);
  });

  it('menggabungkan filter kategori dan kata kunci', () => {
    expect(filterProduk(daftar, 'oli', 'Busi')).toHaveLength(0);
  });
});
