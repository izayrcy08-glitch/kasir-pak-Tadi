const formatterTanggalPendek = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export function formatTanggalPendek(tanggal: Date): string {
  return formatterTanggalPendek.format(tanggal);
}

// Intl.DateTimeFormat('id-ID', {hour, minute}) menghasilkan "09.14" (titik),
// bukan "09:14" seperti mockup — jadi format jam manual, bukan lewat Intl.
export function formatWaktu(tanggal: Date): string {
  const jam = String(tanggal.getHours()).padStart(2, '0');
  const menit = String(tanggal.getMinutes()).padStart(2, '0');
  return `${jam}:${menit}`;
}

export function formatRentangTanggal(mulai: Date, akhir: Date): string {
  const tahunSama = mulai.getFullYear() === akhir.getFullYear();
  const bulanSama = tahunSama && mulai.getMonth() === akhir.getMonth();

  if (bulanSama) {
    const formatterHari = new Intl.DateTimeFormat('id-ID', { day: 'numeric' });
    return `${formatterHari.format(mulai)} – ${formatTanggalPendek(akhir)}`;
  }

  return `${formatTanggalPendek(mulai)} – ${formatTanggalPendek(akhir)}`;
}
