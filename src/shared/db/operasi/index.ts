// Daftar operasi DB yang boleh dipanggil UI lewat `panggil()` di klienDb.ts.
// Tiap operasi: fungsi sinkron `(db, ...argumen) => hasil`, dijalankan utuh di
// worker sebelum pesan berikutnya diproses — jadi satu operasi tidak pernah
// tersela operasi lain. Argumen & hasil harus bisa di-clone postMessage
// (data biasa, Date, Uint8Array — bukan fungsi/class).
//
// Operasi yang punya parameter `dep` (jam/ID untuk unit test) dibungkus
// supaya UI tidak bisa mengisinya.
import type { Database } from '@sqlite.org/sqlite-wasm';
import type { PengaturanTokoInput } from '../../types/pengaturanToko';
import type { ProdukInput } from '../../types/produk';
import type { TransaksiDraft } from '../../types/transaksi';
import { ringkasData } from '../berkasBackup';
import { ambilStatusBackup, catatBackup } from './backup';
import { ambilAgregatRentang } from './laporan';
import { ambilPengaturanToko, simpanPengaturanToko } from './pengaturanToko';
import { daftarProduk, hapusProduk, tambahProduk, updateProduk } from './produk';
import { ambilRiwayatTransaksi, ambilTransaksiRentang, simpanTransaksi } from './transaksi';

export const OPERASI = {
  // Transaksi
  simpanTransaksi: (db: Database, draft: TransaksiDraft) => simpanTransaksi(db, draft),
  ambilRiwayatTransaksi,
  ambilTransaksiRentang,
  // Produk
  daftarProduk,
  tambahProduk: (db: Database, input: ProdukInput) => tambahProduk(db, input),
  updateProduk: (db: Database, id: string, input: ProdukInput) => updateProduk(db, id, input),
  hapusProduk,
  // Pengaturan toko
  ambilPengaturanToko,
  simpanPengaturanToko: (db: Database, input: PengaturanTokoInput) => simpanPengaturanToko(db, input),
  // Laporan
  ambilAgregatRentang,
  // Backup
  ambilStatusBackup,
  catatBackup: (db: Database) => catatBackup(db),
  ringkasData,
};

export type Operasi = typeof OPERASI;
export type NamaOperasi = keyof Operasi;
