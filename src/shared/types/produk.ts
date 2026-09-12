import type { Timestamp } from 'firebase/firestore';

export type SatuanProduk = 'pcs' | 'set' | 'liter' | 'dus';

export interface Produk {
  id: string;
  kodePart?: string;
  nama: string;
  kategori: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  satuan: SatuanProduk;
  kompatibilitas?: string;
  ambangStokRendah?: number;
  dibuatPada: Timestamp;
  diperbaruiPada: Timestamp;
}

export type ProdukInput = Omit<Produk, 'id' | 'dibuatPada' | 'diperbaruiPada'>;
