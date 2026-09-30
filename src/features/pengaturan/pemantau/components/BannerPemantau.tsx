import { useLocation, useNavigate } from 'react-router-dom';
import { formatTanggalPendek, formatWaktu } from '../../../../shared/lib/formatTanggal';
import { useRingkasanData } from '../hooks/useRingkasanData';
import { RUTE_MUAT_DATA } from '../rute';
import styles from './BannerPemantau.module.css';

// Pengganti PengingatBackup di mode pemantau: selalu tampil supaya jelas yang
// dilihat adalah SALINAN data kasir, dan sampai kapan salinan itu.
export function BannerPemantau() {
  const { ringkasan } = useRingkasanData();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (!ringkasan) return null;

  const kosong = ringkasan.jumlahProduk === 0 && ringkasan.jumlahTransaksi === 0;
  const terakhir = ringkasan.transaksiTerakhirPada === null ? null : new Date(ringkasan.transaksiTerakhirPada);

  return (
    <div className={styles.banner} role="status">
      <div className={styles.ikon}>
        <svg viewBox="0 0 24 24">
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
      <p className={styles.teks}>
        {kosong ? (
          <>
            <strong>Belum ada data.</strong> Muat file backup dari perangkat kasir untuk melihat laporan & produk.
          </>
        ) : (
          <>
            <strong>Mode pemantau</strong> — hanya melihat salinan data kasir.{' '}
            {terakhir ? (
              <>
                Transaksi terakhir:{' '}
                <span className={styles.angka}>
                  {formatTanggalPendek(terakhir)} · {formatWaktu(terakhir)}
                </span>
              </>
            ) : (
              'Belum ada transaksi.'
            )}
          </>
        )}
      </p>
      {pathname !== RUTE_MUAT_DATA && (
        <button type="button" className={styles.tombol} onClick={() => navigate(RUTE_MUAT_DATA)}>
          {kosong ? 'Muat data' : 'Muat data terbaru'}
        </button>
      )}
    </div>
  );
}
