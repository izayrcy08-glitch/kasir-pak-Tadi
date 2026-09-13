import { useEffect, useState } from 'react';
import { subscribePengaturanToko } from '../firebase/pengaturanToko.repo';
import type { PengaturanToko } from '../types/pengaturanToko';

export function usePengaturanToko() {
  const [pengaturan, setPengaturan] = useState<PengaturanToko | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = subscribePengaturanToko(
      (data) => {
        setPengaturan(data);
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

  return { pengaturan, loading, error };
}
