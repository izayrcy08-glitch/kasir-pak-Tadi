export interface RentangTanggal {
  mulai: Date;
  akhir: Date;
}

export type PresetRentang = 'hari_ini' | 'minggu_ini' | 'bulan_ini';

export function awalHari(tanggal: Date): Date {
  const hasil = new Date(tanggal);
  hasil.setHours(0, 0, 0, 0);
  return hasil;
}

export function akhirHari(tanggal: Date): Date {
  const hasil = new Date(tanggal);
  hasil.setHours(23, 59, 59, 999);
  return hasil;
}

// Minggu = Senin s.d. Minggu (ISO week), bukan Minggu-Sabtu — konvensi hari
// kerja toko Indonesia (Senin-Sabtu) lebih cocok dimulai dari Senin.
export function awalMinggu(sekarang: Date): Date {
  const hari = sekarang.getDay(); // 0 = Minggu, 1 = Senin, ...
  const mundur = hari === 0 ? 6 : hari - 1;
  const hasil = awalHari(sekarang);
  hasil.setDate(hasil.getDate() - mundur);
  return hasil;
}

// Bulan berjalan = tanggal 1 s.d. hari ini (month-to-date), bukan 30 hari
// terakhir — pemilik toko berpikir dalam siklus kalender ("omzet bulan ini").
export function awalBulan(sekarang: Date): Date {
  return awalHari(new Date(sekarang.getFullYear(), sekarang.getMonth(), 1));
}

export function hitungRentangPreset(preset: PresetRentang, sekarang: Date): RentangTanggal {
  const akhir = akhirHari(sekarang);
  switch (preset) {
    case 'hari_ini':
      return { mulai: awalHari(sekarang), akhir };
    case 'minggu_ini':
      return { mulai: awalMinggu(sekarang), akhir };
    case 'bulan_ini':
      return { mulai: awalBulan(sekarang), akhir };
  }
}
