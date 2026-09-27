// Terpisah dari index.ts supaya klienDb.ts (main thread) bisa mengimpornya
// tanpa ikut membundel kode operasi DB yang seharusnya hanya ada di worker.
import type { NamaOperasi } from './index';

export type TabelDb = 'produk' | 'transaksi' | 'pengaturan_toko';

// Tabel yang diubah tiap operasi tulis — dipakai klienDb.ts untuk memberi tahu
// hook yang sedang menampilkan tabel itu supaya memuat ulang (pengganti
// onSnapshot Firestore). Operasi yang tidak tercantum = hanya baca.
export const TABEL_DIUBAH: Partial<Record<NamaOperasi, readonly TabelDb[]>> = {
  simpanTransaksi: ['transaksi', 'produk'],
  tambahProduk: ['produk'],
  updateProduk: ['produk'],
  hapusProduk: ['produk'],
  simpanPengaturanToko: ['pengaturan_toko'],
};
