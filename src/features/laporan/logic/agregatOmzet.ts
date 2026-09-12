import type { AgregatLaporanHarian } from '../../../shared/types/agregatLaporan';
import type { MetodeBayar } from '../../../shared/types/transaksi';

export interface RingkasanOmzet {
  omzet: number;
  jumlahTransaksi: number;
  omzetPerMetode: Record<MetodeBayar, number>;
  jumlahTransaksiPerMetode: Record<MetodeBayar, number>;
}

// Menjumlahkan beberapa dokumen agregat harian jadi satu ringkasan — dipakai
// berulang untuk KPI tetap (hari/minggu/bulan) maupun breakdown metode bayar
// pada rentang filter yang dipilih user, dengan subset dokumen yang berbeda.
export function agregatOmzet(dokumen: AgregatLaporanHarian[]): RingkasanOmzet {
  const hasil: RingkasanOmzet = {
    omzet: 0,
    jumlahTransaksi: 0,
    omzetPerMetode: { tunai: 0, qris_transfer: 0 },
    jumlahTransaksiPerMetode: { tunai: 0, qris_transfer: 0 },
  };

  for (const d of dokumen) {
    hasil.omzet += d.omzet;
    hasil.jumlahTransaksi += d.jumlahTransaksi;
    hasil.omzetPerMetode.tunai += d.omzetPerMetode.tunai ?? 0;
    hasil.omzetPerMetode.qris_transfer += d.omzetPerMetode.qris_transfer ?? 0;
    hasil.jumlahTransaksiPerMetode.tunai += d.jumlahTransaksiPerMetode.tunai ?? 0;
    hasil.jumlahTransaksiPerMetode.qris_transfer += d.jumlahTransaksiPerMetode.qris_transfer ?? 0;
  }

  return hasil;
}
