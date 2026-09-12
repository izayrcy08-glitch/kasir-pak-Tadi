import type { PrinterAdapter } from './printerAdapter';
import { noopPrinter } from './noop';

// Deteksi platform & pilih adapter print yang sesuai.
// Android (Capacitor) -> bluetooth.ts, Windows (Web Serial) -> webserial.ts, iOS -> noop.ts.
// Implementasi bluetooth.ts/webserial.ts menyusul saat fitur Pengaturan > Printer dibangun.
export function getPrinterAdapter(): PrinterAdapter {
  return noopPrinter;
}
