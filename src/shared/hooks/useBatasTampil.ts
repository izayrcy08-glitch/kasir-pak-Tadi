import { useState } from 'react';

// Batasi berapa banyak item daftar yang dirender: mulai `ukuranHalaman`,
// bertambah per halaman lewat lebihBanyak(), kembali ke awal lewat
// lebihSedikit(). Kembali ke halaman pertama sendiri tiap `kunciReset`
// berubah (mis. kata kunci pencarian / kategori diganti).
export function useBatasTampil(ukuranHalaman: number, kunciReset: string) {
  const [halaman, setHalaman] = useState(1);
  const [kunciTerakhir, setKunciTerakhir] = useState(kunciReset);
  // Reset saat render (bukan di effect) supaya tidak ada satu render dengan
  // batas lama untuk daftar baru.
  if (kunciTerakhir !== kunciReset) {
    setKunciTerakhir(kunciReset);
    setHalaman(1);
  }
  return {
    batas: halaman * ukuranHalaman,
    lebihBanyak: () => setHalaman((h) => h + 1),
    lebihSedikit: () => setHalaman(1),
  };
}
