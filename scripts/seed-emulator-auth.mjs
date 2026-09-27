// Membuat akun uji di Firebase AUTH EMULATOR lokal (localhost:9099) supaya
// halaman di balik login bisa dicoba saat `npm run dev`. Emulator mulai
// kosong tiap dinyalakan, jadi jalankan ini setiap habis `npm run emulate`.
//
// HANYA untuk emulator: alamatnya di-hardcode ke 127.0.0.1, tidak pernah
// menyentuh project Firebase asli. Password di bawah adalah nilai uji,
// bukan password akun toko sungguhan.
const EMULATOR = 'http://127.0.0.1:9099';
const EMAIL = 'kasir@kasirsparepart.app';
const PASSWORD = 'uji-emulator-lokal';

const res = await fetch(`${EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=emulator`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
}).catch(() => null);

if (!res) {
  console.error('Auth emulator tidak jalan. Jalankan dulu: npm run emulate');
  process.exit(1);
}
const body = await res.json();
if (res.ok) console.log(`Akun uji dibuat di emulator: ${EMAIL}`);
else if (body?.error?.message === 'EMAIL_EXISTS') console.log(`Akun uji sudah ada di emulator: ${EMAIL}`);
else {
  console.error('Gagal membuat akun uji:', body?.error?.message ?? res.status);
  process.exit(1);
}
