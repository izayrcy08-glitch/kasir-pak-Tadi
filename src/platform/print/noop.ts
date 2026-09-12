import type { PrinterAdapter } from './printerAdapter';

// Dipakai di iOS (bukan stasiun cetak, sesuai CATATAN-KEPUTUSAN.md) dan sebagai fallback.
export const noopPrinter: PrinterAdapter = {
  isSupported: () => false,
  connect: async () => {},
  printReceipt: async () => {},
  openCashDrawer: async () => {},
};
