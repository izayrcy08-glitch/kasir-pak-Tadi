import { describe, expect, it } from 'vitest';
import { akhirHari, awalBulan, awalHari, awalMinggu, hitungRentangPreset } from '../rentangTanggal';

describe('awalHari', () => {
  it('mengembalikan tengah malam di hari yang sama', () => {
    const hasil = awalHari(new Date(2026, 8, 11, 15, 30, 20));
    expect(hasil).toEqual(new Date(2026, 8, 11, 0, 0, 0, 0));
  });
});

describe('akhirHari', () => {
  it('mengembalikan akhir hari (23:59:59.999) di hari yang sama', () => {
    const hasil = akhirHari(new Date(2026, 8, 11, 9, 0, 0));
    expect(hasil).toEqual(new Date(2026, 8, 11, 23, 59, 59, 999));
  });
});

describe('awalMinggu', () => {
  it('Rabu (11 Sep 2026) mundur ke Senin minggu yang sama (7 Sep 2026)', () => {
    expect(awalMinggu(new Date(2026, 8, 11))).toEqual(new Date(2026, 8, 7));
  });

  it('Senin tetap di hari itu sendiri', () => {
    expect(awalMinggu(new Date(2026, 8, 7))).toEqual(new Date(2026, 8, 7));
  });

  it('Minggu mundur ke Senin minggu yang sama (bukan maju ke minggu depan)', () => {
    expect(awalMinggu(new Date(2026, 8, 13))).toEqual(new Date(2026, 8, 7));
  });

  it('awal minggu bisa menyeberang ke bulan sebelumnya', () => {
    // 1 Sep 2026 = Selasa -> Senin minggu itu jatuh 31 Agu 2026.
    expect(awalMinggu(new Date(2026, 8, 1))).toEqual(new Date(2026, 7, 31));
  });
});

describe('awalBulan', () => {
  it('mengembalikan tanggal 1 di bulan & tahun yang sama', () => {
    expect(awalBulan(new Date(2026, 8, 11))).toEqual(new Date(2026, 8, 1));
  });
});

describe('hitungRentangPreset', () => {
  const sekarang = new Date(2026, 8, 11, 14, 0, 0);

  it('hari_ini: mulai & akhir di hari yang sama', () => {
    const { mulai, akhir } = hitungRentangPreset('hari_ini', sekarang);
    expect(mulai).toEqual(new Date(2026, 8, 11, 0, 0, 0, 0));
    expect(akhir).toEqual(new Date(2026, 8, 11, 23, 59, 59, 999));
  });

  it('minggu_ini: mulai dari Senin minggu berjalan, akhir hari ini', () => {
    const { mulai, akhir } = hitungRentangPreset('minggu_ini', sekarang);
    expect(mulai).toEqual(new Date(2026, 8, 7));
    expect(akhir).toEqual(new Date(2026, 8, 11, 23, 59, 59, 999));
  });

  it('bulan_ini: mulai dari tanggal 1 bulan berjalan, akhir hari ini', () => {
    const { mulai, akhir } = hitungRentangPreset('bulan_ini', sekarang);
    expect(mulai).toEqual(new Date(2026, 8, 1));
    expect(akhir).toEqual(new Date(2026, 8, 11, 23, 59, 59, 999));
  });
});
