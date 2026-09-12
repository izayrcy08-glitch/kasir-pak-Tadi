import { formatRupiah } from '../../../shared/lib/formatRupiah';
import styles from './StatRow.module.css';

interface Props {
  omzetHariIni: number;
  omzetMingguIni: number;
  omzetBulanIni: number;
}

export function StatRow({ omzetHariIni, omzetMingguIni, omzetBulanIni }: Props) {
  return (
    <div className={styles.statRow}>
      <div className={styles.statTile}>
        <p className={styles.label}>Omzet Hari Ini</p>
        <p className={styles.value}>{formatRupiah(omzetHariIni)}</p>
      </div>
      <div className={styles.statTile}>
        <p className={styles.label}>Omzet Minggu Ini</p>
        <p className={styles.value}>{formatRupiah(omzetMingguIni)}</p>
      </div>
      <div className={styles.statTile}>
        <p className={styles.label}>Omzet Bulan Ini</p>
        <p className={styles.value}>{formatRupiah(omzetBulanIni)}</p>
      </div>
    </div>
  );
}
