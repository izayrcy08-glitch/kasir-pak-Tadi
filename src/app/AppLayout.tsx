import { NavLink, Outlet } from 'react-router-dom';
import styles from './AppLayout.module.css';

const NAV_ITEMS = [
  { to: '/transaksi', label: 'Transaksi' },
  { to: '/produk', label: 'Produk' },
  { to: '/laporan', label: 'Laporan' },
  { to: '/pengaturan', label: 'Pengaturan' },
] as const;

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
        <Outlet />
      </div>
    </div>
  );
}
