import type { Database } from '@sqlite.org/sqlite-wasm';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ProdukInput } from '../../types/produk';
import { buatDbUji } from '../ujiDb';
import type { Ketergantungan } from './ketergantungan';
import { ambilPengaturanToko, simpanPengaturanToko } from './pengaturanToko';
import { daftarProduk, hapusProduk, tambahProduk, updateProduk } from './produk';

const input: ProdukInput = {
  kodePart: '  NGK-C7 ',
  nama: ' Busi ',
  kategori: 'Mesin',
  hargaBeli: 10000,
  hargaJual: 15000,
  stok: 5,
  satuan: 'pcs',
  kompatibilitas: '',
};

function depPada(ms: number, id = 'p1'): Ketergantungan {
  return { sekarang: () => new Date(ms), buatId: () => id };
}

describe('operasi produk', () => {
  let db: Database;
  beforeEach(async () => {
    db = await buatDbUji();
  });

  it('tambah lalu baca: teks di-trim, isian kosong jadi undefined', () => {
    expect(tambahProduk(db, input, depPada(1000))).toBe('p1');
    expect(daftarProduk(db)).toEqual([
      {
        id: 'p1',
        kodePart: 'NGK-C7',
        nama: 'Busi',
        kategori: 'Mesin',
        hargaBeli: 10000,
        hargaJual: 15000,
        stok: 5,
        satuan: 'pcs',
        kompatibilitas: undefined,
        ambangStokRendah: undefined,
        dibuatPada: 1000,
        diperbaruiPada: 1000,
      },
    ]);
  });

  it('daftar urut nama tanpa peduli huruf besar/kecil', () => {
    tambahProduk(db, { ...input, nama: 'oli' }, depPada(0, 'a'));
    tambahProduk(db, { ...input, nama: 'Ban' }, depPada(0, 'b'));
    tambahProduk(db, { ...input, nama: 'aki' }, depPada(0, 'c'));
    expect(daftarProduk(db).map((p) => p.nama)).toEqual(['aki', 'Ban', 'oli']);
  });

  it('update mengubah isi & diperbaruiPada, dibuatPada tetap', () => {
    tambahProduk(db, input, depPada(1000));
    updateProduk(db, 'p1', { ...input, hargaJual: 17000 }, depPada(2000));
    const [p] = daftarProduk(db);
    expect(p).toMatchObject({ hargaJual: 17000, dibuatPada: 1000, diperbaruiPada: 2000 });
  });

  it('update produk yang sudah dihapus = error (bukan diam-diam tidak terjadi apa-apa)', () => {
    expect(() => updateProduk(db, 'tidak-ada', input, depPada(0))).toThrow(/tidak ditemukan/);
  });

  it('menolak harga pecahan di level DB', () => {
    expect(() => tambahProduk(db, { ...input, hargaJual: 15000.5 }, depPada(0))).toThrow();
    expect(daftarProduk(db)).toHaveLength(0);
  });

  it('hapus', () => {
    tambahProduk(db, input, depPada(0));
    hapusProduk(db, 'p1');
    expect(daftarProduk(db)).toEqual([]);
  });
});

describe('operasi pengaturan toko', () => {
  let db: Database;
  beforeEach(async () => {
    db = await buatDbUji();
  });

  it('null kalau belum pernah diisi', () => {
    expect(ambilPengaturanToko(db)).toBeNull();
  });

  it('simpan pertama lalu timpa (tetap satu baris)', () => {
    simpanPengaturanToko(db, { namaToko: 'Toko A', logoWebp: 'data:image/webp;base64,xx' }, depPada(1));
    simpanPengaturanToko(db, { namaToko: 'Toko B' }, depPada(2));
    expect(ambilPengaturanToko(db)).toEqual({ namaToko: 'Toko B', logoWebp: undefined, diperbaruiPada: 2 });
    expect(db.selectValue('SELECT count(*) FROM pengaturan_toko')).toBe(1);
  });
});
