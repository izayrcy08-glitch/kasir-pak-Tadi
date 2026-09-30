import { idHariIni } from '../../../../shared/lib/idHariIni';

// Pengingat muncul kalau backup terakhir sudah selama ini (atau belum pernah
// sama sekali padahal sudah ada data).
export const BATAS_HARI_PENGINGAT = 7;

const MS_PER_HARI = 24 * 60 * 60 * 1000;

// Nama file backup: backup-kasir-YYYY-MM-DD-HHmm.sqlite3 (jam lokal toko).
// Awalan tetap "backup-kasir" supaya mudah dikenali di WhatsApp/Files, dan
// dipakai untuk membersihkan file lama di cache Android.
export const AWALAN_BERKAS_BACKUP = 'backup-kasir-';

export function namaBerkasBackup(waktu: Date): string {
  const jam = String(waktu.getHours()).padStart(2, '0');
  const menit = String(waktu.getMinutes()).padStart(2, '0');
  return `${AWALAN_BERKAS_BACKUP}${idHariIni(waktu)}-${jam}${menit}.sqlite3`;
}

// Selisih hari kalender (jam lokal), bukan kelipatan 24 jam: backup kemarin
// jam 23.00 dilihat hari ini jam 08.00 = "kemarin" (1 hari).
export function selisihHariKalender(dari: Date, ke: Date): number {
  const awalHari = (t: Date) => new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  return Math.round((awalHari(ke) - awalHari(dari)) / MS_PER_HARI);
}

export function perluPengingatBackup(
  status: { terakhirBackupPada: number | null; adaData: boolean },
  sekarang: Date,
): boolean {
  if (status.terakhirBackupPada === null) return status.adaData;
  return selisihHariKalender(new Date(status.terakhirBackupPada), sekarang) >= BATAS_HARI_PENGINGAT;
}

// Banner pengingat di halaman utama boleh ditutup (✕) untuk "periode telat"
// yang sedang berjalan: tetap tersembunyi sampai ada backup baru, lalu boleh
// muncul lagi kalau backup baru itu pun sudah telat. Tanda di menu Pengaturan
// tidak ikut tersembunyi. Nilai yang disimpan saat menutup = penandaPeriodePengingat().
export function penandaPeriodePengingat(terakhirBackupPada: number | null): string {
  return terakhirBackupPada === null ? 'belum-pernah' : String(terakhirBackupPada);
}

export function bannerPengingatDitutup(ditutupUntuk: string | null, terakhirBackupPada: number | null): boolean {
  return ditutupUntuk === penandaPeriodePengingat(terakhirBackupPada);
}
