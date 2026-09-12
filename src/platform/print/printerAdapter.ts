export interface PrinterAdapter {
  isSupported(): boolean;
  connect(): Promise<void>;
  printReceipt(bytes: Uint8Array): Promise<void>;
  openCashDrawer(): Promise<void>;
}
