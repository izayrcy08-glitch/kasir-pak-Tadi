import type { Database } from '@sqlite.org/sqlite-wasm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { TransaksiDraft } from '../../types/transaksi';
import { PembayaranKurangError, StokTidakCukupError } from '../galat';
import { buatDbUji } from '../ujiDb';
import type { Ketergantungan } from './ketergantungan';
import { ambilRiwayatTransaksi, ambilTransaksiRentang, simpanTransaksi } from './transaksi';

function tambahProduk(db: Database, id: string, hargaJual: number, stok: number, kodePart: string | null = null) {
  db.exec({
    sql: `INSERT INTO produk (id, kode_part, nama, kategori, harga_beli, harga_jual, stok, satuan, dibuat_pada, diperbarui_pada)
          VALUES (?, ?, ?, 'Umum', 0, ?, ?, 'pcs', 0, 0)`,
    bind: [id, kodePart, `Produk ${id}`, hargaJual, stok],
  });
}

function stok(db: Database, id: string): number {
  return db.selectValue('SELECT stok FROM produk WHERE id = ?', [id]) as number;
}

function jumlah(db: Database, tabel: string): number {
  return db.selectValue(`SELECT count(*) FROM ${tabel}`) as number;
}

// Jam & id deterministik untuk tes.
function depUji(mulai = new Date(2026, 8, 27, 10, 0, 0)): Ketergantungan {
  let n = 0;
  return {
    sekarang: () => new Date(mulai.getTime() + n * 1000),
    buatId: () => `t${++n}`,
  };
}

const draftTunai = (item: TransaksiDraft['item'], dibayar = 1_000_000): TransaksiDraft => ({
  item,
  diskon: null,
  metodeBayar: 'tunai',
  dibayar,
});

