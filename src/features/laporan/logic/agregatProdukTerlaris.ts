import type { AgregatLaporanHarian } from '../../../shared/types/agregatLaporan';

export interface ProdukTerlaris {
  produkId: string;
  nama: string;
  qty: number;
}

const DEFAULT_LIMIT = 5;

// Qty dijumlah lintas dokumen per produkId. Nama diambil dari dokumen dengan
// `tanggal` TERBESAR (snapshot nama terbaru) — namaProdukPerId di-overwrite
// tiap transaksi, bukan increment, jadi kalau nama produk berubah di tengah
// rentang, dokumen paling akhir yang paling akurat. Produk yang sudah
// dihapus dari koleksi `produk` tetap tampil pakai nama snapshot ini —
// sengaja tidak query ulang ke koleksi `produk`.
export function agregatProdukTerlaris(
  dokumen: AgregatLaporanHarian[],
  limit = DEFAULT_LIMIT,
): ProdukTerlaris[] {
  const qtyPerProduk = new Map<string, number>();
  const namaTerbaru = new Map<string, { tanggal: string; nama: string }>();

  for (const d of dokumen) {
    for (const [produkId, qty] of Object.entries(d.qtyTerjualPerProduk)) {
      qtyPerProduk.set(produkId, (qtyPerProduk.get(produkId) ?? 0) + qty);
    }
    for (const [produkId, nama] of Object.entries(d.namaProdukPerId)) {
      const existing = namaTerbaru.get(produkId);
      if (!existing || d.tanggal > existing.tanggal) {
        namaTerbaru.set(produkId, { tanggal: d.tanggal, nama });
      }
    }
  }

  const hasil = Array.from(qtyPerProduk.entries()).map(([produkId, qty]) => ({
    produkId,
    nama: namaTerbaru.get(produkId)?.nama ?? '(produk tidak diketahui)',
    qty,
  }));

  hasil.sort((a, b) => b.qty - a.qty || a.nama.localeCompare(b.nama));

  return hasil.slice(0, limit);
}
