interface IsiData {
  /** Epoch ms transaksi terbaru; null kalau belum ada transaksi. */
  transaksiTerakhirPada: number | null;
}

// Apakah `a` punya transaksi yang lebih baru dari semua transaksi di `b`?
// Dipakai sebelum mengganti data dengan isi file: kalau data yang sekarang
// lebih baru dari file, mengganti = transaksi terbaru itu hilang (kasir) /
// tampilan mundur ke data lama (pemantau).
export function adaTransaksiLebihBaru(a: IsiData, b: IsiData): boolean {
  return (
    a.transaksiTerakhirPada !== null && (b.transaksiTerakhirPada === null || a.transaksiTerakhirPada > b.transaksiTerakhirPada)
  );
}
