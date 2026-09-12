import { describe, expect, it } from 'vitest';
import { terapkanDiskon } from '../terapkanDiskon';

describe('terapkanDiskon', () => {
  it('diskon null menghasilkan 0', () => {
    expect(terapkanDiskon(100000, null)).toBe(0);
  });

  it('nominal di dalam subtotal dipakai apa adanya', () => {
    expect(terapkanDiskon(183000, { tipe: 'nominal', nilai: 10000 })).toBe(10000);
  });

  it('nominal melebihi subtotal di-clamp ke subtotal', () => {
    expect(terapkanDiskon(50000, { tipe: 'nominal', nilai: 999999 })).toBe(50000);
  });

  it('nominal negatif di-clamp ke 0', () => {
    expect(terapkanDiskon(50000, { tipe: 'nominal', nilai: -5000 })).toBe(0);
  });

  it('persen dihitung dan dibulatkan', () => {
    expect(terapkanDiskon(33333, { tipe: 'persen', nilai: 15 })).toBe(5000);
  });

  it('persen di atas 100 di-clamp ke 100% (= subtotal penuh)', () => {
    expect(terapkanDiskon(50000, { tipe: 'persen', nilai: 150 })).toBe(50000);
  });

  it('persen negatif di-clamp ke 0', () => {
    expect(terapkanDiskon(50000, { tipe: 'persen', nilai: -10 })).toBe(0);
  });

  it('subtotal 0 selalu menghasilkan 0 diskon', () => {
    expect(terapkanDiskon(0, { tipe: 'nominal', nilai: 10000 })).toBe(0);
    expect(terapkanDiskon(0, { tipe: 'persen', nilai: 50 })).toBe(0);
  });
});
