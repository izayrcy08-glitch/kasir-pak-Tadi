// Daftar operasi DB yang boleh dipanggil UI lewat `panggil()` di klienDb.ts.
// Tiap operasi: fungsi sinkron `(db, ...argumen) => hasil`, dijalankan utuh di
// worker sebelum pesan berikutnya diproses — jadi satu operasi tidak pernah
// tersela operasi lain. Argumen & hasil harus bisa di-clone postMessage
// (data biasa, Date, Uint8Array — bukan fungsi/class).
import { ambilRiwayatTransaksi, simpanTransaksi } from './transaksi';

export const OPERASI = {
  simpanTransaksi: (...[db, draft]: Parameters<typeof simpanTransaksi>) => simpanTransaksi(db, draft),
  ambilRiwayatTransaksi,
};

export type Operasi = typeof OPERASI;
export type NamaOperasi = keyof Operasi;
