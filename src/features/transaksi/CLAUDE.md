# Fitur Transaksi

Mockup acuan: `design/Main.dc.html`.

## Aturan bisnis
- Diskon: nominal ATAU persen, tidak boleh membuat total < 0.
- Kembalian = jumlah dibayar − total, hanya berlaku untuk metode **Tunai**.
- QRIS/Transfer: ditandai lunas manual oleh kasir (tanpa cek status gateway).
- Simpan transaksi **wajib** satu operasi atomik (SQLite `BEGIN IMMEDIATE`) yang sekaligus mengurangi stok produk terkait — lihat `src/shared/db/operasi/transaksi.ts`. Harga & nama diambil ulang dari tabel produk di dalam transaksi, bukan dari keranjang UI.
- Tabel: `transaksi` + `item_transaksi` (skema di `src/shared/db/skema.ts`). Tidak ada lagi counter agregat — laporan dihitung dari tabel ini.

## Struktur
- `logic/` — pure function, tanpa import react/firebase: `hitungTotal.ts`, `hitungKembalian.ts`, `terapkanDiskon.ts`, masing-masing wajib ada test di `logic/__tests__/`.
- `components/` — `ProdukGrid`, `KeranjangPanel`, `SearchProduk` (turunan dari `design/Main.dc.html`).
