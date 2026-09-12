import { useEffect, useState } from 'react';
import { subscribeProduk } from '../../../shared/firebase/produk.repo';
import type { Produk } from '../../../shared/types/produk';

export function useProduk() {
  const [daftar, setDaftar] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeProduk(
      (data) => {
        setDaftar(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return { daftar, loading, error };
}
