# Catatan Keputusan — Aplikasi Kasir Pak Tadi

> Catatan ini merangkum keputusan arsitektur yang sudah disepakati lewat diskusi. Belum ada setup tech stack maupun pembahasan fitur — itu langkah selanjutnya.

## Latar belakang kebutuhan

- Klien minta aplikasi kasir yang bisa dipakai di **iOS, Android, dan Windows**.
- Pengerjaan dilakukan solo, non-teknis, sepenuhnya lewat bantuan AI ("vibe coding") — tidak bisa debug kode sendiri.
- Butuh: printer struk thermal, cash drawer, barcode scanner, dan mode **offline lalu sync otomatis**.
- Wajib **100% gratis** — tanpa biaya App Store / Play Store / Microsoft Store / developer account.
- Proyek ini **terpisah** (repo & database sendiri) dari proyek lama milik user, `aplikasi-monitoring-spa`, tapi boleh memakai ulang pola/kode yang sudah terbukti jalan di sana.
- Printer yang tersedia melimpah di pasaran: **Bluetooth Classic**, bukan WiFi/LAN.
- Syarat tambahan: Android harus bisa print **tanpa aplikasi tambahan** (tanpa Thermer/RawBT); laptop cukup pakai USB.

## Temuan kunci

1. Printer thermal murah pakai Bluetooth Classic (SPP), sedangkan Web Bluetooth API di browser hanya mendukung BLE — PWA murni tidak pernah bisa bicara langsung ke printer jenis ini. Proyek lama (`aplikasi-monitoring-spa`) mengatasi ini dengan Web Share API ke app Thermer (gratis, setelah RawBT ternyata berbayar untuk fitur penuh).
2. Batasan Bluetooth Classic itu ada di level **browser**, bukan di level OS Android — jadi bisa diatasi dengan membungkus PWA yang sama pakai **Capacitor** (khusus build Android) + plugin Bluetooth Serial gratis, supaya print langsung tanpa app tambahan, tetap gratis, tetap sideload APK manual.
3. Untuk **iOS**, batasannya di level OS (aturan Apple/MFi), berlaku untuk semua aplikasi (native maupun web) dan tidak bisa diakali dengan cara apa pun. Printer struk murah pada umumnya tidak lolos sertifikasi MFi.

## Keputusan arsitektur

- **Kodebase inti**: satu PWA — Vite + React + TypeScript (pola sama seperti `aplikasi-monitoring-spa`).
- **Android**: kodebase yang sama dibungkus **Capacitor** + plugin Bluetooth Serial → APK, print langsung ke printer Bluetooth Classic tanpa app tambahan, sideload manual (tanpa Play Store).
- **Windows**: instal sebagai PWA biasa ("Install App"), print ke printer yang sama lewat kabel **USB** pakai **Web Serial API** (adaptasi dari `printViaWebSerial()` di proyek lama).
- **iOS**: instal sebagai PWA biasa ("Add to Home Screen"). **Bukan** stasiun cetak struk — dipakai untuk lihat laporan, kelola produk, pantau transaksi. Cetak struk fisik tetap dari Android atau Windows.
- **Cash drawer**: dibuka lewat perintah dari printer yang sama (Android maupun USB Windows) — tidak perlu device terpisah.
- **Barcode scanner**: tipe Bluetooth **HID/"keyboard mode"** — jalan normal di ketiga platform termasuk iOS.
- **Backend & database**: **Firebase (Firestore)**. Alasan: satu vendor untuk hosting+auth+database+sync sekaligus, dokumentasi & contoh paling banyak (memudahkan debugging dibantu AI), free tier (Spark plan) jauh melebihi kebutuhan satu toko.
- **Satu project Firebase saja (langsung produksi)** — tidak ada project dev terpisah, supaya tidak dobel setup/maintenance akun. Keamanan development tetap terjaga karena testing lokal (logic, aturan akses, alur simpan transaksi+kurangi stok) dijalankan lewat **Firebase Emulator Suite** (Firestore emulator jalan 100% lokal, tanpa pernah menyentuh data asli) — bukan lewat project cloud kedua. Project Firebase asli baru dipakai untuk build yang benar-benar dipasang di device toko.
- **Mode offline & sinkronisasi**: pakai **Firestore offline persistence** (bawaan SDK) — transaksi tetap bisa dicatat saat toko tanpa sinyal, otomatis ter-sync ke server begitu online kembali, tanpa perlu membangun sync engine sendiri.
- **Sinkronisasi antar-device**: pakai **realtime listener** Firestore (`onSnapshot`) — transaksi yang dicatat di kasir (Android/Windows) langsung muncul di device pemantau (iOS) saat online, tanpa perlu refresh manual.
- **Tooling build Android**: tidak perlu Android Studio — cukup Android SDK Command-Line Tools + JDK, build lewat terminal (`gradlew assembleDebug`), tes ke HP fisik via `adb install` (hindari emulator). Laptop 12GB RAM cukup dengan pendekatan ini.
- **Plugin Bluetooth Serial dipakai**: `@nosslabs/bluetooth-classic` (npm, repo `nossdev/bluetooth-classic`). Dipilih dibanding kandidat lain (`@kduma-autoid/capacitor-bluetooth-printer`, plugin vendor seperti `capacitor-thermal-printer`) karena method `write()`-nya terima raw bytes (`number[]`) langsung — cocok dipasangkan dengan `escposBuilder.ts` (`Uint8Array` command ESC/POS) tanpa konversi ke string yang berisiko merusak byte kontrol biner. Plugin ini niche/community (bukan resmi Ionic), jadi kalau di kemudian hari bermasalah/berhenti di-maintain, perlu dievaluasi ulang — implementasinya diisolasi di `src/platform/print/bluetooth.ts` lewat interface `PrinterAdapter` supaya gampang diganti.
- **appId Android**: `com.kasirsparepart.app` — sengaja tidak menyertakan nama "Pak Tadi" di identifier teknis (domain/package name); nama toko tetap dipakai di `appName` tampilan & header struk.

