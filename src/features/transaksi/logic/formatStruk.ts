import { formatRupiah } from '../../../shared/lib/formatRupiah';
import type { Diskon, ItemTransaksi, MetodeBayar } from '../../../shared/types/transaksi';
import type { RingkasanTotal } from './hitungTotal';

export interface DataStruk {
  transaksiId: string;
  item: ItemTransaksi[];
  ringkasan: RingkasanTotal;
  diskon: Diskon;
  metodeBayar: MetodeBayar;
  dibayar?: number;
  kembalian?: number;
  dibuatPada: Date;
}

const LABEL_METODE: Record<MetodeBayar, string> = {
  tunai: 'Tunai',
  qris_transfer: 'QRIS/Transfer',
};

// Format teks polos struk — dipakai sebagai payload printReceipt (di-encode
// TextEncoder di titik pemanggilan). Sengaja tidak tahu apa-apa soal
// identitas toko (logo/nama) karena fitur Pengaturan Toko belum ada;
// pemanggil bisa menambahkan header itu sebelum baris ini.
export function formatStruk(data: DataStruk): string {
  const baris: string[] = [];
  baris.push(`No. Transaksi: ${data.transaksiId}`);
  baris.push(data.dibuatPada.toLocaleString('id-ID'));
  baris.push('--------------------------------');
  for (const it of data.item) {
    baris.push(it.nama);
    baris.push(`  ${it.qty} x ${formatRupiah(it.hargaSatuan)} = ${formatRupiah(it.subtotalItem)}`);
  }
  baris.push('--------------------------------');
  baris.push(`Subtotal: ${formatRupiah(data.ringkasan.subtotal)}`);
  if (data.diskon) {
    baris.push(`Diskon: - ${formatRupiah(data.ringkasan.totalDiskon)}`);
  }
  baris.push(`Total: ${formatRupiah(data.ringkasan.total)}`);
  baris.push(`Metode Bayar: ${LABEL_METODE[data.metodeBayar]}`);
  if (data.metodeBayar === 'tunai') {
    baris.push(`Dibayar: ${formatRupiah(data.dibayar ?? 0)}`);
    baris.push(`Kembalian: ${formatRupiah(data.kembalian ?? 0)}`);
  }
  return baris.join('\n');
}
