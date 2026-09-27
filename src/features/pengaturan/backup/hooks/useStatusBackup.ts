import { panggil } from '../../../../shared/db/klienDb';
import type { TabelDb } from '../../../../shared/db/operasi/tabelDiubah';
import { useDataDb } from '../../../../shared/hooks/useDataDb';

const ambil = () => panggil('ambilStatusBackup');
// produk & transaksi ikut dipantau karena menentukan `adaData`.
const TABEL: readonly TabelDb[] = ['status_backup', 'produk', 'transaksi'];

export function useStatusBackup() {
  const { data, loading, error } = useDataDb(ambil, TABEL);
  return { status: data, loading, error };
}
