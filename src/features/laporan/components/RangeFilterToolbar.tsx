import type { PresetRentang } from '../logic/rentangTanggal';
import styles from './RangeFilterToolbar.module.css';

export type PilihanRentang = PresetRentang | 'kustom';

interface Props {
  pilihan: PilihanRentang;
  kustomMulai: string;
  kustomAkhir: string;
  onPilih: (pilihan: PilihanRentang) => void;
  onUbahKustomMulai: (nilai: string) => void;
  onUbahKustomAkhir: (nilai: string) => void;
}

const LABEL: Record<PilihanRentang, string> = {
  hari_ini: 'Hari Ini',
  minggu_ini: 'Minggu Ini',
  bulan_ini: 'Bulan Ini',
  kustom: 'Kustom',
};

export function RangeFilterToolbar({
  pilihan,
  kustomMulai,
  kustomAkhir,
  onPilih,
  onUbahKustomMulai,
  onUbahKustomAkhir,
}: Props) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.chipRow}>
        {(['hari_ini', 'minggu_ini', 'bulan_ini', 'kustom'] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={`${styles.filterChip} ${pilihan === p ? styles.active : ''}`}
            onClick={() => onPilih(p)}
          >
            {LABEL[p]}
          </button>
        ))}
      </div>
      {pilihan === 'kustom' && (
        <div className={styles.kustomRow}>
          <input
            type="date"
            className={styles.dateInput}
            value={kustomMulai}
            max={kustomAkhir || undefined}
            onChange={(e) => onUbahKustomMulai(e.target.value)}
          />
          <span className={styles.sampai}>s.d.</span>
          <input
            type="date"
            className={styles.dateInput}
            value={kustomAkhir}
            min={kustomMulai || undefined}
            onChange={(e) => onUbahKustomAkhir(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
