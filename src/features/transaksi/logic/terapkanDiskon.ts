import type { Diskon } from '../../../shared/types/transaksi';

function clamp(nilai: number, min: number, max: number): number {
  return Math.min(Math.max(nilai, min), max);
}

// Menghitung nominal diskon yang benar-benar diterapkan, hasil selalu
// 0..subtotal — memastikan total (subtotal - hasil) tidak pernah negatif.
export function terapkanDiskon(subtotal: number, diskon: Diskon): number {
  if (diskon === null || subtotal <= 0) return 0;

  if (diskon.tipe === 'nominal') {
    return clamp(diskon.nilai, 0, subtotal);
  }

  const persen = clamp(diskon.nilai, 0, 100);
  return clamp(Math.round((subtotal * persen) / 100), 0, subtotal);
}
