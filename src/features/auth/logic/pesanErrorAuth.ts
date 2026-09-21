const PESAN_PER_KODE: Record<string, string> = {
  'auth/invalid-credential': 'Email atau password salah.',
  'auth/wrong-password': 'Email atau password salah.',
  'auth/user-not-found': 'Email atau password salah.',
  'auth/invalid-email': 'Format email tidak valid.',
  'auth/user-disabled': 'Akun ini dinonaktifkan. Hubungi admin.',
  'auth/too-many-requests': 'Terlalu banyak percobaan gagal. Coba lagi beberapa saat lagi.',
  'auth/network-request-failed': 'Gagal terhubung. Periksa koneksi internet, lalu coba lagi.',
};

const PESAN_DEFAULT = 'Gagal masuk. Coba lagi.';

export function pesanErrorAuth(kode: string | undefined): string {
  if (!kode) return PESAN_DEFAULT;
  return PESAN_PER_KODE[kode] ?? PESAN_DEFAULT;
}
