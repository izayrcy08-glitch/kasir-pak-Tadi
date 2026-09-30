// Mode pemantau = iPhone/iPad. iOS bukan stasiun kasir (tidak bisa cetak
// struk, lihat CATATAN-KEPUTUSAN.md) dan tidak tersambung ke data kasir —
// isinya hanya salinan dari file backup kasir, jadi di sana data hanya boleh
// DILIHAT. Kalau iOS ikut mencatat transaksi/mengubah produk, perubahan itu
// tidak akan pernah sampai ke kasir dan hilang saat file berikutnya dimuat.
//
// Ditentukan otomatis dari perangkat (bukan setelan yang bisa diubah) supaya
// tablet kasir tidak mungkin tidak sengaja masuk mode pemantau, dan iPhone
// tidak mungkin tidak sengaja jadi kasir kedua.
function adalahIos(): boolean {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return true;
  // iPadOS 13+ mengaku "Macintosh"; bedanya dengan Mac sungguhan: layar sentuh.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

// Uji di browser dev (bukan iPhone): localStorage['paksa-mode-pemantau'] = '1'
// lalu muat ulang. Hanya berlaku di `npm run dev`.
function dipaksaDiDev(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return localStorage.getItem('paksa-mode-pemantau') === '1';
  } catch {
    return false;
  }
}

export const MODE_PEMANTAU: boolean = adalahIos() || dipaksaDiDev();
