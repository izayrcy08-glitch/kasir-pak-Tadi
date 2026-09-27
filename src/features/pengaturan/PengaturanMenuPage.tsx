import { useNavigate } from 'react-router-dom';
import styles from './PengaturanMenuPage.module.css';

const MENU = [
  {
    to: '/pengaturan/identitas',
    judul: 'Identitas Toko',
    sub: 'Nama & logo yang dicetak di struk',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M4 9v11h16V9" />
        <path d="M3 9l2-5h14l2 5" />
        <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
      </svg>
    ),
  },
  {
    to: '/pengaturan/printer',
    judul: 'Printer Struk & Laci Kas',
    sub: 'Koneksi printer, lebar kertas, buka laci',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M6 9V4h12v5" />
        <rect x="4" y="9" width="16" height="7" rx="1.5" />
        <path d="M6 16v4h12v-4" />
      </svg>
    ),
  },
] as const;

export function PengaturanMenuPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Pengaturan Toko</h1>
        <p className={styles.sub}>Pilih menu untuk mengatur masing-masing bagian.</p>
      </div>

      <div className={styles.menuList}>
        {MENU.map((item) => (
          <button key={item.to} type="button" className={styles.menuRow} onClick={() => navigate(item.to)}>
            <div className={styles.iconWrap}>{item.icon}</div>
            <div className={styles.text}>
              <p className={styles.title}>{item.judul}</p>
              <p className={styles.rowSub}>{item.sub}</p>
            </div>
            <svg className={styles.chev} viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </>
  );
}
