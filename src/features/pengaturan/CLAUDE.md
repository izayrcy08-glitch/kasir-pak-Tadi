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
