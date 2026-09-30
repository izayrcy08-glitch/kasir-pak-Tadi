import type { ReactNode } from 'react';
import styles from './LihatLebih.module.css';

interface Props {
  bisaLebihBanyak: boolean;
  bisaLebihSedikit: boolean;
  onLebihBanyak: () => void;
  onLebihSedikit: () => void;
  /** Sedang memuat halaman berikutnya (daftar dari DB). */
  memuat?: boolean;
  /** Mis. "20 dari 50 produk". */
  keterangan?: ReactNode;
}

// Tombol "Lihat lebih banyak / lebih sedikit" di bawah daftar panjang
// (produk, riwayat transaksi) — dipakai bersama supaya perilaku & tampilannya
// sama di semua halaman. Diletakkan di dalam kartu putih.
export function LihatLebih({
  bisaLebihBanyak,
  bisaLebihSedikit,
  onLebihBanyak,
  onLebihSedikit,
  memuat = false,
  keterangan,
}: Props) {
  if (!bisaLebihBanyak && !bisaLebihSedikit) return null;
  return (
    <div className={styles.wadah}>
      {keterangan && <p className={styles.keterangan}>{keterangan}</p>}
      <div className={styles.tombolBaris}>
        {bisaLebihBanyak && (
          <button type="button" className={styles.tombol} onClick={onLebihBanyak} disabled={memuat}>
            {memuat ? 'Memuat…' : 'Lihat lebih banyak'}
            <svg viewBox="0 0 24 24">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
        {bisaLebihSedikit && (
          <button type="button" className={styles.tombol} onClick={onLebihSedikit} disabled={memuat}>
            Lihat lebih sedikit
            <svg viewBox="0 0 24 24">
              <path d="m6 15 6-6 6 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
