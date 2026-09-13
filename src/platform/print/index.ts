import type { PrinterAdapter } from './printerAdapter';
import { noopPrinter } from './noop';
import { webSerialPrinter } from './webserial';

// Deteksi platform & pilih adapter print yang sesuai. Web Serial API tidak
// ada di Android maupun iOS, jadi feature-detect lewat isSupported() sudah
// cukup untuk memilih adapter yang tepat tanpa perlu deteksi user-agent.
// Windows (Chrome/Edge desktop) -> Web Serial (webserial.ts).
// Android (Capacitor Bluetooth Serial) -> bluetooth.ts, menyusul terpisah
// (butuh setup Capacitor + Android SDK, belum dikerjakan). iOS -> noop.ts.
export function getPrinterAdapter(): PrinterAdapter {
  if (webSerialPrinter.isSupported()) return webSerialPrinter;
  return noopPrinter;
}
