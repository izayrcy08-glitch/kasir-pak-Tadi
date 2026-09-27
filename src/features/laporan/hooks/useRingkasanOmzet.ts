import { useEffect, useState } from 'react';
import { panggil } from '../../../shared/db/klienDb';
import { idHariIni } from '../../../shared/lib/idHariIni';
import { agregatOmzet, type RingkasanOmzet } from '../logic/agregatOmzet';
import { awalBulan, awalMinggu } from '../logic/rentangTanggal';

export interface RingkasanOmzetTetap {
  hariIni: RingkasanOmzet;
  mingguIni: RingkasanOmzet;
  bulanIni: RingkasanOmzet;
}

const KOSONG = agregatOmzet([]);

// 3 KPI tetap (Hari Ini/Minggu Ini/Bulan Ini) selalu dihitung dari SATU
// query rentang gabungan (dari awal periode terpanjang s.d. hari ini), lalu
// difilter ulang jadi 3 subset di memori — bukan 3 query terpisah.
export function useRingkasanOmzet() {
  const [data, setData] = useState<RingkasanOmzetTetap>({
    hariIni: KOSONG,
    mingguIni: KOSONG,
    bulanIni: KOSONG,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pemicu, setPemicu] = useState(0);

  useEffect(() => {
    let dibatalkan = false;
    setLoading(true);
    const sekarang = new Date();
    const idHari = idHariIni(sekarang);
    const idMinggu = idHariIni(awalMinggu(sekarang));
    const idBulan = idHariIni(awalBulan(sekarang));
    const idMin = idMinggu < idBulan ? idMinggu : idBulan;

    panggil('ambilAgregatRentang', idMin, idHari)
      .then((dokumen) => {
        if (dibatalkan) return;
        setData({
          hariIni: agregatOmzet(dokumen.filter((d) => d.tanggal === idHari)),
          mingguIni: agregatOmzet(dokumen.filter((d) => d.tanggal >= idMinggu)),
          bulanIni: agregatOmzet(dokumen.filter((d) => d.tanggal >= idBulan)),
        });
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (dibatalkan) return;
        setError(err instanceof Error ? err : new Error('Gagal memuat ringkasan omzet.'));
        setLoading(false);
      });

    return () => {
      dibatalkan = true;
    };
  }, [pemicu]);

  return { ...data, loading, error, muatUlang: () => setPemicu((n) => n + 1) };
}