## Tradeoff yang disadari & diterima

- Build Android tidak lagi "murni PWA" — perlu di-build ulang lewat Capacitor tiap update besar (Windows/iOS cukup deploy web).
- iPhone tidak bisa jadi stasiun cetak struk dengan printer Bluetooth Classic biasa — keterbatasan dari Apple. Kalau nanti dibutuhkan, satu-satunya jalan adalah printer bersertifikasi MFi/AirPrint (lebih mahal, jarang stok) — belum jadi keputusan sekarang, hanya dicatat sebagai opsi masa depan.
- Firestore itu NoSQL (bukan SQL), jadi fitur Laporan Penjualan (omzet, produk terlaris, breakdown metode bayar) nanti didesain pakai pola "agregat/counter" (angka ringkasan di-update tiap ada transaksi baru), bukan query `SUM`/`GROUP BY` seperti di database SQL.

## Belum dibahas (langkah selanjutnya)

- Setup teknis (scaffolding Vite, install Firebase SDK, bikin project Firebase asli di console) — belum dikerjakan, menunggu instruksi lanjut dari user.
- **Halaman Login (Firebase Auth Email/Password) + mengembalikan `firestore.rules` ke versi wajib-login** — ini prioritas sebelum device dipasang di toko sungguhan, jangan ditunda sampai akhir. Lihat detail & alasan di `CLAUDE.md` bagian "Blocker sebelum device dipasang di toko sungguhan". Saat ini `firestore.rules` masih terbuka untuk siapa saja (`allow read, write: if true`) karena Login belum dibangun.
- CI sederhana (mis. GitHub Actions yang menjalankan `npm run check` di setiap push) — belum ada, saat ini gate kualitas (`tsc -b && oxlint && vitest run`) hanya jalan manual.

## Sudah dibahas

- Daftar & desain fitur aplikasi kasir — lihat [DAFTAR-FITUR.md](DAFTAR-FITUR.md).
- Desain frontend (mockup visual) — lihat bagian di bawah.
- Backend & mekanisme sinkronisasi data — lihat bagian "Keputusan arsitektur" di atas (Firebase/Firestore).

## Desain frontend (Tahap 2 — sudah dikerjakan sebelum setup stack)

Disepakati untuk mengerjakan desain tampilan dulu sebelum scaffolding proyek, supaya alur & rasa aplikasi bisa divalidasi lewat mockup (lebih murah diiterasi daripada lewat kode jadi).

- **Palet warna terpilih** — "Sage Lembut": latar aplikasi hijau sage `#57735F`, kartu konten putih `#FFFFFF`, aksen utama (tombol/CTA) mustard `#E4A24A`, aksen sekunder (label kategori, status terhubung) hijau tua `#3F5B49`, warna alert (stok rendah) terracotta `#D65C4A`.
- **Tipografi** — Fraunces (judul/heading), Work Sans (body/UI), IBM Plex Mono (semua angka/harga/kode, tabular-nums).
- **Pola navigasi** — sidebar kiri tetap (ikon + label) ke 4 halaman utama: Transaksi, Produk, Laporan, Pengaturan. Pengaturan berupa menu list yang membuka halaman detail terpisah per item (bukan form gabungan).
- **Mockup yang sudah dibuat** (statis, garis besar, belum interaktif): Transaksi (kasir + keranjang), Manajemen Produk (tabel + halaman Tambah Produk), Laporan Penjualan, Pengaturan Toko (menu → Identitas Toko, menu → Printer Struk & Laci Kas dengan toggle Bluetooth/USB, tes cetak, buka laci kas).
- File kerja desain ada di folder [`design/`](design/) (file `.dc.html` per halaman + `canvas.json`), dibuat lewat Claude Design canvas editor.
- Langkah selanjutnya di tahap desain (kalau masih mau dilanjutkan): ubah dari mockup statis ke prototype yang bisa diklik, baru setelah itu lanjut ke setup tech stack.
