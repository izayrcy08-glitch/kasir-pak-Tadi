import type { PrinterAdapter } from './printerAdapter';

// Tipe minimal Web Serial API (belum ada di lib TypeScript bawaan) — cukup
// bagian yang dipakai di sini, adaptasi dari printViaWebSerial() di proyek
// lama aplikasi-monitoring-spa/src/lib/thermal-escpos.ts (sudah terbukti
// jalan ke printer thermal USB asli).
interface SerialPortLike {
  open(options: { baudRate: number; bufferSize?: number }): Promise<void>;
  close(): Promise<void>;
  writable: WritableStream<Uint8Array> | null;
}

interface SerialNavigator extends Navigator {
  serial: {
    getPorts(): Promise<SerialPortLike[]>;
    requestPort(): Promise<SerialPortLike>;
  };
}

// Banyak printer thermal USB/Bluetooth murah pakai 9600, sebagian 115200
// atau 38400 — dicoba berurutan sampai salah satu berhasil kirim.
const BAUD_RATE_FALLBACK = [9600, 115200, 38400];

let portTersambung: SerialPortLike | null = null;

function ambilSerialNavigator(): SerialNavigator | null {
  if (typeof navigator === 'undefined' || !('serial' in navigator)) return null;
  return navigator as SerialNavigator;
}

function tidur(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function tulisKePort(port: SerialPortLike, bytes: Uint8Array): Promise<void> {
  if (!port.writable) throw new Error('Port serial tidak bisa ditulis.');
  const writer = port.writable.getWriter();
  const UKURAN_CHUNK = 512;
  try {
    for (let i = 0; i < bytes.byteLength; i += UKURAN_CHUNK) {
      await writer.write(bytes.subarray(i, i + UKURAN_CHUNK));
    }
  } finally {
    writer.releaseLock();
  }
}

// Buka koneksi, kirim data, jeda sebentar (flush), lalu tutup lagi —
// dicoba di tiap baud rate sampai ada yang berhasil. Port sengaja tidak
// dibiarkan terbuka antar-cetak supaya tidak konflik dengan aplikasi lain
// yang mungkin memakai port COM yang sama.
async function kirimKePrinter(port: SerialPortLike, bytes: Uint8Array): Promise<void> {
  let errorTerakhir: unknown;
  for (const baudRate of BAUD_RATE_FALLBACK) {
    try {
      await port.open({ baudRate, bufferSize: 16384 });
      try {
        await tulisKePort(port, bytes);
        await tidur(400);
      } finally {
        await port.close().catch(() => {});
      }
      return;
    } catch (err) {
      errorTerakhir = err;
      await port.close().catch(() => {});
      await tidur(150);
    }
  }
  throw errorTerakhir instanceof Error ? errorTerakhir : new Error('Gagal kirim ke printer serial.');
}

// Dipakai di Windows (USB, lewat Web Serial API browser). Tidak ada unit
// test otomatis untuk file ini — vitest di proyek ini jalan di environment
// Node tanpa Web Serial API sungguhan, jadi diverifikasi manual lewat
// browser (lihat verifikasi UI di ringkasan tugas).
export const webSerialPrinter: PrinterAdapter = {
  isSupported() {
    return ambilSerialNavigator() !== null;
  },

  async connect() {
    const nav = ambilSerialNavigator();
    if (!nav) throw new Error('Web Serial tidak didukung di browser ini.');
    // Selalu minta pilih port lewat dialog OS, jangan diam-diam pakai port
    // tersimpan dari sesi sebelumnya — port yang salah bisa bikin printer
    // cetak kertas kosong tanpa error yang jelas.
    portTersambung = await nav.serial.requestPort();
  },

  async printReceipt(bytes) {
    const nav = ambilSerialNavigator();
    if (!nav) throw new Error('Web Serial tidak didukung di browser ini.');
    if (!portTersambung) {
      // Belum pernah connect() eksplisit di sesi ini (mis. cetak otomatis
      // setelah bayar) — pakai port yang browser sudah izinkan sebelumnya
      // supaya tidak perlu gesture baru. Kalau belum pernah diizinkan sama
      // sekali, requestPort() di sini butuh gesture aktif dan akan gagal;
      // itu ditangkap best-effort oleh pemanggil (lihat TransaksiPage).
      const portDiizinkan = await nav.serial.getPorts();
      portTersambung = portDiizinkan[0] ?? (await nav.serial.requestPort());
    }
    await kirimKePrinter(portTersambung, bytes);
  },

  async openCashDrawer() {
    // Tidak dipakai di UI saat ini — PengaturanPrinterPage mengirim command
    // buka laci lewat printReceipt(buildBukaLaciKas()) langsung. Disediakan
    // no-op supaya tetap memenuhi interface PrinterAdapter.
  },
};
