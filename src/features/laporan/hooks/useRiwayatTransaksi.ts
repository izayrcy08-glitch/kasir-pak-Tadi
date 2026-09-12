import { useEffect, useState } from 'react';
import {
  ambilRiwayatTransaksi,
  type RiwayatTransaksiHalaman,
} from '../../../shared/firebase/transaksi.repo';
import type { Transaksi } from '../../../shared/types/transaksi';
import type { RentangTanggal } from '../logic/rentangTanggal';

const BATAS_HALAMAN = 50;

export function useRiwayatTransaksi(rentang: RentangTanggal, pemicuMuatUlang = 0) {
  const [daftar, setDaftar] = useState<Transaksi[]>([]);
  const [kursor, setKursor] = useState<RiwayatTransaksiHalaman['kursorBerikutnya']>(null);
  const [loading, setLoading] = useState(true);
  const [memuatLebih, setMemuatLebih] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mulaiMs = rentang.mulai.getTime();
  const akhirMs = rentang.akhir.getTime();

  useEffect(() => {
    let dibatalkan = false;
    setLoading(true);
    ambilRiwayatTransaksi({ mulai: new Date(mulaiMs), akhir: new Date(akhirMs) }, { batas: BATAS_HALAMAN })
      .then((hasil) => {
        if (dibatalkan) return;
        setDaftar(hasil.daftar);
        setKursor(hasil.kursorBerikutnya);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (dibatalkan) return;
        setError(err instanceof Error ? err : new Error('Gagal memuat riwayat transaksi.'));
        setLoading(false);
      });

    return () => {
      dibatalkan = true;
    };
  }, [mulaiMs, akhirMs, pemicuMuatUlang]);

  async function muatLebih() {
    if (!kursor || memuatLebih) return;
    setMemuatLebih(true);
    try {
      const hasil = await ambilRiwayatTransaksi(
        { mulai: new Date(mulaiMs), akhir: new Date(akhirMs) },
        { batas: BATAS_HALAMAN, kursorSetelah: kursor },
      );
      setDaftar((prev) => [...prev, ...hasil.daftar]);
      setKursor(hasil.kursorBerikutnya);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Gagal memuat riwayat transaksi.'));
    } finally {
      setMemuatLebih(false);
    }
  }

  return { daftar, loading, error, adaLagi: kursor !== null, memuatLebih, muatLebih };
}
