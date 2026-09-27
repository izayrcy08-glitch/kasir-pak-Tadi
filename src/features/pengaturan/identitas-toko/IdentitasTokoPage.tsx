import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { panggil } from '../../../shared/db/klienDb';
import { usePengaturanToko } from '../../../shared/hooks/usePengaturanToko';
import type { PengaturanTokoInput } from '../../../shared/types/pengaturanToko';
import { FormIdentitasToko } from './components/FormIdentitasToko';
import styles from './IdentitasTokoPage.module.css';

export function IdentitasTokoPage() {
  const navigate = useNavigate();
  const { pengaturan, loading, error } = usePengaturanToko();
  const [sukses, setSukses] = useState('');

  useEffect(() => {
    if (!sukses) return;
    const timer = setTimeout(() => setSukses(''), 3000);
    return () => clearTimeout(timer);
  }, [sukses]);

  async function handleSimpan(input: PengaturanTokoInput) {
    await panggil('simpanPengaturanToko', input);
    setSukses('Identitas toko tersimpan.');
  }

  return (
    <>
      <div className={styles.pageHead}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/pengaturan')}>
          <svg viewBox="0 0 24 24">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Pengaturan
        </button>
        <h1>Identitas Toko</h1>
        <p className={styles.sub}>Nama dan logo di sini dipakai sebagai header struk.</p>
      </div>

      {sukses && (
        <div className={styles.successToast} role="status">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5 10.8 15.3 16 9.5" />
          </svg>
          {sukses}
        </div>
      )}

      {error ? (
        <div className={styles.card}>Gagal memuat pengaturan toko. Tutup lalu buka ulang aplikasi.</div>
      ) : loading ? (
        <div className={styles.card}>Memuat pengaturan…</div>
      ) : (
        <FormIdentitasToko awal={pengaturan} onSimpan={handleSimpan} />
      )}
    </>
  );
}
