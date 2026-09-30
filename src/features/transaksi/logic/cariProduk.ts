import type { Produk } from '../../../shared/types/produk';

// Pencarian produk di halaman Transaksi (ketuk kolom cari → daftar muncul →
// ketik untuk menyaring → ketuk barang → masuk keranjang).
//
// - Kata kunci kosong = semua produk (daftar untuk digulir), urut nama.
// - Beberapa kata dicari sekaligus, SEMUA kata harus cocok, di mana pun:
//   nama, kode part, kategori, atau kompatibilitas ("busi beat" → busi yang
//   cocok untuk Beat).
// - Kode part dibandingkan tanpa tanda baca/spasi: "c7hsa" menemukan
//   "BS-C7HSA", "bs c7" juga.
// - Urutan: kode persis → kode diawali kata kunci → nama diawali kata kunci
//   → kata ditemukan di nama → sisanya (mis. hanya di kompatibilitas); barang
//   yang stoknya habis selalu di bawah. Seri diurutkan nama A-Z.

const normal = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
const tanpaTandaBaca = (s: string) => normal(s).replace(/[^a-z0-9]/g, '');

function skor(p: Produk, kunci: string, kata: string[]): number {
  const kode = tanpaTandaBaca(p.kodePart ?? '');
  const kunciKode = tanpaTandaBaca(kunci);
  const nama = normal(p.nama);
  if (kode && kunciKode && kode === kunciKode) return 100;
  if (kode && kunciKode && kode.startsWith(kunciKode)) return 80;
  if (nama.startsWith(normal(kunci))) return 60;
  if (kata.every((k) => nama.includes(k))) return 40;
  return 20;
}

export function cariProduk(daftar: readonly Produk[], kataKunci: string): Produk[] {
  const kunci = kataKunci.trim();
  const kata = normal(kunci).split(/\s+/).filter(Boolean);

  const hasil: { p: Produk; skor: number }[] = [];
  for (const p of daftar) {
    if (kata.length === 0) {
      hasil.push({ p, skor: 0 });
      continue;
    }
    const teks = normal([p.nama, p.kodePart ?? '', p.kategori, p.kompatibilitas ?? ''].join(' '));
    const teksKode = tanpaTandaBaca(p.kodePart ?? '');
    const cocok = kata.every((k) => teks.includes(k) || (teksKode !== '' && teksKode.includes(tanpaTandaBaca(k))));
    if (cocok) hasil.push({ p, skor: skor(p, kunci, kata) });
  }

  return hasil
    .sort(
      (a, b) =>
        Number(a.p.stok <= 0) - Number(b.p.stok <= 0) ||
        b.skor - a.skor ||
        a.p.nama.localeCompare(b.p.nama, 'id'),
    )
    .map((h) => h.p);
}
