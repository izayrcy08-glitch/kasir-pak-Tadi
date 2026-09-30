import { useSyncExternalStore } from 'react';

// true selama media query cocok, ikut berubah saat layar diputar/diubah ukurannya.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (beriTahu) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', beriTahu);
      return () => mql.removeEventListener('change', beriTahu);
    },
    () => window.matchMedia(query).matches,
  );
}
