import { panggil } from '../../../shared/db/klienDb';
import { useDataDb } from '../../../shared/hooks/useDataDb';

const ambilDaftarProduk = () => panggil('daftarProduk');
const TABEL = ['produk'] as const;

export function useProduk() {
  const { data, loading, error } = useDataDb(ambilDaftarProduk, TABEL);
  return { daftar: data ?? [], loading, error };
}
