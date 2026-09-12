import type { Timestamp } from 'firebase/firestore';
import type { MetodeBayar } from './transaksi';

// Bentuk baca dokumen agregat harian yang ditulis `transaksi.repo.ts`
// (buildAgregatUpdate) — satu dokumen per hari, id = idHariIni() ('YYYY-MM-DD').
// Fitur Laporan hanya membaca skema ini, tidak pernah menulis/mengubahnya.
export interface AgregatLaporanHarian {
  tanggal: string;
  omzet: number;
  jumlahTransaksi: number;
  omzetPerMetode: Partial<Record<MetodeBayar, number>>;
  jumlahTransaksiPerMetode: Partial<Record<MetodeBayar, number>>;
  qtyTerjualPerProduk: Record<string, number>;
  namaProdukPerId: Record<string, string>;
  diperbaruiPada: Timestamp;
}
