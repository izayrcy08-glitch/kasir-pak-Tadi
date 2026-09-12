import { describe, expect, it } from 'vitest';
import { DEFAULT_AMBANG_STOK_RENDAH, hitungStokRendah } from '../hitungStokRendah';

describe('hitungStokRendah', () => {
  it('menganggap stok rendah kalau di bawah ambang default', () => {
    expect(hitungStokRendah(DEFAULT_AMBANG_STOK_RENDAH - 1)).toBe(true);
  });

  it('menganggap stok cukup kalau sama dengan atau di atas ambang default', () => {
    expect(hitungStokRendah(DEFAULT_AMBANG_STOK_RENDAH)).toBe(false);
    expect(hitungStokRendah(DEFAULT_AMBANG_STOK_RENDAH + 10)).toBe(false);
  });

  it('memakai ambang kustom per produk kalau diberikan', () => {
    expect(hitungStokRendah(8, 10)).toBe(true);
    expect(hitungStokRendah(8, 5)).toBe(false);
  });
});
