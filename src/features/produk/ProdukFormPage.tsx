import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { panggil } from '../../shared/db/klienDb';
import type { ProdukInput } from '../../shared/types/produk';
import { FormProduk } from './components/FormProduk';
import { useProduk } from './hooks/useProduk';
import styles from './ProdukFormPage.module.css';

export function ProdukFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { daftar, loading, error } = useProduk();

  const produkDiedit = useMemo(() => daftar.find((p) => p.id === id), [daftar, id]);
  const daftarKategori = useMemo(
    () => Array.from(new Set(daftar.map((p) => p.kategori))).sort(),
    [daftar],
  );

  async function handleSimpan(input: ProdukInput) {
    // Ditunggu sampai benar-benar tersimpan di DB lokal — kalau gagal, error
    // dilempar ke FormProduk yang menampilkan pesan gagal.
    if (id) await panggil('updateProduk', id, input);
    else await panggil('tambahProduk', input);
    navigate('/produk');
  }

  if (id && error) {
    return <div className={styles.card}>Gagal memuat data produk. Tutup lalu buka ulang aplikasi.</div>;
  }
  if (id && loading) {
    return <div className={styles.card}>Memuat data produk…</div>;
  }
  if (id && !produkDiedit) {
    return <div className={styles.card}>Produk tidak ditemukan.</div>;
  }

  return (
    <>
      <div className={styles.pageHead}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/produk')}>
          <svg viewBox="0 0 24 24">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Manajemen Produk
        </button>
        <h1>{id ? 'Edit Produk' : 'Tambah Produk'}</h1>
        <p className={styles.sub}>
          {id ? 'Ubah detail produk ini.' : 'Isi detail produk baru untuk ditambahkan ke katalog.'}
        </p>
      </div>

      <FormProduk
        awal={produkDiedit}
        daftarKategori={daftarKategori}
        onSimpan={handleSimpan}
        onBatal={() => navigate('/produk')}
      />
    </>
  );
}
