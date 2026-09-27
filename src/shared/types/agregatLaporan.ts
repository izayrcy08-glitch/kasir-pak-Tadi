import type { MetodeBayar } from './transaksi';

// Ringkasan penjualan satu hari (tanggal = idHariIni(), 'YYYY-MM-DD').
// Dihitung dengan SQL dari tabel transaksi + item_transaksi
// (shared/db/operasi/laporan.ts) — hari tanpa transaksi tidak muncul.
// Bentuknya dipertahankan dari era Firestore supaya logic/ Laporan tetap sama.
export interface AgregatLaporanHarian {
  tanggal: string;
  omzet: number;
  jumlahTransaksi: number;
  omzetPerMetode: Partial<Record<MetodeBayar, number>>;
  jumlahTransaksiPerMetode: Partial<Record<MetodeBayar, number>>;
  qtyTerjualPerProduk: Record<string, number>;
  namaProdukPerId: Record<string, string>;
}
