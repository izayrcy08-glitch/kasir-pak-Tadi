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
  dibuatPada: number; // epoch ms
  diperbaruiPada: number; // epoch ms
}

export type ProdukInput = Omit<Produk, 'id' | 'dibuatPada' | 'diperbaruiPada'>;
