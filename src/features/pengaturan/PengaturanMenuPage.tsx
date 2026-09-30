import { useNavigate } from 'react-router-dom';
import { useStatusBackup } from './backup/hooks/useStatusBackup';
import { perluPengingatBackup, selisihHariKalender } from './backup/logic/jadwalBackup';
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
  {
    to: '/pengaturan/backup',
    judul: 'Backup & Pulihkan Data',
    sub: 'Simpan salinan data, pindah kasir ke device lain',
    icon: (
      <svg viewBox="0 0 24 24">
        <ellipse cx="12" cy="5.5" rx="7" ry="2.5" />
        <path d="M5 5.5v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
        <path d="M5 11.5v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
      </svg>
    ),
  },
] as const;

export function PengaturanMenuPage() {
  const navigate = useNavigate();
  const { status } = useStatusBackup();

  // Tetap tampil walau banner pengingat di halaman utama sudah ditutup (✕) —
  // di sinilah peringatan backup "tinggal" sampai data benar-benar di-backup.
  const sekarang = new Date();
  const peringatanBackup =
    status && perluPengingatBackup(status, sekarang)
      ? status.terakhirBackupPada === null
        ? 'Belum pernah backup'
        : (
            <>
              <span className={styles.angka}>{selisihHariKalender(new Date(status.terakhirBackupPada), sekarang)}</span>{' '}
              hari belum backup
            </>
          )
      : null;

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
              {item.to === '/pengaturan/backup' && peringatanBackup && (
                <span className={styles.pillWarn}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                  </svg>
                  {peringatanBackup}
                </span>
              )}
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
