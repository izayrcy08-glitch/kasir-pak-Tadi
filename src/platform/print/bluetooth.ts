import { Capacitor } from '@capacitor/core';
import { BluetoothClassic } from '@nosslabs/bluetooth-classic';
import { GalatPrinter, type PrinterAdapter } from './printerAdapter';

// Printer thermal murah pakai Bluetooth Classic (SPP), bukan BLE — Web
// Bluetooth API browser tidak bisa bicara ke jenis ini sama sekali (lihat
// CATATAN-KEPUTUSAN.md), makanya Android dibungkus Capacitor + plugin native
// @nosslabs/bluetooth-classic. Plugin ini dipilih (dibanding alternatif lain)
// karena write()-nya terima raw bytes (number[]), cocok dipasangkan langsung
// dengan escposBuilder.ts tanpa perlu ubah command ESC/POS jadi string.

// Kunci localStorage tempat UI (PengaturanPrinterPage) menyimpan alamat MAC
// printer yang sudah dipilih user dari daftar hasil scan/pairing. Diekspor
// supaya satu sumber kebenaran dipakai bareng oleh UI dan adapter ini.
export const KUNCI_ALAMAT_PRINTER_BLUETOOTH = 'pengaturan-printer-bluetooth-address';

let sedangTerhubung = false;

function platformAndroidNative(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function alamatPrinterTersimpan(): string | null {
  try {
    return window.localStorage.getItem(KUNCI_ALAMAT_PRINTER_BLUETOOTH);
  } catch {
    return null;
  }
}

async function pastikanIzinBluetooth(): Promise<void> {
  const status = await BluetoothClassic.checkPermissions();
  if (status.status === 'granted') return;
  const hasil = await BluetoothClassic.requestPermissions();
  if (hasil.status !== 'granted') {
    throw new GalatPrinter('Izin Bluetooth ditolak — aktifkan lewat pengaturan aplikasi di HP.');
  }
}

async function pastikanBluetoothAktif(): Promise<void> {
  const status = await BluetoothClassic.isEnabled();
  if (!status.enabled) {
    await BluetoothClassic.enable();
  }
}

// Dipakai di Android (native, lewat Capacitor). Tidak ada unit test otomatis
// untuk file ini — vitest jalan di environment Node tanpa plugin native
// sungguhan, jadi diverifikasi manual lewat build APK ke HP fisik.
export const bluetoothPrinter: PrinterAdapter = {
  isSupported() {
    return platformAndroidNative();
  },

  async connect() {
    if (!platformAndroidNative()) {
      throw new GalatPrinter('Bluetooth Classic cuma didukung di aplikasi Android.');
    }
    const alamat = alamatPrinterTersimpan();
    if (!alamat) {
      // Beda dengan Web Serial yang punya dialog pilih port bawaan OS,
      // Bluetooth Classic butuh user pilih device spesifik dulu dari
      // Pengaturan > Printer — tanpa itu tidak ada cara aman menebak
      // device mana yang dimaksud di antara semua device yang di-pairing
      // di HP.
      throw new GalatPrinter('Printer Bluetooth belum dipilih. Buka Pengaturan → Printer Struk & Laci Kas untuk memilih printer.');
    }
    await pastikanIzinBluetooth();
    await pastikanBluetoothAktif();
    await BluetoothClassic.connect({ address: alamat });
    sedangTerhubung = true;
  },

  async printReceipt(bytes) {
    if (!sedangTerhubung) {
      // Belum pernah connect() eksplisit di sesi ini (mis. cetak otomatis
      // setelah bayar) — coba sambung ke device tersimpan dulu, sama
      // seperti pola lazy-connect di webserial.ts.
      await bluetoothPrinter.connect();
    }
    try {
      await BluetoothClassic.write({ data: Array.from(bytes) });
    } catch (err) {
      // Printer mati/di luar jangkauan setelah sempat tersambung — lupakan
      // sambungan lama supaya percobaan berikutnya menyambung ulang, bukan
      // terus menulis ke sambungan yang sudah putus.
      sedangTerhubung = false;
      throw err;
    }
  },

  async openCashDrawer() {
    // Tidak dipakai di UI saat ini — PengaturanPrinterPage mengirim command
    // buka laci lewat printReceipt(buildBukaLaciKas()) langsung. Disediakan
    // no-op supaya tetap memenuhi interface PrinterAdapter.
  },
};
