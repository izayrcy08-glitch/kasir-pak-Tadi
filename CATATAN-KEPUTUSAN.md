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

> ⚠️ **Diganti sebagian per 2026-09-25**: bullet "Backend & database", "Mode offline & sinkronisasi", dan "Sinkronisasi antar-device" di bawah ini sudah tidak berlaku — lihat bagian [Pivot ke offline-only](#pivot-ke-offline-only-2026-09-25) di bawah untuk keputusan terbaru (SQLite lokal, bukan Firestore).

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
- **Login**: Firebase Auth Email/Password, satu akun sharing (`kasir@kasirsparepart.app`, domain sama seperti appId — tidak perlu domain asli terdaftar, Firebase cuma butuh format email valid). Tidak ada fitur signup/lupa-password di UI — akun dibuat manual sekali lewat Firebase Console oleh pemilik project, baik di project asli maupun di Auth Emulator untuk testing lokal. Pesan error login disamakan untuk "email tidak ada" vs "password salah" (`pesanErrorAuth.ts`) supaya tidak bocorkan email mana yang terdaftar.
- **CI**: GitHub Actions (`.github/workflows/check.yml`), trigger di tiap push ke `main` dan tiap pull request, menjalankan `npm ci` + `npm run check` (tsc + oxlint + vitest) di `ubuntu-latest` dengan Node 24 (sama seperti versi lokal). Sengaja minimal — cuma gate kualitas yang sudah ada, bukan deploy otomatis (deploy tetap manual, karena cuma ada satu project Firebase langsung produksi, lihat [[feedback-firebase-single-project]]).
- **Hosting web (Windows & iOS PWA)**: **Firebase Hosting** — bukan Vercel atau Cloudflare Workers. Alasannya bukan soal kuota (trafik toko ini kecil sekali, gratis di mana pun), tapi dua hal lain: (1) tetap satu vendor/satu dashboard dengan Firestore & Auth yang sudah ada, sesuai filosofi minim moving parts untuk solo dev non-teknis; (2) Vercel Hobby (gratis) **melarang penggunaan komersial** di ToS-nya, sementara aplikasi ini jelas dipakai untuk transaksi bisnis toko sungguhan. Konfigurasi ada di `firebase.json` (`hosting.public = "dist"`, rewrite SPA ke `index.html`, sudah diverifikasi lewat `firebase emulators:start --only hosting`) — **belum pernah di-deploy ke project asli** karena project Firebase produksi sendiri belum dibuat (lihat "Belum dibahas").

## Tradeoff yang disadari & diterima

- Build Android tidak lagi "murni PWA" — perlu di-build ulang lewat Capacitor tiap update besar (Windows/iOS cukup deploy web).
- iPhone tidak bisa jadi stasiun cetak struk dengan printer Bluetooth Classic biasa — keterbatasan dari Apple. Kalau nanti dibutuhkan, satu-satunya jalan adalah printer bersertifikasi MFi/AirPrint (lebih mahal, jarang stok) — belum jadi keputusan sekarang, hanya dicatat sebagai opsi masa depan.
- Firestore itu NoSQL (bukan SQL), jadi fitur Laporan Penjualan (omzet, produk terlaris, breakdown metode bayar) nanti didesain pakai pola "agregat/counter" (angka ringkasan di-update tiap ada transaksi baru), bukan query `SUM`/`GROUP BY` seperti di database SQL.

## Pivot ke offline-only (2026-09-25)

### Alasan

Klien (Pak Tadi) minta aplikasi **tanpa database online sama sekali** — alasannya takut kebijakan free tier Firebase berubah di kemudian hari dan jadi wajib bayar. Sudah dijelaskan trade-off-nya (aplikasi jadi hanya bisa dipakai penuh di **satu device**, tidak ada sync otomatis antar-device) dan klien setuju menerima trade-off itu.

Ini mengganti keputusan "Backend & database: Firebase (Firestore)" dan "Mode offline & sinkronisasi" di bagian atas — **bukan** cuma menambah offline persistence di atas Firestore, tapi database-nya sendiri pindah total ke lokal (SQLite), tidak ada Firestore/Firebase Auth/Firebase Hosting untuk data sama sekali.

### Arsitektur baru

```
Kasir aktif — SATU device saja di satu waktu:
  Android Tablet (.apk via Capacitor)  ATAU  Laptop Windows (PWA)
  SQLite-WASM (file DB di OPFS) — single source of truth
  ├─ semua write (transaksi, stok, produk)
  ├─ transaksi atomik pakai BEGIN/COMMIT SQLite
  └─ print: Bluetooth Classic (Android) / Web Serial USB (Windows)
        │
        │ Export lengkap (backup) — dikirim lewat WhatsApp/USB/dll
        ├──────────────► Pindah kasir: import lengkap di device baru
        │                (menimpa semua data), device lama berhenti jadi kasir
        ▼
iOS PWA (Pemantau)
  Import file → read-only → render laporan
  TIDAK sync balik ke kasir
```

- **Kenapa tetap dianggap "offline" walau kirim file lewat WhatsApp**: transfer file pribadi bukan infrastruktur berbayar milik mereka — beda dengan database cloud yang mereka sewa & bisa berubah kebijakan harganya. Ketakutan klien soal biaya database tetap terhindar sepenuhnya.
- **Auth**: PIN/password lokal menggantikan Firebase Auth (tidak ada login online lagi).
- **Windows (diputuskan 2026-09-27)**: bisa jadi kasir, tapi **bukan kasir kedua yang jalan bareng** — model "pindah kasir". Default kasir di Android; kalau klien mau ganti ke laptop, export lengkap dari Android → import lengkap di laptop → laptop jadi satu-satunya kasir. Dua kasir aktif bersamaan sengaja ditolak: tanpa cloud, dua DB lokal pasti divergen (stok & penjualan tidak cocok) dan tidak ada cara otomatis menggabungkannya. Windows tetap **PWA**, bukan desktop app (Electron).
- **Mesin DB: SQLite-WASM di semua platform** (bukan `capacitor-sqlite` native di Android). Alasan: satu jalur kode simpan-data untuk Android + Windows (+ iOS pemantau); SQL identik di mana-mana; serah-terima data antar-device tanpa konversi format, jadi risiko data rusak saat pindah kasir paling kecil. Trade-off: native Android sedikit lebih cepat & file `.db` lebih gampang di-copy manual — tidak signifikan untuk volume toko ini, dan backup resmi lewat fitur Export.
- **Export/Import lengkap = satu fitur untuk tiga kebutuhan**: pindah kasir, backup/restore (jawaban risiko tablet hilang di bawah), dan sumber data iOS pemantau. Pengaman wajib: import minta konfirmasi eksplisit ("menimpa semua data") + validasi file (format & versi schema) sebelum menimpa; export untuk pindah kasir memberi peringatan bahwa device lama tidak boleh dipakai transaksi lagi.

### Rencana migrasi (belum dieksekusi, untuk sesi berikutnya)

0. ~~Keputusan tersisa~~ — selesai 2026-09-27 (lihat bullet Windows & mesin DB di atas). Format export: file backup lengkap (untuk pindah kasir/restore) + CSV laporan.
1. **Fondasi SQLite-WASM**: install SQLite-WASM, desain schema SQL (mirror struktur Firestore sekarang) + versi schema, bangun `src/shared/db/` (ganti `src/shared/firebase/`), PIN/password lokal. Harus jalan di Android WebView & Chrome/Edge Windows.
2. **Migrasi transaksi** (paling kritis): `runTransaction` Firestore → `BEGIN/COMMIT` SQLite native, tetap jaga transaksi+pengurangan stok 1 operasi atomik (Aturan #3 `CLAUDE.md`). `logic/` tetap pure function (Aturan #1) — SQLite call di layer atasnya.
3. **Migrasi produk & laporan**: CRUD produk ke SQLite; laporan bisa pakai SQL asli (`SUM`/`GROUP BY`) — lebih simpel dari pola agregat NoSQL yang direncanakan sebelumnya.
4. **Fitur Export lengkap** (Android & Windows): tombol di `features/pengaturan/` → file backup lengkap + CSV laporan, share via Android intent / download di Windows.
5. **Fitur Import**: (a) import lengkap di kasir (pindah kasir/restore, menimpa + konfirmasi + validasi); (b) import read-only di iOS pemantau → render laporan (reuse komponen laporan yang ada).
6. **Bersih-bersih**: hapus dependency `firebase`, `firestore.rules`, script `emulate`; update `CLAUDE.md` & catatan ini; `npm run check` harus lolos total.

### Hasil uji coba SQLite-WASM (2026-09-27, Chromium/Windows)

Library `@sqlite.org/sqlite-wasm` 3.53.4, VFS `opfs-sahpool` (jalan di Web Worker, **tidak** butuh header COOP/COEP). Kode di `src/shared/db/`, halaman uji sementara `/uji-db` (dev only).

- ✅ Data tetap ada setelah tab ditutup & dibuka lagi.
- ✅ `exportFile()` menghasilkan file SQLite utuh (header `SQLite format 3`); `importDb()` tersedia untuk restore/pindah kasir.
- ⚠️ Tab/jendela kedua **tidak bisa** membuka DB selama yang pertama masih terbuka (kunci file OPFS). Bagus sebagai pengaman (tidak ada dua penulis), tapi app wajib menampilkan pesan ramah ("aplikasi sudah terbuka di jendela lain"), bukan error mentah.
- ⚠️ `navigator.storage.persisted()` = belum. App harus memanggil `navigator.storage.persist()` supaya browser tidak menghapus data saat ruang disk menipis.
- ⏳ Belum diuji di **Android WebView** (butuh HP/tablet fisik lewat `adb`).

### Risiko yang disadari (belum diselesaikan, jangan lupa)

Tanpa cloud, **data SQLite di tablet hilang permanen kalau tablet rusak/hilang/di-uninstall tanpa backup dulu** — tidak ada safety net otomatis seperti Firestore sebelumnya. Fitur reminder backup rutin sebaiknya masuk scope migrasi, bukan dianggap opsional selamanya. Mekanisme restore-nya sudah tercakup oleh fitur Export/Import lengkap (langkah 4–5); yang masih perlu ditambahkan adalah pengingat rutinnya.

## Belum dibahas (langkah selanjutnya)

- Setup teknis (scaffolding Vite, install Firebase SDK, bikin project Firebase asli di console) — belum dikerjakan, menunggu instruksi lanjut dari user.
- Bikin akun Firebase Auth di project asli (Firebase Console > Authentication > Users) — langkah manual terakhir sebelum device boleh dipasang di toko. Lihat `CLAUDE.md` bagian "Sebelum device dipasang di toko sungguhan".

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
