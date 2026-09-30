import { useEffect, useState } from 'react';
import { simpanBerkas } from '../../../platform/berkas';
import { panggil } from '../../../shared/db/klienDb';
import { AWALAN_BERKAS_CSV, buatCsvLaporan, namaBerkasCsv } from '../logic/csvLaporan';
import type { RentangTanggal } from '../logic/rentangTanggal';

// Ekspor seluruh transaksi di rentang aktif (bukan cuma halaman riwayat yang
// sudah dimuat) ke file CSV — Android lewat menu Bagikan, Windows lewat
// dialog "Simpan sebagai".
export function useEksporCsv(rentang: RentangTanggal) {
  const [mengekspor, setMengekspor] = useState(false);
  const [error, setError] = useState('');
  const [sukses, setSukses] = useState('');

  useEffect(() => {
    if (!sukses) return;
    const timer = setTimeout(() => setSukses(''), 3000);
    return () => clearTimeout(timer);
  }, [sukses]);

  async function ekspor() {
    if (mengekspor) return;
    setMengekspor(true);
    setError('');
    setSukses('');
    try {
      const daftar = await panggil('ambilTransaksiRentang', rentang);
      if (daftar.length === 0) {
        setError('Tidak ada transaksi pada rentang ini untuk diekspor.');
        return;
      }
      const hasil = await simpanBerkas({
        nama: namaBerkasCsv(rentang.mulai, rentang.akhir),
        bytes: new TextEncoder().encode(buatCsvLaporan(daftar)),
        mime: 'text/csv',
        judul: 'Kirim laporan penjualan (CSV)',
        awalanBersihkan: AWALAN_BERKAS_CSV,
      });
      if (hasil === 'tersimpan') setSukses('File CSV laporan tersimpan.');
    } catch (err) {
      setError(`Gagal mengekspor CSV: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setMengekspor(false);
    }
  }

  return { ekspor, mengekspor, error, sukses };
}
