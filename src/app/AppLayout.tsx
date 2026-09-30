import { NavLink, Outlet } from 'react-router-dom';
import { PengingatBackup } from '../features/pengaturan/backup/components/PengingatBackup';
import { BannerPemantau } from '../features/pengaturan/pemantau/components/BannerPemantau';
import { RUTE_MUAT_DATA } from '../features/pengaturan/pemantau/rute';
import { MODE_PEMANTAU } from '../platform/perangkat';
import styles from './AppLayout.module.css';

const NAV_ITEMS = MODE_PEMANTAU
  ? [
      { to: '/laporan', label: 'Laporan' },
      { to: '/produk', label: 'Produk' },
      { to: RUTE_MUAT_DATA, label: 'Muat Data' },
    ]
  : [
      { to: '/transaksi', label: 'Transaksi' },
      { to: '/produk', label: 'Produk' },
      { to: '/laporan', label: 'Laporan' },
      { to: '/pengaturan', label: 'Pengaturan' },
    ];

export function AppLayout() {
  return (
    <div className={styles.root}>
      <div className={styles.sidebar}>
        <div className={styles.logoBadge}>T</div>
        <div className={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className={styles.main}>
        {MODE_PEMANTAU ? <BannerPemantau /> : <PengingatBackup />}
        <Outlet />
      </div>
    </div>
  );
}
