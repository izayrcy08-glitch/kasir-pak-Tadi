// Id dokumen agregat harian ('YYYY-MM-DD') pakai waktu lokal perangkat, bukan
// UTC — ini POS satu toko, jam tokolah yang relevan untuk pengelompokan
// omzet per hari, bukan zona waktu server.
export function idHariIni(sekarang: Date = new Date()): string {
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, '0');
  const tanggal = String(sekarang.getDate()).padStart(2, '0');
  return `${tahun}-${bulan}-${tanggal}`;
}
