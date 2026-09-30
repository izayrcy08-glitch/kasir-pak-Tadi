# Fitur Laporan

Mockup acuan: `design/Laporan.dc.html`.

## Aturan bisnis
- Ringkasan harian (`AgregatLaporanHarian`) dihitung dengan SQL `SUM`/`GROUP BY` dari `transaksi` + `item_transaksi` di `src/shared/db/operasi/laporan.ts`. Bentuknya dipertahankan dari era Firestore supaya `logic/` tetap sama.
- Filter berdasarkan rentang tanggal; ringkasan harian/mingguan/bulanan.
- Riwayat transaksi: `ambilRiwayatTransaksi` (kursor keyset `(dibuat_pada, id)`).
- Ekspor CSV (`logic/csvLaporan.ts`): satu baris per transaksi di rentang aktif, dari `ambilTransaksiRentang` (semua transaksi, tanpa paginasi). Format sengaja `;` + BOM + tanggal ISO untuk Excel region Indonesia — alasan di komentar file itu. Sel teks wajib lewat `sel()` (escape + cegah rumus Excel).

## Struktur
- `logic/` — pure function: `agregatOmzet.ts`, `agregatProdukTerlaris.ts`, dengan test di `logic/__tests__/` (test logic murni pakai Vitest; query SQL dites di `src/shared/db/operasi/*.test.ts` dengan DB in-memory).
