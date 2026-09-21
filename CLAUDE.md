# Kasir Pak Tadi

Aplikasi kasir untuk toko sparepart motor/mobil. Solo dev non-teknis, sepenuhnya AI-assisted ("vibe coding"). **Ini bukan proyek MVP yang boleh asal jalan** — akan dipakai produksi sehari-hari oleh Pak Tadi & istri untuk transaksi & stok toko sungguhan. "MVP" di `DAFTAR-FITUR.md` hanya soal cakupan fitur, bukan standar kualitas kode.

## 🔴 Blocker sebelum device dipasang di toko sungguhan (dicatat 2026-09-16)

Belum dikerjakan — tapi **wajib** selesai sebelum build APK/PWA ini dipasang dan dipakai transaksi asli, karena proyek ini cuma punya **satu** project Firebase (langsung produksi, lihat `CATATAN-KEPUTUSAN.md`):

1. **Halaman Login belum ada.** Tidak ada fitur auth apa pun di kode saat ini walau sudah direncanakan (Firebase Auth Email/Password, satu akun sharing).
2. **`firestore.rules` saat ini `allow read, write: if true`** — terbuka untuk siapa saja yang tahu config Firebase (yang selalu ikut terkirim ke browser di web app, jadi bukan rahasia). Ini sengaja dibuat sementara (lihat komentar di file itu) supaya fitur Produk bisa dites lewat emulator sebelum Login ada — **tapi kalau lupa dikembalikan sebelum `firebase deploy --only firestore:rules` ke project asli, data toko (transaksi, stok, harga) terbuka penuh untuk siapa saja.**
3. Urutan yang harus diikuti: bangun halaman Login dulu → ganti `firestore.rules` ke versi wajib-login (versi wajib-login sudah ditulis sebagai komentar di file `firestore.rules`, tinggal diaktifkan) → baru boleh deploy rules ke project Firebase asli dan pasang build di device toko.
4. Belum ada CI — `npm run check` cuma jalan manual di laptop. Bukan blocker produksi, tapi kalau lupa jalankan sebelum commit, disiplin test/lint yang sudah bagus di proyek ini jadi sia-sia.

## Stack (final — lihat CATATAN-KEPUTUSAN.md untuk alasan lengkap)
- Vite + React + TypeScript (PWA), satu codebase untuk Android/Windows/iOS.
- Firebase: **Firestore** (bukan SQL/Realtime Database) + Authentication (Email/Password, satu akun sharing).
- **Satu project Firebase saja** (`kasir-pak-tadi`, langsung produksi) — tidak ada project dev terpisah. Testing lokal pakai **Firebase Emulator Suite** (`npm run emulate`), bukan cloud project kedua.
- Android: dibungkus Capacitor + Bluetooth Serial. Windows: PWA + Web Serial (USB) untuk print. iOS: PWA read/manage-only, **bukan** stasiun cetak.
- Laporan pakai pola agregat/counter (Firestore NoSQL, bukan SQL `SUM`/`GROUP BY`).

## Struktur folder (feature-based)
```
src/app/            AppLayout (sidebar+shell)
src/features/{transaksi,produk,laporan,pengaturan}/
                     logic/ (pure fn + __tests__/) + components/ + hooks/ + CLAUDE.md
src/shared/          components/, firebase/ (config.ts, collections.ts), lib/, types/
src/platform/print/  adapter per platform (bluetooth.ts=Android, webserial.ts=Windows, noop.ts=iOS)
src/styles/          tokens.css (design tokens), global.css
```

## Aturan wajib
1. File di `logic/` **dilarang** `import` dari `react` atau `firebase` — pure function, harus gampang di-unit-test.
2. Semua warna/font/radius/shadow **wajib** dari `src/styles/tokens.css` (`var(--...)`) — dilarang hex/px baru di komponen. Styling pakai **CSS Modules** (`*.module.css`), bukan Tailwind.
3. Penyimpanan transaksi + pengurangan stok wajib satu operasi atomik (Firestore `runTransaction`) — lihat `features/transaksi/CLAUDE.md`.
4. Konfigurasi Firebase selalu lewat env var (`.env.local`, di-gitignore) via `src/shared/firebase/config.ts` — **tidak pernah** hardcode credential di kode yang di-commit. Dev/test selalu `VITE_USE_EMULATOR=true`.
5. Sebelum tugas UI ditandai selesai: wajib verifikasi visual vs `design/*.dc.html` (lihat bagian di bawah).
6. Sebelum tugas ditandai selesai & sebelum commit: jalankan `npm run check` (`tsc -b && oxlint && vitest run`).
7. Commit: Conventional Commits + scope fitur (`feat(transaksi): ...`), satu commit = satu unit kerja yang lolos `npm run check`.

## Verifikasi UI (definition of done untuk tugas UI apa pun)
1. Buka mockup asli `design/<Nama>.dc.html` sebagai acuan.
2. `npm run dev`, buka halaman yang dikerjakan di browser.
3. Bandingkan: warna (bg app/sidebar/card, aksen mustard, alert terracotta), tipografi (Fraunces=heading, Work Sans=body, IBM Plex Mono=SEMUA angka/harga/kode, tabular-nums), spacing & radius (card 20px, tile 14px, tombol 12px, pill 999px), states yang tidak ada di mockup statis (hover, selected, disabled, empty, focus).
4. Penyimpangan yang disengaja (keterbatasan teknis) dicatat alasannya satu baris di ringkasan tugas.

## Kalau butuh detail

File ini sengaja dibuat pendek supaya hemat token tiap sesi baru — file di bawah **hanya
dibaca kalau tugasnya memang menyentuh area itu**, bukan dibaca semua di awal sesi:

| Butuh tahu... | Baca |
|---|---|
| Alasan arsitektur & tradeoff | `CATATAN-KEPUTUSAN.md` |
| Spek fitur lengkap (cakupan vs di luar cakupan) | `DAFTAR-FITUR.md` |
| Mockup asli per halaman | `design/*.dc.html` (buka cuma file `.dc.html` untuk halaman yang dikerjakan, bukan seluruh folder) |
| Aturan bisnis spesifik fitur | `src/features/<fitur>/CLAUDE.md` (cuma folder fitur yang disentuh) |

## Perintah
`npm run dev` / `npm run check` / `npm run build` / `npm run emulate` (Firebase Emulator lokal) / `npm run format`
