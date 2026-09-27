// Error bisnis yang harus bisa menyeberang dari sqlite.worker.ts ke UI.
// postMessage hanya meng-clone data biasa — class Error kustom hilang di
// jalan — jadi error dikirim sebagai GalatTerserialisasi lalu dibangun ulang
// di klienDb.ts supaya `instanceof` di UI tetap jalan.

export interface DetailStokKurang {
  produkId: string;
  nama: string;
  diminta: number;
  tersedia: number;
}

export class StokTidakCukupError extends Error {
  readonly detail: DetailStokKurang[];

  constructor(detail: DetailStokKurang[]) {
    super('Stok tidak cukup untuk beberapa produk.');
    this.name = 'StokTidakCukupError';
    this.detail = detail;
  }
}

export class PembayaranKurangError extends Error {
  readonly total: number;
  readonly dibayar: number;

  constructor(total: number, dibayar: number) {
    super('Uang yang dibayar kurang dari total.');
    this.name = 'PembayaranKurangError';
    this.total = total;
    this.dibayar = dibayar;
  }
}

// Jendela/tab lain (atau worker lama yang belum selesai ditutup) masih
// memegang database. Hanya satu yang boleh membukanya — lihat kunci Web Locks
// di sqlite.worker.ts.
export class AplikasiSudahTerbukaError extends Error {
  constructor() {
    super('Aplikasi Kasir sudah terbuka di jendela atau tab lain.');
    this.name = 'AplikasiSudahTerbukaError';
  }
}

// File yang dipilih untuk Pulihkan tidak boleh dipakai menimpa data toko.
export type AlasanBerkasTidakValid = 'bukanBackup' | 'rusak' | 'versiLebihBaru';

const PESAN_BERKAS_TIDAK_VALID: Record<AlasanBerkasTidakValid, string> = {
  bukanBackup: 'File ini bukan file backup Kasir. Pilih file yang namanya diawali "backup-kasir".',
  rusak: 'File backup ini rusak atau tidak utuh. Kirim ulang file-nya dari device asal, lalu coba lagi.',
  versiLebihBaru:
    'File backup ini dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi di device ini dulu, lalu coba lagi.',
};

export class BerkasBackupTidakValidError extends Error {
  readonly alasan: AlasanBerkasTidakValid;

  constructor(alasan: AlasanBerkasTidakValid) {
    super(PESAN_BERKAS_TIDAK_VALID[alasan]);
    this.name = 'BerkasBackupTidakValidError';
    this.alasan = alasan;
  }
}

export type GalatTerserialisasi =
  | { nama: 'StokTidakCukupError'; detail: DetailStokKurang[] }
  | { nama: 'PembayaranKurangError'; total: number; dibayar: number }
  | { nama: 'AplikasiSudahTerbukaError' }
  | { nama: 'BerkasBackupTidakValidError'; alasan: AlasanBerkasTidakValid }
  | { nama: 'Error'; pesan: string };

export function serialisasiGalat(err: unknown): GalatTerserialisasi {
  if (err instanceof StokTidakCukupError) return { nama: 'StokTidakCukupError', detail: err.detail };
  if (err instanceof PembayaranKurangError) {
    return { nama: 'PembayaranKurangError', total: err.total, dibayar: err.dibayar };
  }
  if (err instanceof AplikasiSudahTerbukaError) return { nama: 'AplikasiSudahTerbukaError' };
  if (err instanceof BerkasBackupTidakValidError) return { nama: 'BerkasBackupTidakValidError', alasan: err.alasan };
  return { nama: 'Error', pesan: err instanceof Error ? err.message : String(err) };
}

export function bangunUlangGalat(g: GalatTerserialisasi): Error {
  switch (g.nama) {
    case 'StokTidakCukupError':
      return new StokTidakCukupError(g.detail);
    case 'PembayaranKurangError':
      return new PembayaranKurangError(g.total, g.dibayar);
    case 'AplikasiSudahTerbukaError':
      return new AplikasiSudahTerbukaError();
    case 'BerkasBackupTidakValidError':
      return new BerkasBackupTidakValidError(g.alasan);
    case 'Error':
      return new Error(g.pesan);
  }
}
