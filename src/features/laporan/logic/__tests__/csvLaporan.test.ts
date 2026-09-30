import { describe, expect, it } from 'vitest';
import type { Transaksi } from '../../../../shared/types/transaksi';
import { buatCsvLaporan, namaBerkasCsv } from '../csvLaporan';

function transaksi(parsial: Partial<Transaksi> & { dibuatPada: number }): Transaksi {
  return {
    id: 't1',
    item: [],
    subtotal: 0,
    diskon: null,
    totalDiskon: 0,
    total: 0,
    metodeBayar: 'tunai',
    ...parsial,
  };
}

const item = (nama: string, qty: number, hargaSatuan = 1000) => ({
  produkId: nama,
  nama,
  hargaSatuan,
  qty,
  subtotalItem: hargaSatuan * qty,
});

// Baris data tanpa BOM & tanpa baris judul.
function barisData(csv: string): string[] {
  return csv.slice(1).split('\r\n').slice(1, -1);
}

describe('buatCsvLaporan', () => {
  it('diawali BOM + baris judul, diakhiri baris baru', () => {
    const csv = buatCsvLaporan([]);
    expect(csv).toBe('﻿Tanggal;Jam;Metode Bayar;Barang;Subtotal;Diskon;Total\r\n');
  });

  it('satu baris per transaksi, tanggal & jam lokal, uang angka polos', () => {
    const csv = buatCsvLaporan([
      transaksi({
        dibuatPada: new Date(2026, 8, 30, 9, 5).getTime(),
        item: [item('Oli Mesin 1L', 2, 55000), item('Busi NGK', 1, 25000)],
        subtotal: 135000,
        diskon: { tipe: 'nominal', nilai: 10000 },
        totalDiskon: 10000,
        total: 125000,
      }),
      transaksi({
        dibuatPada: new Date(2026, 9, 1, 23, 59).getTime(),
        item: [item('Kampas Rem', 1, 40000)],
        subtotal: 40000,
        total: 40000,
        metodeBayar: 'qris_transfer',
      }),
    ]);
    expect(barisData(csv)).toEqual([
      '2026-09-30;09:05;Tunai;Oli Mesin 1L x2, Busi NGK x1;135000;10000;125000',
      '2026-10-01;23:59;QRIS;Kampas Rem x1;40000;0;40000',
    ]);
  });

  it('nama berisi titik koma / kutip dibungkus kutip ganda', () => {
    const csv = buatCsvLaporan([
      transaksi({ dibuatPada: new Date(2026, 8, 30).getTime(), item: [item('Baut 8"; M10', 3)] }),
    ]);
    expect(barisData(csv)[0]).toBe('2026-09-30;00:00;Tunai;"Baut 8""; M10 x3";0;0;0');
  });

  it('teks yang bisa dibaca Excel sebagai rumus diberi awalan kutip tunggal', () => {
    for (const nama of ['=HYPERLINK("x")', '+62 Kabel', '-Seal', '@Ring']) {
      const csv = buatCsvLaporan([transaksi({ dibuatPada: 0, item: [item(nama, 1)] })]);
      const sel = barisData(csv)[0]!.split(';')[3]!;
      expect(sel.replace(/^"/, '').startsWith(`'${nama.slice(0, 1)}`)).toBe(true);
    }
  });
});

describe('namaBerkasCsv', () => {
  it('rentang beberapa hari', () => {
    expect(namaBerkasCsv(new Date(2026, 8, 1), new Date(2026, 8, 30, 23, 59))).toBe(
      'laporan-penjualan-2026-09-01-sd-2026-09-30.csv',
    );
  });

  it('satu hari cukup satu tanggal', () => {
    expect(namaBerkasCsv(new Date(2026, 8, 30), new Date(2026, 8, 30, 23, 59))).toBe('laporan-penjualan-2026-09-30.csv');
  });
});
