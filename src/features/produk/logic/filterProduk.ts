import type { Produk } from '../../../shared/types/produk';

export function filterProduk(daftar: Produk[], kataKunci: string, kategori: string): Produk[] {
  const kunci = kataKunci.trim().toLowerCase();

  return daftar.filter((p) => {
    const cocokKategori = kategori === 'Semua' || p.kategori === kategori;
    if (!cocokKategori) return false;
    if (!kunci) return true;

    const cocokNama = p.nama.toLowerCase().includes(kunci);
    const cocokKode = (p.kodePart ?? '').toLowerCase().includes(kunci);
    return cocokNama || cocokKode;
  });
}
