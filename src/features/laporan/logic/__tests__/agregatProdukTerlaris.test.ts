import { describe, expect, it } from 'vitest';
import type { AgregatLaporanHarian } from '../../../../shared/types/agregatLaporan';
import { agregatProdukTerlaris } from '../agregatProdukTerlaris';

function dokumen(parsial: Partial<AgregatLaporanHarian> & { tanggal: string }): AgregatLaporanHarian {
  return {
    omzet: 0,
    jumlahTransaksi: 0,
    omzetPerMetode: {},
    jumlahTransaksiPerMetode: {},
    qtyTerjualPerProduk: {},
    namaProdukPerId: {},
    ...parsial,
  };
}

describe('agregatProdukTerlaris', () => {
  it('array kosong menghasilkan array kosong', () => {
    expect(agregatProdukTerlaris([])).toEqual([]);
  });

  it('menjumlahkan qty lintas dokumen per produkId', () => {
    const dokumenA = dokumen({
      tanggal: '2026-09-10',
      qtyTerjualPerProduk: { p1: 3 },
      namaProdukPerId: { p1: 'Oli Mesin 1L' },
    });
    const dokumenB = dokumen({
      tanggal: '2026-09-11',
      qtyTerjualPerProduk: { p1: 2 },
      namaProdukPerId: { p1: 'Oli Mesin 1L' },
    });

    expect(agregatProdukTerlaris([dokumenA, dokumenB])).toEqual([{ produkId: 'p1', nama: 'Oli Mesin 1L', qty: 5 }]);
  });

  it('urut qty menurun, tie-break nama menaik', () => {
    const d = dokumen({
      tanggal: '2026-09-10',
      qtyTerjualPerProduk: { p1: 5, p2: 10, p3: 5 },
      namaProdukPerId: { p1: 'Zebra', p2: 'Kampas Rem', p3: 'Aki Kering' },
    });

    expect(agregatProdukTerlaris([d]).map((p) => p.produkId)).toEqual(['p2', 'p3', 'p1']);
  });

  it('memotong hasil ke limit', () => {
    const d = dokumen({
      tanggal: '2026-09-10',
      qtyTerjualPerProduk: { p1: 1, p2: 2, p3: 3 },
      namaProdukPerId: { p1: 'A', p2: 'B', p3: 'C' },
    });

    expect(agregatProdukTerlaris([d], 2)).toHaveLength(2);
  });

  it('nama diambil dari dokumen dengan tanggal terbesar saat nama produk berubah', () => {
    const lama = dokumen({
      tanggal: '2026-09-01',
      qtyTerjualPerProduk: { p1: 1 },
      namaProdukPerId: { p1: 'Nama Lama' },
    });
    const baru = dokumen({
      tanggal: '2026-09-15',
      qtyTerjualPerProduk: { p1: 1 },
      namaProdukPerId: { p1: 'Nama Baru' },
    });

    // Sengaja dikirim dengan urutan array tidak berurutan tanggal, untuk
    // membuktikan pemilihan nama tidak bergantung pada urutan input.
    const hasil = agregatProdukTerlaris([baru, lama]);
    expect(hasil[0].nama).toBe('Nama Baru');
  });

  it('produk yang sudah dihapus dari koleksi produk tetap tampil pakai nama snapshot', () => {
    const d = dokumen({
      tanggal: '2026-09-10',
      qtyTerjualPerProduk: { 'produk-terhapus': 4 },
      namaProdukPerId: { 'produk-terhapus': 'Filter Udara (lama)' },
    });

    expect(agregatProdukTerlaris([d])).toEqual([
      { produkId: 'produk-terhapus', nama: 'Filter Udara (lama)', qty: 4 },
    ]);
  });
});
