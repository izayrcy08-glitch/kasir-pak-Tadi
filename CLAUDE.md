# Kasir Pak Tadi

Aplikasi kasir untuk toko sparepart motor/mobil. Solo dev non-teknis, sepenuhnya AI-assisted ("vibe coding"). **Ini bukan proyek MVP yang boleh asal jalan** — akan dipakai produksi sehari-hari oleh Pak Tadi & istri untuk transaksi & stok toko sungguhan. "MVP" di `DAFTAR-FITUR.md` hanya soal cakupan fitur, bukan standar kualitas kode.

## 🔴 Sebelum device dipasang di toko sungguhan (diperbarui 2026-09-27)

Aplikasi offline-only **tanpa login/PIN** (keputusan 2026-09-27, lihat `CATATAN-KEPUTUSAN.md`). Sisa langkah sebelum build dipasang di device toko:

1. **Keystore rilis APK** — buat satu keystore, simpan + backup di luar repo. Jangan pernah pasang build debug di tablet toko (keystore beda = update ditolak = terpaksa uninstall = seluruh data toko hilang).
2. **Kunci layar device wajib aktif** (pola/PIN Android, login Windows) — satu-satunya pengaman akses karena app tidak punya login.
3. Fitur Export/Import + pengingat backup harus sudah ada (tanpa itu, tablet rusak/hilang = data hilang permanen).
4. Uji persistensi data di PWA Windows sungguhan (tutup-buka app, restart laptop).

## Stack (final — lihat CATATAN-KEPUTUSAN.md untuk alasan lengkap)
- Vite + React + TypeScript (PWA), satu codebase untuk Android/Windows/iOS.
- **Data: SQLite-WASM lokal** (`src/shared/db/`, offline-only, satu kasir aktif per waktu) — pivot dari Firestore per 2026-09-27, migrasi berjalan di branch `migrasi-sqlite` (lihat CATATAN-KEPUTUSAN.md "Pivot ke offline-only").
- **Tanpa login/PIN, tanpa Firebase SDK** — Firebase cuma dipakai untuk **Hosting** PWA (`firebase.json`, project `kasir-pak-tadi`).
- Android: dibungkus Capacitor + Bluetooth Serial. Windows: PWA + Web Serial (USB) untuk print. iOS: PWA **mode pemantau** hanya-baca (otomatis di iPhone/iPad, `src/platform/perangkat.ts`) — data = salinan dari file backup kasir, bukan stasiun cetak.
- Laporan dihitung langsung dengan SQL (`SUM`/`GROUP BY`) di `src/shared/db/operasi/laporan.ts`.

## Struktur folder (feature-based)
```
src/app/            AppLayout (sidebar+shell), GerbangDb (tunggu DB terbuka)
src/features/{transaksi,produk,laporan,pengaturan}/
                     logic/ (pure fn + __tests__/) + components/ + hooks/ + CLAUDE.md
src/shared/          db/ (SQLite: worker, skema, operasi/), hooks/, lib/, types/
src/platform/print/  adapter per platform (bluetooth.ts=Android, webserial.ts=Windows, noop.ts=iOS)
src/styles/          tokens.css (design tokens), global.css
```

## Aturan wajib
1. File di `logic/` **dilarang** `import` dari `react` atau `shared/db` — pure function, harus gampang di-unit-test.
2. Semua warna/font/radius/shadow **wajib** dari `src/styles/tokens.css` (`var(--...)`) — dilarang hex/px baru di komponen. Styling pakai **CSS Modules** (`*.module.css`), bukan Tailwind.
3. Penyimpanan transaksi + pengurangan stok wajib satu operasi atomik (SQLite `BEGIN IMMEDIATE`, `src/shared/db/operasi/transaksi.ts`) — lihat `features/transaksi/CLAUDE.md`. Operasi DB dijalankan di dalam worker lewat `panggil()`; jangan pernah menghapus tambalan `patches/@sqlite.org+sqlite-wasm*.patch` (tanpanya, gagal buka DB = seluruh data terhapus).
4. Tidak pernah hardcode credential/secret di kode yang di-commit (keystore rilis & sejenisnya disimpan di luar repo).
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
`npm run dev` / `npm run check` / `npm run build` / `npm run format`
