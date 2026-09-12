# Fitur Laporan

Mockup acuan: `design/Laporan.dc.html`.

## Aturan bisnis
- Firestore itu NoSQL — laporan (omzet, produk terlaris, breakdown metode bayar) **wajib** pakai pola agregat/counter yang di-update tiap transaksi baru tersimpan (lihat `features/transaksi/CLAUDE.md`), **bukan** query `SUM`/`GROUP BY` seperti SQL.
- Filter berdasarkan rentang tanggal; ringkasan harian/mingguan/bulanan.
- Collection: `agregat_laporan` (lihat `src/shared/firebase/collections.ts`).

## Struktur
- `logic/` — pure function: `agregatOmzet.ts`, `agregatProdukTerlaris.ts`, dengan test di `logic/__tests__/` (test logic murni pakai Vitest; test yang menyentuh Firestore lewat Firebase Emulator).
