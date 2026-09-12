import { formatRupiah } from '../../../shared/lib/formatRupiah';
import type { RingkasanOmzet } from '../logic/agregatOmzet';
import styles from './RingkasanMetodeBayar.module.css';

interface Props {
  ringkasan: RingkasanOmzet;
}

// Tidak ada di mockup statis (Laporan.dc.html hanya menampilkan metode
// bayar implisit lewat pill per baris tabel riwayat) — komponen ini
// ditambahkan untuk memenuhi DAFTAR-FITUR.md §3 "breakdown total
// berdasarkan metode bayar", penyimpangan disengaja dari mockup.
export function RingkasanMetodeBayar({ ringkasan }: Props) {
  return (
    <div className={styles.card}>
      <h2>Breakdown Metode Bayar</h2>
      <div className={styles.baris}>
        <span className={`${styles.payTag} ${styles.tunai}`}>Tunai</span>
        <span className={styles.jumlah}>{ringkasan.jumlahTransaksiPerMetode.tunai} transaksi</span>
        <span className={styles.omzet}>{formatRupiah(ringkasan.omzetPerMetode.tunai)}</span>
      </div>
      <div className={styles.baris}>
        <span className={`${styles.payTag} ${styles.qris}`}>QRIS</span>
        <span className={styles.jumlah}>{ringkasan.jumlahTransaksiPerMetode.qris_transfer} transaksi</span>
        <span className={styles.omzet}>{formatRupiah(ringkasan.omzetPerMetode.qris_transfer)}</span>
      </div>
    </div>
  );
}
