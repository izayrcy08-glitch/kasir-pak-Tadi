import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { tambahProduk, updateProduk } from '../../shared/firebase/produk.repo';
import { withTimeout } from '../../shared/lib/withTimeout';
import type { ProdukInput } from '../../shared/types/produk';
import { FormProduk } from './components/FormProduk';
import { useProduk } from './hooks/useProduk';
import styles from './ProdukFormPage.module.css';

// Kalau perangkat offline, promise simpan ke Firestore baru selesai setelah
// tersambung lagi ke server — padahal datanya sudah masuk cache lokal dan
// langsung kelihatan di daftar (onSnapshot). Jangan sampai tombol "Menyimpan…"
// menggantung selamanya menunggu itu; anggap sudah "diantre" setelah batas ini.
const BATAS_TUNGGU_SIMPAN_MS = 1500;

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
    const tugas = id ? updateProduk(id, input) : tambahProduk(input);
    await withTimeout(tugas, BATAS_TUNGGU_SIMPAN_MS);
    navigate('/produk');
  }

  if (id && error) {
    return <div className={styles.card}>Gagal memuat data produk. Periksa koneksi, lalu muat ulang halaman.</div>;
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
