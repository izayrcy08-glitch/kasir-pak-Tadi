# Kasir Pak Tadi

Aplikasi kasir untuk toko sparepart motor/mobil. Solo dev non-teknis, sepenuhnya AI-assisted ("vibe coding"). **Ini bukan proyek MVP yang boleh asal jalan** — akan dipakai produksi sehari-hari oleh Pak Tadi & istri untuk transaksi & stok toko sungguhan. "MVP" di `DAFTAR-FITUR.md` hanya soal cakupan fitur, bukan standar kualitas kode.

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
| Butuh tahu... | Baca |
|---|---|
| Alasan arsitektur & tradeoff | `CATATAN-KEPUTUSAN.md` |
| Spek fitur lengkap (cakupan vs di luar cakupan) | `DAFTAR-FITUR.md` |
| Mockup asli per halaman | `design/*.dc.html` |
| Aturan bisnis spesifik fitur | `src/features/<fitur>/CLAUDE.md` |

## Perintah
`npm run dev` / `npm run check` / `npm run build` / `npm run emulate` (Firebase Emulator lokal) / `npm run format`
