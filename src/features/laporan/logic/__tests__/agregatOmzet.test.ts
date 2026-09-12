import { describe, expect, it } from 'vitest';
import type { AgregatLaporanHarian } from '../../../../shared/types/agregatLaporan';
import { agregatOmzet } from '../agregatOmzet';

function dokumen(parsial: Partial<AgregatLaporanHarian> & { tanggal: string }): AgregatLaporanHarian {
  return {
    omzet: 0,
    jumlahTransaksi: 0,
    omzetPerMetode: {},
    jumlahTransaksiPerMetode: {},
    qtyTerjualPerProduk: {},
    namaProdukPerId: {},
    // Nilai dummy, tidak dipakai logic ini.
    diperbaruiPada: null as never,
    ...parsial,
  };
}

describe('agregatOmzet', () => {
  it('array kosong menghasilkan semua nol', () => {
    expect(agregatOmzet([])).toEqual({
      omzet: 0,
      jumlahTransaksi: 0,
      omzetPerMetode: { tunai: 0, qris_transfer: 0 },
      jumlahTransaksiPerMetode: { tunai: 0, qris_transfer: 0 },
    });
  });

  it('menjumlahkan omzet & jumlah transaksi lintas beberapa dokumen', () => {
    const dokumenA = dokumen({
      tanggal: '2026-09-10',
      omzet: 100000,
      jumlahTransaksi: 2,
      omzetPerMetode: { tunai: 100000 },
      jumlahTransaksiPerMetode: { tunai: 2 },
    });
    const dokumenB = dokumen({
      tanggal: '2026-09-11',
      omzet: 50000,
      jumlahTransaksi: 1,
      omzetPerMetode: { qris_transfer: 50000 },
      jumlahTransaksiPerMetode: { qris_transfer: 1 },
    });

    expect(agregatOmzet([dokumenA, dokumenB])).toEqual({
      omzet: 150000,
      jumlahTransaksi: 3,
      omzetPerMetode: { tunai: 100000, qris_transfer: 50000 },
      jumlahTransaksiPerMetode: { tunai: 2, qris_transfer: 1 },
    });
  });

  it('metode yang tidak muncul di sebagian dokumen default ke 0, bukan NaN', () => {
    const hanyaTunai = dokumen({
      tanggal: '2026-09-10',
      omzet: 100000,
      jumlahTransaksi: 1,
      omzetPerMetode: { tunai: 100000 },
      jumlahTransaksiPerMetode: { tunai: 1 },
    });

    const hasil = agregatOmzet([hanyaTunai]);
    expect(hasil.omzetPerMetode.qris_transfer).toBe(0);
    expect(hasil.jumlahTransaksiPerMetode.qris_transfer).toBe(0);
  });
});