describe('simpanTransaksi', () => {
  let db: Database;
  beforeEach(async () => {
    db = await buatDbUji();
    tambahProduk(db, 'busi', 15000, 10, 'NGK-C7');
    tambahProduk(db, 'oli', 50000, 3);
  });

  it('menyimpan transaksi + item dan mengurangi stok', () => {
    const id = simpanTransaksi(
      db,
      draftTunai(
        [
          { produkId: 'busi', qty: 2 },
          { produkId: 'oli', qty: 1 },
        ],
        100000,
      ),
      depUji(),
    );

    expect(id).toBe('t1');
    expect(stok(db, 'busi')).toBe(8);
    expect(stok(db, 'oli')).toBe(2);
    expect(db.selectObject('SELECT subtotal, total, dibayar, kembalian, tanggal_lokal FROM transaksi')).toEqual({
      subtotal: 80000,
      total: 80000,
      dibayar: 100000,
      kembalian: 20000,
      tanggal_lokal: '2026-09-27',
    });
    expect(
      db.selectObjects('SELECT produk_id, nama, kode_part, harga_satuan, qty FROM item_transaksi ORDER BY urutan'),
    ).toEqual([
      { produk_id: 'busi', nama: 'Produk busi', kode_part: 'NGK-C7', harga_satuan: 15000, qty: 2 },
      { produk_id: 'oli', nama: 'Produk oli', kode_part: null, harga_satuan: 50000, qty: 1 },
    ]);
  });

  it('memakai harga terkini dari tabel produk', () => {
    db.exec("UPDATE produk SET harga_jual = 17000 WHERE id = 'busi'");
    simpanTransaksi(db, draftTunai([{ produkId: 'busi', qty: 1 }]), depUji());
    expect(db.selectValue('SELECT total FROM transaksi')).toBe(17000);
  });

  it('stok kurang di SATU produk = seluruh transaksi ditolak, tidak ada yang berubah', () => {
    const draft = draftTunai([
      { produkId: 'busi', qty: 1 },
      { produkId: 'oli', qty: 5 },
    ]);
    expect(() => simpanTransaksi(db, draft, depUji())).toThrow(StokTidakCukupError);
    try {
      simpanTransaksi(db, draft, depUji());
    } catch (err) {
      expect((err as StokTidakCukupError).detail).toEqual([
        { produkId: 'oli', nama: 'Produk oli', diminta: 5, tersedia: 3 },
      ]);
    }
    expect(stok(db, 'busi')).toBe(10);
    expect(stok(db, 'oli')).toBe(3);
    expect(jumlah(db, 'transaksi')).toBe(0);
    expect(jumlah(db, 'item_transaksi')).toBe(0);
  });

  it('menolak produk yang sudah tidak ada', () => {
    expect(() => simpanTransaksi(db, draftTunai([{ produkId: 'hilang', qty: 1 }]), depUji())).toThrow(
      StokTidakCukupError,
    );
  });

  it('menggabungkan produk ganda sebelum cek stok (2 + 2 > stok 3)', () => {
    const draft = draftTunai([
      { produkId: 'oli', qty: 2 },
      { produkId: 'oli', qty: 2 },
    ]);
    expect(() => simpanTransaksi(db, draft, depUji())).toThrow(StokTidakCukupError);
    expect(stok(db, 'oli')).toBe(3);
  });

  it('menolak pembayaran tunai yang kurang, tanpa menyimpan apa pun', () => {
    expect(() => simpanTransaksi(db, draftTunai([{ produkId: 'oli', qty: 1 }], 49000), depUji())).toThrow(
      PembayaranKurangError,
    );
    expect(stok(db, 'oli')).toBe(3);
    expect(jumlah(db, 'transaksi')).toBe(0);
  });

  it('QRIS tidak menyimpan uang dibayar/kembalian walau dikirim UI', () => {
    simpanTransaksi(
      db,
      { item: [{ produkId: 'busi', qty: 1 }], diskon: null, metodeBayar: 'qris_transfer', dibayar: 50000 },
      depUji(),
    );
    expect(db.selectObject('SELECT dibayar, kembalian FROM transaksi')).toEqual({ dibayar: null, kembalian: null });
  });

  it('menyimpan diskon persen dan totalnya', () => {
    simpanTransaksi(
      db,
      { item: [{ produkId: 'oli', qty: 2 }], diskon: { tipe: 'persen', nilai: 10 }, metodeBayar: 'qris_transfer' },
      depUji(),
    );
    expect(db.selectObject('SELECT subtotal, diskon_tipe, diskon_nilai, total_diskon, total FROM transaksi')).toEqual({
      subtotal: 100000,
      diskon_tipe: 'persen',
      diskon_nilai: 10,
      total_diskon: 10000,
      total: 90000,
    });
  });

  it('gagal di tengah penulisan = rollback penuh (stok tidak ikut berkurang)', () => {
    const dep: Ketergantungan = { sekarang: () => new Date(), buatId: () => 'id-sama' };
    simpanTransaksi(db, draftTunai([{ produkId: 'busi', qty: 1 }]), dep);
    // Transaksi kedua lolos validasi stok, lalu INSERT gagal (id bentrok).
    expect(() => simpanTransaksi(db, draftTunai([{ produkId: 'busi', qty: 4 }]), dep)).toThrow();
    expect(stok(db, 'busi')).toBe(9);
    expect(jumlah(db, 'transaksi')).toBe(1);
    expect(jumlah(db, 'item_transaksi')).toBe(1);
  });

  it('menolak keranjang kosong', () => {
    expect(() => simpanTransaksi(db, draftTunai([]), depUji())).toThrow(/kosong/);
  });
});

