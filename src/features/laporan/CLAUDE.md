# Fitur Laporan

Mockup acuan: `design/Laporan.dc.html`.

## Aturan bisnis
- Ringkasan harian (`AgregatLaporanHarian`) dihitung dengan SQL `SUM`/`GROUP BY` dari `transaksi` + `item_transaksi` di `src/shared/db/operasi/laporan.ts`. Bentuknya dipertahankan dari era Firestore supaya `logic/` tetap sama.
- Filter berdasarkan rentang tanggal; ringkasan harian/mingguan/bulanan.
- Riwayat transaksi: `ambilRiwayatTransaksi` (kursor keyset `(dibuat_pada, id)`).

## Struktur
- `logic/` — pure function: `agregatOmzet.ts`, `agregatProdukTerlaris.ts`, dengan test di `logic/__tests__/` (test logic murni pakai Vitest; query SQL dites di `src/shared/db/operasi/*.test.ts` dengan DB in-memory).
