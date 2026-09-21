import type { PrinterAdapter } from './printerAdapter';
import { bluetoothPrinter } from './bluetooth';
import { noopPrinter } from './noop';
import { webSerialPrinter } from './webserial';

// Deteksi platform & pilih adapter print yang sesuai. bluetoothPrinter.isSupported()
// dicek lebih dulu (native Android via Capacitor) karena Web Serial API
// memang tidak ada di Android, jadi urutan pengecekan ini tidak pernah
// tabrakan — feature-detect lewat isSupported() sudah cukup tanpa perlu
// deteksi user-agent.
// Android (Capacitor + @nosslabs/bluetooth-classic) -> bluetooth.ts.
// Windows (Chrome/Edge desktop) -> Web Serial (webserial.ts).
// iOS -> noop.ts (bukan stasiun cetak, lihat CATATAN-KEPUTUSAN.md).
export function getPrinterAdapter(): PrinterAdapter {
  if (bluetoothPrinter.isSupported()) return bluetoothPrinter;
  if (webSerialPrinter.isSupported()) return webSerialPrinter;
  return noopPrinter;
}
