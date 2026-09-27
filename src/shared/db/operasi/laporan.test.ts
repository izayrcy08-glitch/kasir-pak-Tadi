import type { Database } from '@sqlite.org/sqlite-wasm';
import { beforeEach, describe, expect, it } from 'vitest';
import { agregatOmzet } from '../../../features/laporan/logic/agregatOmzet';
import { agregatProdukTerlaris } from '../../../features/laporan/logic/agregatProdukTerlaris';
import type { TransaksiDraft } from '../../types/transaksi';
import { buatDbUji } from '../ujiDb';
import { ambilAgregatRentang } from './laporan';
import { tambahProduk, updateProduk } from './produk';
import { simpanTransaksi } from './transaksi';

const dasarProduk = { kategori: 'Umum', hargaBeli: 0, stok: 100, satuan: 'pcs' as const };

describe('ambilAgregatRentang', () => {
  let db: Database;
  let n = 0;
  const jual = (waktu: Date, draft: TransaksiDraft) =>
    simpanTransaksi(db, draft, { sekarang: () => waktu, buatId: () => `t${++n}` });

  beforeEach(async () => {
    db = await buatDbUji();
    tambahProduk(db, { ...dasarProduk, nama: 'Busi', hargaJual: 15000 }, { sekarang: () => new Date(0), buatId: () => 'busi' });
    tambahProduk(db, { ...dasarProduk, nama: 'Oli', hargaJual: 50000 }, { sekarang: () => new Date(0), buatId: () => 'oli' });
  });

  it('kosong kalau tidak ada transaksi', () => {
    expect(ambilAgregatRentang(db, '2026-09-01', '2026-09-30')).toEqual([]);
  });

  it('meringkas omzet, metode bayar & qty per hari, hanya dalam rentang', () => {
    jual(new Date(2026, 8, 26, 10), { item: [{ produkId: 'oli', qty: 1 }], diskon: null, metodeBayar: 'qris_transfer' });
    jual(new Date(2026, 8, 27, 9), { item: [{ produkId: 'busi', qty: 2 }], diskon: null, metodeBayar: 'tunai', dibayar: 30000 });
    jual(new Date(2026, 8, 27, 11), {
      item: [
        { produkId: 'busi', qty: 1 },
        { produkId: 'oli', qty: 1 },
      ],
      diskon: { tipe: 'nominal', nilai: 5000 },
      metodeBayar: 'qris_transfer',
    });
    jual(new Date(2026, 8, 28, 8), { item: [{ produkId: 'oli', qty: 3 }], diskon: null, metodeBayar: 'qris_transfer' });

    expect(ambilAgregatRentang(db, '2026-09-26', '2026-09-27')).toEqual([
      {
        tanggal: '2026-09-26',
        omzet: 50000,
        jumlahTransaksi: 1,
        omzetPerMetode: { qris_transfer: 50000 },
        jumlahTransaksiPerMetode: { qris_transfer: 1 },
        qtyTerjualPerProduk: { oli: 1 },
        namaProdukPerId: { oli: 'Oli' },
      },
      {
        tanggal: '2026-09-27',
        omzet: 30000 + 60000,
        jumlahTransaksi: 2,
        omzetPerMetode: { tunai: 30000, qris_transfer: 60000 },
        jumlahTransaksiPerMetode: { tunai: 1, qris_transfer: 1 },
        qtyTerjualPerProduk: { busi: 3, oli: 1 },
        namaProdukPerId: { busi: 'Busi', oli: 'Oli' },
      },
    ]);
  });

  it('nama produk = snapshot transaksi terakhir hari itu (produk diganti nama di tengah hari)', () => {
    jual(new Date(2026, 8, 27, 9), { item: [{ produkId: 'busi', qty: 1 }], diskon: null, metodeBayar: 'qris_transfer' });
    updateProduk(db, 'busi', { ...dasarProduk, nama: 'Busi NGK', hargaJual: 15000 }, { sekarang: () => new Date(0), buatId: () => '' });
    jual(new Date(2026, 8, 27, 15), { item: [{ produkId: 'busi', qty: 1 }], diskon: null, metodeBayar: 'qris_transfer' });

    const [hari] = ambilAgregatRentang(db, '2026-09-27', '2026-09-27');
    expect(hari.namaProdukPerId.busi).toBe('Busi NGK');
    expect(hari.qtyTerjualPerProduk.busi).toBe(2);
  });

  it('hasilnya langsung bisa dipakai logic Laporan yang sudah ada', () => {
    jual(new Date(2026, 8, 27, 9), { item: [{ produkId: 'busi', qty: 4 }], diskon: null, metodeBayar: 'tunai', dibayar: 60000 });
    jual(new Date(2026, 8, 28, 9), { item: [{ produkId: 'oli', qty: 1 }], diskon: null, metodeBayar: 'qris_transfer' });
    const hari = ambilAgregatRentang(db, '2026-09-01', '2026-09-30');

    expect(agregatOmzet(hari)).toMatchObject({ omzet: 110000, jumlahTransaksi: 2 });
    expect(agregatProdukTerlaris(hari)).toEqual([
      { produkId: 'busi', nama: 'Busi', qty: 4 },
      { produkId: 'oli', nama: 'Oli', qty: 1 },
    ]);
  });
});
