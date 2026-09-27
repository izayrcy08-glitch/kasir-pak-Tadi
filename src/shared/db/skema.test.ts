import type { Database } from '@sqlite.org/sqlite-wasm';
import { beforeEach, describe, expect, it } from 'vitest';
import { buatDbUji } from './ujiDb';

type Baris = Record<string, string | number | null>;

function sisip(db: Database, tabel: string, baris: Baris): void {
  const kolom = Object.keys(baris);
  db.exec({
    sql: `insert into ${tabel} (${kolom.join(', ')}) values (${kolom.map(() => '?').join(', ')})`,
    bind: Object.values(baris),
  });
}

const produkValid: Baris = {
  id: 'p1',
  nama: 'Kampas rem',
  kategori: 'Rem',
  harga_beli: 20000,
  harga_jual: 35000,
  stok: 10,
  satuan: 'pcs',
  dibuat_pada: 0,
  diperbarui_pada: 0,
};

const transaksiValid: Baris = {
  id: 't1',
  subtotal: 70000,
  total_diskon: 0,
  total: 70000,
  metode_bayar: 'tunai',
  dibayar: 100000,
  kembalian: 30000,
  dibuat_pada: 0,
  tanggal_lokal: '2026-09-27',
};

const itemValid: Baris = {
  transaksi_id: 't1',
  urutan: 0,
  produk_id: 'p1',
  nama: 'Kampas rem',
  harga_satuan: 35000,
  qty: 2,
  subtotal_item: 70000,
};

describe('skema v1', () => {
  let db: Database;
  beforeEach(async () => {
    db = await buatDbUji();
  });

  describe('produk', () => {
    it('menerima produk valid', () => {
      expect(() => sisip(db, 'produk', produkValid)).not.toThrow();
    });

    it.each([
      ['stok negatif', { stok: -1 }],
      ['stok pecahan', { stok: 1.5 }],
      ['harga pecahan', { harga_jual: 35000.5 }],
      ['harga negatif', { harga_beli: -1 }],
      ['nama kosong', { nama: '   ' }],
      ['satuan tak dikenal', { satuan: 'kg' }],
    ])('menolak %s', (_, ubah) => {
      expect(() => sisip(db, 'produk', { ...produkValid, ...ubah })).toThrow(/constraint/i);
    });

    it('menolak pengurangan stok sampai minus (pengaman terakhir oversell)', () => {
      sisip(db, 'produk', produkValid);
      expect(() => db.exec("update produk set stok = stok - 11 where id = 'p1'")).toThrow(/constraint/i);
      expect(db.selectValue("select stok from produk where id = 'p1'")).toBe(10);
    });
  });

  describe('transaksi', () => {
    it('menerima transaksi tunai & QRIS yang valid', () => {
      sisip(db, 'transaksi', transaksiValid);
      sisip(db, 'transaksi', { ...transaksiValid, id: 't2', metode_bayar: 'qris_transfer', dibayar: null, kembalian: null });
      expect(db.selectValue('select count(*) from transaksi')).toBe(2);
    });

    it.each([
      ['total ≠ subtotal − diskon', { total: 1 }],
      ['QRIS dengan uang dibayar', { metode_bayar: 'qris_transfer' }],
      ['metode bayar tak dikenal', { metode_bayar: 'kartu' }],
      ['diskon tipe tanpa nilai', { diskon_tipe: 'persen' }],
      ['tanggal lokal salah format', { tanggal_lokal: '27/09/2026' }],
    ])('menolak %s', (_, ubah) => {
      expect(() => sisip(db, 'transaksi', { ...transaksiValid, ...ubah })).toThrow(/constraint/i);
    });
  });

  describe('item_transaksi', () => {
    beforeEach(() => {
      sisip(db, 'produk', produkValid);
      sisip(db, 'transaksi', transaksiValid);
    });

    it('menolak item tanpa transaksi induk', () => {
      expect(() => sisip(db, 'item_transaksi', { ...itemValid, transaksi_id: 'tidak-ada' })).toThrow(/constraint/i);
    });

    it('menolak subtotal item yang tidak sama dengan harga × qty', () => {
      expect(() => sisip(db, 'item_transaksi', { ...itemValid, subtotal_item: 1 })).toThrow(/constraint/i);
    });

    it('menolak qty nol', () => {
      expect(() => sisip(db, 'item_transaksi', { ...itemValid, qty: 0, subtotal_item: 0 })).toThrow(/constraint/i);
    });

    it('histori penjualan tetap utuh walau produknya dihapus dari katalog', () => {
      sisip(db, 'item_transaksi', itemValid);
      db.exec("delete from produk where id = 'p1'");
      expect(db.selectValue("select nama from item_transaksi where produk_id = 'p1'")).toBe('Kampas rem');
    });
  });

  it('pengaturan_toko hanya boleh satu baris', () => {
    sisip(db, 'pengaturan_toko', { id: 1, nama_toko: 'Toko', diperbarui_pada: 0 });
    expect(() => sisip(db, 'pengaturan_toko', { id: 2, nama_toko: 'Lain', diperbarui_pada: 0 })).toThrow(/constraint/i);
  });
});
