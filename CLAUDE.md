# Kasir Pak Tadi

Aplikasi kasir untuk toko sparepart motor/mobil. Solo dev non-teknis, sepenuhnya AI-assisted ("vibe coding"). **Ini bukan proyek MVP yang boleh asal jalan** — akan dipakai produksi sehari-hari oleh Pak Tadi & istri untuk transaksi & stok toko sungguhan. "MVP" di `DAFTAR-FITUR.md` hanya soal cakupan fitur, bukan standar kualitas kode.

## 🔴 Sebelum device dipasang di toko sungguhan (diperbarui 2026-09-21)

Halaman Login sudah ada (`src/features/auth/`) dan `firestore.rules` sudah wajib-login (`request.auth != null`). Sisa langkah manual sebelum deploy ke project Firebase asli & pasang build di device toko:

1. **Buat akun Firebase Auth di project asli** — Firebase Console > Authentication > Users > Add user, pakai email+password yang sudah disepakati. Ini harus dilakukan manual oleh pemilik project (Claude tidak boleh membuat akun produksi secara otomatis).
2. Pastikan `firestore.rules` yang ter-deploy memang versi wajib-login (`allow read, write: if request.auth != null`) — cek file ini sebelum tiap `firebase deploy --only firestore:rules`, karena project cuma satu (langsung produksi, lihat `CATATAN-KEPUTUSAN.md`).

## Stack (final — lihat CATATAN-KEPUTUSAN.md untuk alasan lengkap)
- Vite + React + TypeScript (PWA), satu codebase untuk Android/Windows/iOS.
- Firebase: **Firestore** (bukan SQL/Realtime Database) + Authentication (Email/Password, satu akun sharing).
- **Satu project Firebase saja** (`kasir-pak-tadi`, langsung produksi) — tidak ada project dev terpisah. Testing lokal pakai **Firebase Emulator Suite** (`npm run emulate`), bukan cloud project kedua.
- Android: dibungkus Capacitor + Bluetooth Serial. Windows: PWA + Web Serial (USB) untuk print. iOS: PWA read/manage-only, **bukan** stasiun cetak.
- Laporan pakai pola agregat/counter (Firestore NoSQL, bukan SQL `SUM`/`GROUP BY`).

## Struktur folder (feature-based)
```
src/app/            AppLayout (sidebar+shell), RequireAuth (route guard)
src/features/{auth,transaksi,produk,laporan,pengaturan}/
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
6. Sebelum tugas ditandai selesai & sebelum commit: jalankan `npm run check` (`tsc -b && oxlint && vitest run`). CI (`.github/workflows/check.yml`) menjalankan ulang ini tiap push ke GitHub sebagai pengaman kedua kalau lupa jalankan manual.
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
