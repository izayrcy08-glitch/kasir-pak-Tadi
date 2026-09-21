# Daftar & Desain Fitur — Aplikasi Kasir Pak Tadi

> Hasil diskusi fitur untuk versi pertama (MVP). Lihat [CATATAN-KEPUTUSAN.md](CATATAN-KEPUTUSAN.md) untuk keputusan arsitektur teknis.

## Ringkasan konteks bisnis

- Jenis usaha: **toko sparepart** (motor/mobil).
- Pencarian produk saat transaksi: **manual by nama/kode part** — bukan scan barcode, karena banyak sparepart tidak berbarcode.
- Tidak ada fitur piutang/utang pelanggan — semua transaksi lunas di tempat.
- Pengguna: **satu akun sharing** dipakai Pak Tadi & istri — tidak perlu multi-akun/shift terpisah untuk MVP.
- Metode bayar: **Tunai + QRIS/transfer** (QRIS dicatat manual, tanpa integrasi payment gateway real-time).

## 0. Login

- Firebase Auth Email/Password, satu akun sharing (dipakai Pak Tadi & istri bersama, tidak perlu akun terpisah per orang untuk MVP). Sesi persist per device — login cuma sekali per HP/laptop.
- Tidak ada signup/lupa-password di UI — akun dibuat manual lewat Firebase Console.
- Sisa langkah sebelum device toko boleh dipasang: buat akun di project Firebase asli — lihat `CLAUDE.md`.

## 1. Manajemen Produk & Stok

- Data produk: kode part (opsional, bebas diisi/tidak — tidak semua sparepart punya kode baku), nama produk, kategori (mis. oli, kampas rem, busi, aki, per, filter, dll — daftar kategori bisa dikelola sendiri oleh user), harga beli, harga jual, stok saat ini, satuan (pcs/set/liter/dus).
- Tambah/edit/hapus produk lewat form.
- Field kompatibilitas kendaraan opsional (teks bebas, mis. "Honda Beat, Vario") supaya gampang dicari nanti.
- Pencarian produk by nama atau kode part (search-as-you-type) — dipakai baik di halaman kelola produk maupun saat transaksi.
- Stok otomatis berkurang saat transaksi tersimpan.
- Stok masuk (restock): catat penambahan stok, opsional update harga beli terbaru.
- Alert/badge stok rendah (ambang batas ditentukan per produk atau default, mis. stok < 5).

## 2. Transaksi & Cetak Struk

- Keranjang transaksi: cari produk manual → pilih dari hasil → atur qty → tambah ke keranjang.
- Edit qty / hapus item dari keranjang sebelum bayar.
- Diskon per transaksi (nominal atau persen) — sparepart sering nego harga.
- Hitung total otomatis (subtotal − diskon).
- Pilih metode bayar: **Tunai** atau **QRIS/Transfer**.
  - Tunai: input jumlah dibayar → hitung kembalian otomatis → buka cash drawer via printer.
  - QRIS/Transfer: tandai "sudah dibayar" manual oleh kasir (tanpa cek status otomatis, karena tanpa payment gateway).
- Simpan transaksi ke riwayat + kurangi stok produk terkait.
- Cetak struk ke printer thermal (Bluetooth Classic di Android via Capacitor, USB Web Serial di Windows — sesuai keputusan arsitektur). Isi struk: **logo & nama toko** (dari halaman Pengaturan Toko), tanggal/waktu, daftar item + qty + harga, subtotal, diskon, total, metode bayar, kembalian (jika tunai).
- Opsi cetak ulang struk dari riwayat transaksi.

## 3. Laporan Penjualan

- Riwayat transaksi: daftar semua transaksi (tanggal, total, metode bayar), bisa buka detail per transaksi.
- Filter riwayat berdasarkan rentang tanggal.
- Ringkasan omzet harian/mingguan/bulanan (total penjualan per periode).
- Produk terlaris (berdasarkan qty terjual dalam periode tertentu).
- Breakdown total berdasarkan metode bayar (tunai vs QRIS/transfer) — membantu rekonsiliasi kas fisik.

## 4. Pengaturan Toko

- Halaman pengaturan sederhana untuk atur **nama toko** dan **logo toko**.
- Nama toko & logo dipakai sebagai header struk saat dicetak (logo dicetak sebagai bitmap lewat printer thermal — umumnya didukung printer ESC/POS Bluetooth/USB yang dipakai).
- Logo diunggah dari galeri/file, dikompres ke format **WebP** sebelum disimpan (hemat ruang, sesuai kebutuhan render bitmap untuk print), disimpan lokal di device — bukan URL eksternal.

## 5. Di luar cakupan MVP (dicatat sebagai "nanti")

- Piutang/utang pelanggan.
- Multi-akun kasir & shift terpisah.
- Scan barcode (bisa ditambah belakangan sebagai pelengkap, bukan pengganti pencarian manual).
- Manajemen supplier/pembelian terstruktur (PO ke supplier).
- Retur/refund transaksi (perlu dibahas kalau ternyata sering terjadi).
