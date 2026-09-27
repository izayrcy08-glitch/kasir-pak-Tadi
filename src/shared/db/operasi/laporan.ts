// Ringkasan penjualan per hari, dihitung langsung dari transaksi +
// item_transaksi dengan SQL (menggantikan dokumen agregat_laporan Firestore).
import type { Database } from '@sqlite.org/sqlite-wasm';
import type { AgregatLaporanHarian } from '../../types/agregatLaporan';
import type { MetodeBayar } from '../../types/transaksi';

// idMulai/idAkhir: 'YYYY-MM-DD' (idHariIni), inklusif. Hasil urut tanggal,
// hanya hari yang ada transaksinya.
export function ambilAgregatRentang(db: Database, idMulai: string, idAkhir: string): AgregatLaporanHarian[] {
  const perHari = new Map<string, AgregatLaporanHarian>();
  const hari = (tanggal: string) => {
    let d = perHari.get(tanggal);
    if (!d) {
      d = {
        tanggal,
        omzet: 0,
        jumlahTransaksi: 0,
        omzetPerMetode: {},
        jumlahTransaksiPerMetode: {},
        qtyTerjualPerProduk: {},
        namaProdukPerId: {},
      };
      perHari.set(tanggal, d);
    }
    return d;
  };

  const omzet = db.selectObjects(
    `SELECT tanggal_lokal, metode_bayar, SUM(total) AS omzet, COUNT(*) AS jumlah
     FROM transaksi
     WHERE tanggal_lokal BETWEEN ? AND ?
     GROUP BY tanggal_lokal, metode_bayar`,
    [idMulai, idAkhir],
  ) as unknown as { tanggal_lokal: string; metode_bayar: MetodeBayar; omzet: number; jumlah: number }[];

  for (const r of omzet) {
    const d = hari(r.tanggal_lokal);
    d.omzet += r.omzet;
    d.jumlahTransaksi += r.jumlah;
    d.omzetPerMetode[r.metode_bayar] = r.omzet;
    d.jumlahTransaksiPerMetode[r.metode_bayar] = r.jumlah;
  }

  // Nama produk per hari = nama di transaksi TERAKHIR hari itu (snapshot
  // terbaru), sama dengan perilaku agregat Firestore sebelumnya — penting
  // kalau produk diganti nama/dihapus di tengah periode.
  const produk = db.selectObjects(
    `WITH item AS (
       SELECT t.tanggal_lokal, i.produk_id, i.qty, i.nama,
              ROW_NUMBER() OVER (
                PARTITION BY t.tanggal_lokal, i.produk_id
                ORDER BY t.dibuat_pada DESC, t.id DESC
              ) AS urut_terbaru
       FROM item_transaksi i
       JOIN transaksi t ON t.id = i.transaksi_id
       WHERE t.tanggal_lokal BETWEEN ? AND ?
     )
     SELECT tanggal_lokal, produk_id, SUM(qty) AS qty, MAX(CASE WHEN urut_terbaru = 1 THEN nama END) AS nama
     FROM item
     GROUP BY tanggal_lokal, produk_id`,
    [idMulai, idAkhir],
  ) as unknown as { tanggal_lokal: string; produk_id: string; qty: number; nama: string }[];

  for (const r of produk) {
    const d = hari(r.tanggal_lokal);
    d.qtyTerjualPerProduk[r.produk_id] = r.qty;
    d.namaProdukPerId[r.produk_id] = r.nama;
  }

  return [...perHari.values()].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
}
