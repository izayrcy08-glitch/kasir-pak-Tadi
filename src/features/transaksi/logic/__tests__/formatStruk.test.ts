import { describe, expect, it } from 'vitest';
import { formatStruk } from '../formatStruk';

describe('formatStruk', () => {
  it('menyertakan item, total, dan field tunai saat metode tunai', () => {
    const teks = formatStruk({
      transaksiId: 'abc123',
      item: [
        { produkId: 'p1', nama: 'Busi NGK Iridium', hargaSatuan: 35000, qty: 1, subtotalItem: 35000 },
      ],
      ringkasan: { subtotal: 35000, totalDiskon: 0, total: 35000 },
      diskon: null,
      metodeBayar: 'tunai',
      dibayar: 50000,
      kembalian: 15000,
      dibuatPada: new Date(2026, 0, 1, 10, 0, 0),
    });

    expect(teks).toContain('Busi NGK Iridium');
    expect(teks).toContain('Dibayar');
    expect(teks).toContain('Kembalian');
    expect(teks).toContain('abc123');
  });

  it('tidak menampilkan field dibayar/kembalian untuk QRIS/Transfer', () => {
    const teks = formatStruk({
      transaksiId: 'xyz789',
      item: [{ produkId: 'p1', nama: 'Oli Mesin', hargaSatuan: 58000, qty: 1, subtotalItem: 58000 }],
      ringkasan: { subtotal: 58000, totalDiskon: 0, total: 58000 },
      diskon: null,
      metodeBayar: 'qris_transfer',
      dibuatPada: new Date(2026, 0, 1, 10, 0, 0),
    });

    expect(teks).not.toContain('Dibayar');
    expect(teks).not.toContain('Kembalian');
    expect(teks).toContain('QRIS/Transfer');
  });

  it('menampilkan baris diskon hanya kalau diskon diterapkan', () => {
    const teks = formatStruk({
      transaksiId: 'd1',
      item: [{ produkId: 'p1', nama: 'X', hargaSatuan: 10000, qty: 1, subtotalItem: 10000 }],
      ringkasan: { subtotal: 10000, totalDiskon: 2000, total: 8000 },
      diskon: { tipe: 'nominal', nilai: 2000 },
      metodeBayar: 'tunai',
      dibayar: 8000,
      kembalian: 0,
      dibuatPada: new Date(2026, 0, 1, 10, 0, 0),
    });

    expect(teks).toContain('Diskon');
  });
});
