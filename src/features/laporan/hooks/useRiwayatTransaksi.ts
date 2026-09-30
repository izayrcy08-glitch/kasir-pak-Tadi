import { useEffect, useState } from 'react';
import { panggil } from '../../../shared/db/klienDb';
import type { RiwayatTransaksiHalaman } from '../../../shared/db/operasi/transaksi';
import type { Transaksi } from '../../../shared/types/transaksi';
import type { RentangTanggal } from '../logic/rentangTanggal';

// Kecil supaya kartu riwayat tidak memanjang jauh di HP; sisanya lewat
// "Lihat lebih banyak".
export const BATAS_HALAMAN = 10;

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
    panggil('ambilRiwayatTransaksi', { mulai: new Date(mulaiMs), akhir: new Date(akhirMs) }, { batas: BATAS_HALAMAN })
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
      const hasil = await panggil('ambilRiwayatTransaksi', 
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

  // Kembali ke halaman pertama tanpa memuat ulang dari DB: potong daftar dan
  // lanjutkan kursor dari item terakhir yang masih tampil.
  function lebihSedikit() {
    if (daftar.length <= BATAS_HALAMAN) return;
    const terakhir = daftar[BATAS_HALAMAN - 1]!;
    setDaftar((prev) => prev.slice(0, BATAS_HALAMAN));
    setKursor({ dibuatPada: terakhir.dibuatPada, id: terakhir.id });
  }

  return { daftar, loading, error, adaLagi: kursor !== null, memuatLebih, muatLebih, lebihSedikit };
}
