export interface PrinterAdapter {
  isSupported(): boolean;
  connect(): Promise<void>;
  printReceipt(bytes: Uint8Array): Promise<void>;
  openCashDrawer(): Promise<void>;
}

// Galat printer yang pesannya sudah ramah untuk kasir (bahasa Indonesia,
// berisi langkah perbaikan) — ditampilkan apa adanya oleh pesanGagalCetak().
export class GalatPrinter extends Error {
  override name = 'GalatPrinter';
}
