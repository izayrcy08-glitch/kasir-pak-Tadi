import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStatusBackup } from '../hooks/useStatusBackup';
import {
  bannerPengingatDitutup,
  penandaPeriodePengingat,
  perluPengingatBackup,
  selisihHariKalender,
} from '../logic/jadwalBackup';
import styles from './PengingatBackup.module.css';

const RUTE_BACKUP = '/pengaturan/backup';

// Per device, cukup localStorage: kalau hilang, akibatnya hanya banner muncul
// lagi — arah yang aman.
const KUNCI_DITUTUP = 'pengingat-backup-ditutup-untuk';

function bacaDitutup(): string | null {
  try {
    return localStorage.getItem(KUNCI_DITUTUP);
  } catch {
    return null;
  }
}

// Banner di atas semua halaman kalau data belum di-backup cukup lama. Tanpa
// cloud, backup adalah satu-satunya penyelamat data kalau device rusak/hilang.
// Bisa ditutup (✕) untuk periode telat yang sedang berjalan (lihat
// bannerPengingatDitutup); peringatan di menu Pengaturan tetap tampil.
export function PengingatBackup() {
  const { status } = useStatusBackup();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [ditutupUntuk, setDitutupUntuk] = useState(bacaDitutup);

  const sekarang = new Date();
  if (
    !status ||
    pathname === RUTE_BACKUP ||
    !perluPengingatBackup(status, sekarang) ||
    bannerPengingatDitutup(ditutupUntuk, status.terakhirBackupPada)
  ) {
    return null;
  }

  const penanda = penandaPeriodePengingat(status.terakhirBackupPada);
  function tutup() {
    try {
      localStorage.setItem(KUNCI_DITUTUP, penanda);
    } catch {
      // Tetap tersembunyi untuk sesi ini saja.
    }
    setDitutupUntuk(penanda);
  }

  const pesan =
    status.terakhirBackupPada === null ? (
      'Data toko belum pernah di-backup.'
    ) : (
      <>
        Sudah{' '}
        <span className={styles.angka}>{selisihHariKalender(new Date(status.terakhirBackupPada), sekarang)}</span>{' '}
        hari belum backup data.
      </>
    );

  return (
    <div className={styles.banner} role="status">
      <div className={styles.ikon}>
        <svg viewBox="0 0 24 24">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.3 3.9 2.4 17.5A2 2 0 0 0 4.1 20.5h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </div>
      <p className={styles.teks}>
        <strong>{pesan}</strong> Kalau device rusak atau hilang, data yang belum di-backup ikut hilang.
      </p>
      <button type="button" className={styles.tombol} onClick={() => navigate(RUTE_BACKUP)}>
        Backup sekarang
      </button>
      <button
        type="button"
        className={styles.tombolTutup}
        onClick={tutup}
        aria-label="Tutup pengingat"
        title="Tutup — peringatan tetap ada di menu Pengaturan"
      >
        <svg viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
