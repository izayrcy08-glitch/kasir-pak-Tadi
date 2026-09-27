import { useState } from 'react';
import type { RingkasanData } from '../../../../shared/db/berkasBackup';
import { formatTanggalPendek, formatWaktu } from '../../../../shared/lib/formatTanggal';
import styles from './KonfirmasiPulihkan.module.css';

interface Props {
  namaFile: string;
  isiFile: RingkasanData;
  isiSekarang: RingkasanData;
  /** Boleh gagal (throw) — pesan ditampilkan di dialog ini. */
  onGanti: () => Promise<void>;
  onBatal: () => void;
}

function formatTerakhir(ms: number | null): string {
  if (ms === null) return '—';
  const t = new Date(ms);
  return `${formatTanggalPendek(t)} · ${formatWaktu(t)}`;
}

export function KonfirmasiPulihkan({ namaFile, isiFile, isiSekarang, onGanti, onBatal }: Props) {
  const [paham, setPaham] = useState(false);
  const [memulihkan, setMemulihkan] = useState(false);
  const [error, setError] = useState('');

  // Device ini punya transaksi yang lebih baru dari isi file → transaksi itu
  // akan hilang. Peringatan paling penting di dialog ini.
  const adaTransaksiLebihBaru =
    isiSekarang.transaksiTerakhirPada !== null &&
    (isiFile.transaksiTerakhirPada === null || isiSekarang.transaksiTerakhirPada > isiFile.transaksiTerakhirPada);

  async function handleGanti() {
    setError('');
    setMemulihkan(true);
    try {
      await onGanti();
    } catch (err) {
      setError(
        `Gagal memulihkan: ${err instanceof Error ? err.message : String(err)}. Data di device ini tidak berubah.`,
      );
      setMemulihkan(false);
    }
  }

  const baris: { label: string; file: string | number; sekarang: string | number; angka: boolean }[] = [
    { label: 'Nama toko', file: isiFile.namaToko ?? '—', sekarang: isiSekarang.namaToko ?? '—', angka: false },
    { label: 'Produk', file: isiFile.jumlahProduk, sekarang: isiSekarang.jumlahProduk, angka: true },
    { label: 'Transaksi', file: isiFile.jumlahTransaksi, sekarang: isiSekarang.jumlahTransaksi, angka: true },
    {
      label: 'Transaksi terakhir',
      file: formatTerakhir(isiFile.transaksiTerakhirPada),
      sekarang: formatTerakhir(isiSekarang.transaksiTerakhirPada),
      angka: true,
    },
  ];

  return (
    <div className={styles.overlay} onClick={memulihkan ? undefined : onBatal}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="judul-pulihkan"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 id="judul-pulihkan">Ganti semua data?</h2>
          <p className={styles.namaFile}>{namaFile}</p>
        </div>

        <table className={styles.tabel}>
          <thead>
            <tr>
              <th />
              <th>File backup</th>
              <th>Device ini</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b) => (
              <tr key={b.label}>
                <th scope="row">{b.label}</th>
                <td className={b.angka ? styles.angka : undefined}>{b.file}</td>
                <td className={b.angka ? styles.angka : undefined}>{b.sekarang}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {adaTransaksiLebihBaru && (
          <p className={styles.peringatan} role="alert">
            Device ini punya transaksi yang lebih baru dari isi file backup. Transaksi itu akan hilang kalau data
            diganti.
          </p>
        )}

        <label className={styles.cek}>
          <input type="checkbox" checked={paham} onChange={(e) => setPaham(e.target.checked)} disabled={memulihkan} />
          Saya mengerti semua data di device ini akan diganti dan tidak bisa dikembalikan.
        </label>

        {error && <p className={styles.formError}>{error}</p>}

        <div className={styles.aksi}>
          <button type="button" className={styles.btnBatal} onClick={onBatal} disabled={memulihkan}>
            Batal
          </button>
          <button type="button" className={styles.btnBahaya} onClick={handleGanti} disabled={!paham || memulihkan}>
            {memulihkan ? 'Memulihkan…' : 'Ganti semua data'}
          </button>
        </div>
      </div>
    </div>
  );
}
