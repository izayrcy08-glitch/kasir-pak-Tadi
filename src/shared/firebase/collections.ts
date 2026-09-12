// Nama koleksi Firestore terpusat — hindari string literal tersebar di banyak file.
export const COLLECTIONS = {
  produk: 'produk',
  transaksi: 'transaksi',
  agregatLaporan: 'agregat_laporan',
  pengaturanToko: 'pengaturan_toko',
} as const;
