# Fitur Produk

Mockup acuan: `design/Produk.dc.html` (tabel) dan `design/TambahProduk.dc.html` (form tambah).

## Aturan bisnis
- Field: kode part (opsional), nama, kategori, harga beli, harga jual, stok, satuan (pcs/set/liter/dus), kompatibilitas kendaraan (teks bebas, opsional).
- Ambang stok rendah: default global, bisa di-override per produk.
- Restock (stok masuk): catat penambahan stok, opsional update harga beli terbaru — jangan menimpa histori harga lama.
- Pencarian by nama/kode part (search-as-you-type), dipakai juga di fitur Transaksi.

## Struktur
- `logic/` — pure function: `hitungStokRendah.ts`, `validasiProduk.ts`, dengan test di `logic/__tests__/`.
- `components/` — `TabelProduk`, `FormProduk`.
