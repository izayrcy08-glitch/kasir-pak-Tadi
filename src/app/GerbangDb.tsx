import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AplikasiSudahTerbukaError } from '../shared/db/galat';
import { infoDb } from '../shared/db/klienDb';
import styles from './GerbangDb.module.css';

type Status = 'membuka' | 'siap' | 'sudahTerbuka' | 'gagal';

// Pastikan database lokal benar-benar terbuka sebelum halaman mana pun
// dirender. Kalau DB dipegang jendela/tab lain, tampilkan penjelasan —
// bukan pesan "gagal memuat" di tiap halaman.
export function GerbangDb() {
  const [status, setStatus] = useState<Status>('membuka');
  const [pesanGagal, setPesanGagal] = useState('');

  useEffect(() => {
    let batal = false;
    infoDb()
      .then(() => {
        if (!batal) setStatus('siap');
      })
      .catch((err: unknown) => {
        if (batal) return;
        if (err instanceof AplikasiSudahTerbukaError) {
          setStatus('sudahTerbuka');
        } else {
          setPesanGagal(err instanceof Error ? err.message : String(err));
          setStatus('gagal');
        }
      });
    return () => {
      batal = true;
    };
  }, []);

  if (status === 'siap') return <Outlet />;
  if (status === 'membuka') return <div className={styles.layar}>Membuka data toko…</div>;

  return (
    <div className={styles.layar}>
      <div className={styles.kartu} role="alert">
        {status === 'sudahTerbuka' ? (
          <>
            <h1 className={styles.judul}>Aplikasi sudah terbuka</h1>
            <p className={styles.teks}>
              Kasir sedang terbuka di jendela atau tab lain. Supaya data tidak bentrok, hanya satu yang boleh
              dipakai. Tutup jendela yang lain, lalu tekan tombol di bawah.
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.judul}>Data toko tidak bisa dibuka</h1>
            <p className={styles.teks}>
              Tutup aplikasi lalu buka lagi. Kalau masih muncul, jangan hapus data aplikasi — hubungi yang
              memasang aplikasi ini.
            </p>
            <p className={styles.detail}>{pesanGagal}</p>
          </>
        )}
        <button type="button" className={styles.tombol} onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </div>
    </div>
  );
}
