// Hasil TIDAK di-clamp ke 0 — nilai negatif berarti kurang bayar, dipakai
// pemanggil (UI) sebagai sinyal untuk menonaktifkan tombol bayar, bukan
// disembunyikan di sini. Hanya relevan untuk metode Tunai.
export function hitungKembalian(total: number, dibayar: number): number {
  return dibayar - total;
}
