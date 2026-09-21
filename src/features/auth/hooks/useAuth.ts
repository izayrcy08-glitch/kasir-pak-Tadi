import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { subscribeStatusAuth } from '../../../shared/firebase/auth.repo';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeStatusAuth((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
}
