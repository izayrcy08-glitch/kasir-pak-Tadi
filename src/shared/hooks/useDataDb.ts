import { useEffect, useState } from 'react';
import { pantauTabel } from '../db/klienDb';
import type { TabelDb } from '../db/operasi/tabelDiubah';

// Baca data dari SQLite dan muat ulang otomatis tiap ada operasi tulis ke
// `tabel`. `ambil` harus stabil (useCallback / fungsi level modul) — kalau
// berubah, data dimuat ulang.
export function useDataDb<T>(ambil: () => Promise<T>, tabel: readonly TabelDb[]) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const kunciTabel = tabel.join(',');

  useEffect(() => {
    let batal = false;
    const muat = () => {
      ambil()
        .then((hasil) => {
          if (batal) return;
          setData(hasil);
          setError(null);
          setLoading(false);
        })
        .catch((err: unknown) => {
          if (batal) return;
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        });
    };
    muat();
    const lepas = pantauTabel(kunciTabel.split(',') as TabelDb[], muat);
    return () => {
      batal = true;
      lepas();
    };
  }, [ambil, kunciTabel]);

  return { data, loading, error };
}
