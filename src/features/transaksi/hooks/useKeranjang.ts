import { useMemo, useState } from 'react';
import type { Produk } from '../../../shared/types/produk';

export interface ItemKeranjang {
  produkId: string;
  nama: string;
  kodePart?: string;
  hargaSatuan: number;
  qty: number;
  stokTersedia: number;
}

// State keranjang murni lokal (bukan Firestore) — diskon/metode bayar/dibayar
// adalah concern halaman checkout, bukan keranjang, jadi tidak ada di sini.
export function useKeranjang() {
  const [item, setItem] = useState<ItemKeranjang[]>([]);

  function tambah(produk: Produk): void {
    if (produk.stok <= 0) return;
    setItem((daftar) => {
      const ada = daftar.find((it) => it.produkId === produk.id);
      if (ada) {
        return daftar.map((it) =>
          it.produkId === produk.id ? { ...it, qty: Math.min(it.qty + 1, produk.stok) } : it,
        );
      }
      return [
        ...daftar,
        {
          produkId: produk.id,
          nama: produk.nama,
          kodePart: produk.kodePart,
          hargaSatuan: produk.hargaJual,
          qty: 1,
          stokTersedia: produk.stok,
        },
      ];
    });
  }

  function ubahQty(produkId: string, qty: number): void {
    setItem((daftar) =>
      daftar.map((it) =>
        it.produkId === produkId ? { ...it, qty: Math.min(Math.max(qty, 1), it.stokTersedia) } : it,
      ),
    );
  }

  function hapus(produkId: string): void {
    setItem((daftar) => daftar.filter((it) => it.produkId !== produkId));
  }

  function kosongkan(): void {
    setItem([]);
  }

  const subtotal = useMemo(() => item.reduce((acc, it) => acc + it.hargaSatuan * it.qty, 0), [item]);

  return { item, tambah, ubahQty, hapus, kosongkan, subtotal, jumlahItem: item.length };
}
