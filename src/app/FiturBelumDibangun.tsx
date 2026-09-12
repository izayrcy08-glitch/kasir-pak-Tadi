import styles from './FiturBelumDibangun.module.css';

interface Props {
  judul: string;
}

export function FiturBelumDibangun({ judul }: Props) {
  return (
    <>
      <div className={styles.pageHead}>
        <h1>{judul}</h1>
        <p className={styles.sub}>Fondasi proyek siap — fitur {judul.toLowerCase()} belum dibangun.</p>
      </div>
      <div className={styles.card}>
        Halaman fitur ini akan diisi bertahap. Lihat CLAUDE.md di{' '}
        <code>src/features/</code> untuk struktur dan aturan kerja.
      </div>
    </>
  );
}
