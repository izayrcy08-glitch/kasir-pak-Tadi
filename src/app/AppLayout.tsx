import styles from './AppLayout.module.css';

const NAV_ITEMS = ['Transaksi', 'Produk', 'Laporan', 'Pengaturan'] as const;

export function AppLayout() {
  return (
    <div className={styles.root}>
      <div className={styles.sidebar}>
        <div className={styles.logoBadge}>T</div>
        <div className={styles.navList}>
          {NAV_ITEMS.map((item, i) => (
            <div key={item} className={`${styles.navItem} ${i === 0 ? styles.active : ''}`}>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.main}>
        <div className={styles.pageHead}>
          <h1>Transaksi</h1>
          <p className="sub">Fondasi proyek siap — fitur transaksi belum dibangun.</p>
        </div>
        <div className={styles.card}>
          Halaman fitur (Transaksi, Produk, Laporan, Pengaturan) akan diisi bertahap di
          src/features/. Lihat CLAUDE.md untuk struktur dan aturan kerja.
        </div>
      </div>
    </div>
  );
}