describe('ambilRiwayatTransaksi', () => {
  let db: Database;
  const hari = new Date(2026, 8, 27);
  const rentangHari = { mulai: new Date(2026, 8, 27, 0, 0, 0), akhir: new Date(2026, 8, 27, 23, 59, 59, 999) };

  beforeEach(async () => {
    db = await buatDbUji();
    tambahProduk(db, 'busi', 15000, 100);
  });

  it('mengembalikan transaksi terbaru dulu, lengkap dengan item & diskon', () => {
    const dep = depUji(new Date(hari.getTime() + 9 * 3600_000));
    simpanTransaksi(db, draftTunai([{ produkId: 'busi', qty: 1 }], 20000), dep);
    simpanTransaksi(
      db,
      { item: [{ produkId: 'busi', qty: 2 }], diskon: { tipe: 'nominal', nilai: 5000 }, metodeBayar: 'qris_transfer' },
      dep,
    );

    const { daftar, kursorBerikutnya } = ambilRiwayatTransaksi(db, rentangHari);
    expect(daftar.map((t) => t.id)).toEqual(['t2', 't1']);
    expect(daftar[0]).toMatchObject({
      diskon: { tipe: 'nominal', nilai: 5000 },
      total: 25000,
      metodeBayar: 'qris_transfer',
      dibayar: undefined,
      item: [{ produkId: 'busi', qty: 2, hargaSatuan: 15000, subtotalItem: 30000, kodePart: undefined }],
    });
    expect(daftar[1]).toMatchObject({ diskon: null, dibayar: 20000, kembalian: 5000 });
    expect(kursorBerikutnya).toBeNull();
  });

  it('hanya mengambil transaksi di dalam rentang', () => {
    simpanTransaksi(db, draftTunai([{ produkId: 'busi', qty: 1 }]), {
      sekarang: () => new Date(2026, 8, 26, 23, 59),
      buatId: () => 'kemarin',
    });
    simpanTransaksi(db, draftTunai([{ produkId: 'busi', qty: 1 }]), {
      sekarang: () => new Date(2026, 8, 27, 8, 0),
      buatId: () => 'hari-ini',
    });
    expect(ambilRiwayatTransaksi(db, rentangHari).daftar).toHaveLength(1);
  });

  it('paginasi tidak melewatkan/menduplikasi transaksi di milidetik yang sama', () => {
    const jamSama = new Date(2026, 8, 27, 12, 0, 0);
    let n = 0;
    const dep: Ketergantungan = { sekarang: () => jamSama, buatId: () => `t${String(++n).padStart(2, '0')}` };
    for (let i = 0; i < 7; i++) simpanTransaksi(db, draftTunai([{ produkId: 'busi', qty: 1 }]), dep);

    const semua: string[] = [];
    let kursor = null;
    do {
      const hal = ambilRiwayatTransaksi(db, rentangHari, { batas: 3, kursorSetelah: kursor });
      semua.push(...hal.daftar.map((t) => t.id));
      kursor = hal.kursorBerikutnya;
    } while (kursor);

    expect(semua).toEqual(['t07', 't06', 't05', 't04', 't03', 't02', 't01']);
  });
});

describe('ambilTransaksiRentang', () => {
  let db: Database;
  const rentangHari = { mulai: new Date(2026, 8, 27, 0, 0, 0), akhir: new Date(2026, 8, 27, 23, 59, 59, 999) };

  beforeEach(async () => {
    db = await buatDbUji();
    tambahProduk(db, 'busi', 15000, 1000);
    tambahProduk(db, 'oli', 50000, 1000);
  });

  it('semua transaksi dalam rentang (tanpa batas halaman), terlama dulu, item urut sesuai keranjang', () => {
    simpanTransaksi(db, draftTunai([{ produkId: 'busi', qty: 1 }]), {
      sekarang: () => new Date(2026, 8, 26, 23, 59),
      buatId: () => 'kemarin',
    });
    const dep = depUji(new Date(2026, 8, 27, 8, 0));
    for (let i = 0; i < 60; i++) {
      simpanTransaksi(db, draftTunai([{ produkId: 'oli', qty: 1 }, { produkId: 'busi', qty: 2 }]), dep);
    }

    const daftar = ambilTransaksiRentang(db, rentangHari);
    expect(daftar).toHaveLength(60);
    expect(daftar[0]!.id).toBe('t1');
    expect(daftar.at(-1)!.id).toBe('t60');
    expect(daftar[0]!.item.map((it) => [it.produkId, it.qty])).toEqual([
      ['oli', 1],
      ['busi', 2],
    ]);
    expect(daftar.every((t) => t.item.length === 2)).toBe(true);
  });

  it('kosong kalau tidak ada transaksi di rentang', () => {
    expect(ambilTransaksiRentang(db, rentangHari)).toEqual([]);
  });
});
