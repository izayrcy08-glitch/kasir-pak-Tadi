export const DEFAULT_AMBANG_STOK_RENDAH = 5;

export function hitungStokRendah(stok: number, ambangOverride?: number): boolean {
  const ambang = ambangOverride ?? DEFAULT_AMBANG_STOK_RENDAH;
  return stok < ambang;
}
