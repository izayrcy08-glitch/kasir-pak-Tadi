# Fitur Auth

Tidak ada mockup `.dc.html` — halaman ini dibuat mengikuti token & pola visual halaman lain (card putih di atas `--color-bg-app`, lihat `LoginPage.module.css`).

## Aturan bisnis
- Firebase Auth Email/Password, **satu akun sharing** dipakai Pak Tadi & istri bersama — tidak ada fitur signup/lupa password di UI (akun dibuat manual lewat Firebase Console oleh pemilik project).
- Sesi persist otomatis per device (default Firebase Auth) — login cuma sekali per device, bukan tiap buka app.
- Semua route di `App.tsx` kecuali `/login` dibungkus `<RequireAuth />` (`src/app/RequireAuth.tsx`) — redirect ke `/login` kalau belum login, dan balik ke halaman asal setelah login berhasil (lewat `location.state.dari`).
- Logout ada di menu Pengaturan (`PengaturanMenuPage.tsx`), bukan halaman terpisah.
- Pesan error login sengaja **sama** untuk email-tidak-ada dan password-salah (`pesanErrorAuth.ts`) — supaya tidak bocorkan info email mana yang terdaftar.

## Struktur
- `logic/pesanErrorAuth.ts` — pure function pemetaan kode error Firebase Auth ke pesan Indonesia, test di `logic/__tests__/`.
- `hooks/useAuth.ts` — subscribe status login (`onAuthStateChanged` via `shared/firebase/auth.repo.ts`).
- `LoginPage.tsx` — satu-satunya halaman fitur ini.
