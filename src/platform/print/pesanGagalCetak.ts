import { GalatPrinter } from './printerAdapter';

// Ubah galat cetak apa pun jadi pesan yang bisa ditindaklanjuti kasir.
// Galat dari browser/plugin native berbahasa Inggris & teknis — detail
// aslinya tetap disertakan (dalam kurung) untuk membantu penelusuran.
export function pesanGagalCetak(err: unknown): string {
  if (err instanceof GalatPrinter) return err.message;
  // Web Serial: belum pernah memilih port (butuh ketukan langsung) atau
  // dialog pilih port ditutup tanpa memilih.
  if (err instanceof DOMException && (err.name === 'SecurityError' || err.name === 'NotFoundError')) {
    return 'Printer USB belum dipilih. Tekan "Coba cetak lagi", lalu pilih port printer di jendela yang muncul.';
  }
  const detail = err instanceof Error ? err.message : String(err);
  return `Pastikan printer menyala, kertas terpasang, dan printer dalam jangkauan, lalu coba lagi. (${detail})`;
}
