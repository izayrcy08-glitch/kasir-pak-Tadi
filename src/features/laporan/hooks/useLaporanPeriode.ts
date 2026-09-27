import { useEffect, useState } from 'react';
import { panggil } from '../../../shared/db/klienDb';
import { idHariIni } from '../../../shared/lib/idHariIni';
import type { AgregatLaporanHarian } from '../../../shared/types/agregatLaporan';
import type { RentangTanggal } from '../logic/rentangTanggal';

// Fetch mentah saja — perhitungan (agregatOmzet/agregatProdukTerlaris)
// dilakukan di halaman lewat useMemo, supaya logic/ tetap pure & hook ini
// tetap kecil.
export function useLaporanPeriode(rentang: RentangTanggal, pemicuMuatUlang = 0) {
  const [dokumen, setDokumen] = useState<AgregatLaporanHarian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const idMulai = idHariIni(rentang.mulai);
  const idAkhir = idHariIni(rentang.akhir);

  useEffect(() => {
    let dibatalkan = false;
    setLoading(true);
    panggil('ambilAgregatRentang', idMulai, idAkhir)
      .then((hasil) => {
        if (dibatalkan) return;
        setDokumen(hasil);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (dibatalkan) return;
        setError(err instanceof Error ? err : new Error('Gagal memuat data laporan.'));
        setLoading(false);
      });

    return () => {
      dibatalkan = true;
    };
  }, [idMulai, idAkhir, pemicuMuatUlang]);

  return { dokumen, loading, error };
}
