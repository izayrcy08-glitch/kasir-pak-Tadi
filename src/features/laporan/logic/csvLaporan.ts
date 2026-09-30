// Ekspor laporan penjualan ke CSV: satu baris per transaksi, dibuka di
// Excel/Google Sheets.
//
// Format dipilih supaya langsung benar saat dibuka dengan dobel-klik di Excel
// Windows berbahasa/region Indonesia:
// - Pemisah kolom titik koma (;) — list separator bawaan region Indonesia;
//   Google Sheets mendeteksinya otomatis.
// - Diawali BOM UTF-8 supaya Excel tidak merusak huruf non-ASCII.
// - Tanggal 'YYYY-MM-DD' (bukan 30/09/2026) — satu-satunya format yang dibaca
//   sebagai tanggal yang sama oleh Excel di region mana pun.
// - Uang ditulis angka polos (125000), bukan "Rp 125.000", supaya bisa
//   dijumlah.
import { formatWaktu } from '../../../shared/lib/formatTanggal';
import { idHariIni } from '../../../shared/lib/idHariIni';
import type { MetodeBayar, Transaksi } from '../../../shared/types/transaksi';

export const AWALAN_BERKAS_CSV = 'laporan-penjualan-';

const PEMISAH = ';';
const BARIS_BARU = '\r\n';

const LABEL_METODE: Record<MetodeBayar, string> = {
  tunai: 'Tunai',
  qris_transfer: 'QRIS',
};

const KOLOM = ['Tanggal', 'Jam', 'Metode Bayar', 'Barang', 'Subtotal', 'Diskon', 'Total'];

export function buatCsvLaporan(daftar: Transaksi[]): string {
  const baris = daftar.map((t) => {
    const waktu = new Date(t.dibuatPada);
    return [
      idHariIni(waktu),
      formatWaktu(waktu),
      LABEL_METODE[t.metodeBayar],
      sel(t.item.map((it) => `${it.nama} x${it.qty}`).join(', ')),
      String(t.subtotal),
      String(t.totalDiskon),
      String(t.total),
    ].join(PEMISAH);
  });
  return '﻿' + [KOLOM.join(PEMISAH), ...baris].join(BARIS_BARU) + BARIS_BARU;
}

// Sel teks bebas (nama produk dari pengguna). Teks yang diawali = + - @ dibuka
// Excel sebagai rumus — diberi awalan ' supaya tetap tampil sebagai teks
// (mencegah "CSV injection"). Sel yang berisi pemisah, kutip, atau baris baru
// dibungkus kutip ganda sesuai RFC 4180.
function sel(teks: string): string {
  const aman = /^[=+\-@\t\r]/.test(teks) ? `'${teks}` : teks;
  return /[";\r\n]/.test(aman) ? `"${aman.replace(/"/g, '""')}"` : aman;
}

export function namaBerkasCsv(mulai: Date, akhir: Date): string {
  const idMulai = idHariIni(mulai);
  const idAkhir = idHariIni(akhir);
  return idMulai === idAkhir ? `${AWALAN_BERKAS_CSV}${idMulai}.csv` : `${AWALAN_BERKAS_CSV}${idMulai}-sd-${idAkhir}.csv`;
}
