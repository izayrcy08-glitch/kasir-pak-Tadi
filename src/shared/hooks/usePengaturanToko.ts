import { panggil } from '../db/klienDb';
import { useDataDb } from './useDataDb';

const ambilPengaturan = () => panggil('ambilPengaturanToko');
const TABEL = ['pengaturan_toko'] as const;

export function usePengaturanToko() {
  const { data, loading, error } = useDataDb(ambilPengaturan, TABEL);
  return { pengaturan: data ?? null, loading, error };
}
