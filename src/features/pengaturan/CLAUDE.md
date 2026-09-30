# Fitur Pengaturan

Mockup acuan: `design/Pengaturan.dc.html`, `design/PengaturanIdentitas.dc.html`, `design/PengaturanPrinter.dc.html`.

Pola navigasi: menu list yang membuka halaman detail terpisah per item (bukan form gabungan).

## identitas-toko/
- Nama toko & logo (dikompres ke WebP sebelum disimpan, disimpan lokal di device — bukan URL eksternal).
- `logic/kompresLogoWebp.ts` — pure function kompresi gambar.

## printer/
- Toggle Bluetooth (Android, lewat Capacitor Bluetooth Serial) / USB Web Serial (Windows). iOS: fitur print disembunyikan (lihat `src/platform/print/noop.ts`).
- `logic/escposBuilder.ts` — pure function menyusun command ESC/POS (testable tanpa hardware fisik).
- `printerAdapter.ts` — implementasi konkret mengikuti interface `src/platform/print/printerAdapter.ts`.
- Tes cetak & buka laci kas dari halaman ini.

## backup/
Tidak ada mockup — mengikuti pola halaman Identitas Toko. Keputusan & alasan: `CATATAN-KEPUTUSAN.md` bagian "Pivot ke offline-only".
- **Backup** = seluruh file SQLite (`exportDb()`), nama `backup-kasir-YYYY-MM-DD-HHmm.sqlite3`. Android: menu Bagikan (WhatsApp/Drive/Files) via `src/platform/berkas/`; Windows: dialog "Simpan sebagai". Waktu backup dicatat (`catatBackup`) hanya kalau file benar-benar tersimpan (bukan dibatalkan).
- **Pulihkan** menimpa SELURUH data. Pengaman wajib, jangan dilonggarkan: file diperiksa dulu di salinan in-memory (`src/shared/db/berkasBackup.ts`: header, integrity_check, versi skema, tabel Kasir, foreign key) dan diperiksa ULANG di worker sebelum menimpa; dialog konfirmasi menampilkan isi file vs isi device + peringatan kalau device punya transaksi lebih baru + centang "saya mengerti"; kalau penggantian gagal di tengah, worker memasang kembali salinan DB lama.
- **Pengingat**: banner di semua halaman (`PengingatBackup`, dipasang di `AppLayout`) kalau belum pernah backup padahal sudah ada data, atau backup terakhir >= 7 hari kalender (`logic/jadwalBackup.ts`). Banner bisa ditutup (✕, permintaan pemilik 2026-09-30) untuk periode telat yang sedang berjalan — muncul lagi hanya setelah ada backup baru yang kemudian telat lagi (`bannerPengingatDitutup`). Label peringatan di baris menu Backup (`PengaturanMenuPage`) **tidak** bisa ditutup, supaya peringatan tetap ada di satu tempat.
- Pindah kasir: backup di device lama → pulihkan di device baru → device lama berhenti dipakai transaksi (dijelaskan di halaman).

## pemantau/ (mode pemantau iPhone/iPad)
- `MODE_PEMANTAU` (`src/platform/perangkat.ts`) otomatis true di iOS/iPadOS — bukan setelan. Uji di dev: `localStorage['paksa-mode-pemantau'] = '1'` lalu muat ulang.
- Hanya-baca: rute Transaksi/tambah-edit produk/Pengaturan tidak didaftarkan (`App.tsx`), tombol ubah data & Cetak Ulang disembunyikan, dan `panggil()` menolak semua operasi tulis (`TABEL_DIUBAH`) sebagai lapis kedua.
- `MuatDataPage` (`/muat-data`): muat file backup kasir lewat `pulihkanBackup` (validasi sama dengan Pulihkan). Tanpa dialog "ganti semua data" karena isinya cuma salinan; konfirmasi hanya kalau file lebih lama dari yang sedang ditampilkan (`backup/logic/bandingkanIsi.ts`).
- `BannerPemantau` menggantikan PengingatBackup di mode ini: menandai data sebagai salinan + waktu transaksi terakhir.
