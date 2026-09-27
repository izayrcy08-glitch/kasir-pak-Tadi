export type MetodeBayar = 'tunai' | 'qris_transfer';

export type Diskon = { tipe: 'nominal' | 'persen'; nilai: number } | null;

// Snapshot lini keranjang di dalam transaksi tersimpan — nama & harga
// diambil ulang dari dokumen produk saat commit transaksi (bukan dari cache
// UI), supaya histori penjualan akurat walau harga/nama produk berubah
// setelahnya (prinsip sama dengan "jangan menimpa histori harga lama" di
// fitur Produk).
export interface ItemTransaksi {
  produkId: string;
  nama: string;
  kodePart?: string;
  hargaSatuan: number;
  qty: number;
  subtotalItem: number;
}

export interface Transaksi {
  id: string;
  item: ItemTransaksi[];
  subtotal: number;
  diskon: Diskon;
  totalDiskon: number;
  total: number;
  metodeBayar: MetodeBayar;
  dibayar?: number;
  kembalian?: number;
  dibuatPada: number; // epoch ms
}

// Payload dari UI ke repo — hanya id+qty, harga/nama otoritatif diambil
// ulang di dalam runTransaction supaya tidak bisa dimanipulasi dari cache UI.
export interface ItemTransaksiInput {
  produkId: string;
  qty: number;
}

export interface TransaksiDraft {
  item: ItemTransaksiInput[];
  diskon: Diskon;
  metodeBayar: MetodeBayar;
  dibayar?: number;
}
