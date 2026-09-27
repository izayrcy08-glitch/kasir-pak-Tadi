import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { panggil } from '../../shared/db/klienDb';
import type { Produk } from '../../shared/types/produk';
import { TabelProduk } from './components/TabelProduk';
import { useProduk } from './hooks/useProduk';
import { filterProduk } from './logic/filterProduk';
import { hitungStokRendah } from './logic/hitungStokRendah';
import styles from './ProdukListPage.module.css';

export function ProdukListPage() {
  const { daftar, loading, error } = useProduk();
  const navigate = useNavigate();
  const [kataKunci, setKataKunci] = useState('');
  const [kategori, setKategori] = useState('Semua');
  const [gagalHapus, setGagalHapus] = useState('');

  const daftarKategori = useMemo(() => {
    const unik = Array.from(new Set(daftar.map((p) => p.kategori))).sort();
    return ['Semua', ...unik];
  }, [daftar]);

  const hasilFilter = useMemo(
    () => filterProduk(daftar, kataKunci, kategori),
    [daftar, kataKunci, kategori],
  );

  const jumlahStokRendah = useMemo(
    () => daftar.filter((p) => hitungStokRendah(p.stok, p.ambangStokRendah)).length,
    [daftar],
  );

  async function handleHapus(produk: Produk) {
    const yakin = window.confirm(`Hapus "${produk.nama}"? Tindakan ini tidak bisa dibatalkan.`);
    if (!yakin) return;
    setGagalHapus('');
    try {
      await panggil('hapusProduk', produk.id);
    } catch {
      setGagalHapus(`Gagal menghapus "${produk.nama}". Coba lagi.`);
    }
  }

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1>Manajemen Produk</h1>
          <p className={styles.sub}>
            {daftar.length} produk terdaftar · {jumlahStokRendah} stok rendah
          </p>
        </div>
        <button type="button" className={styles.btnAccent} onClick={() => navigate('/produk/tambah')}>
          <svg viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Produk
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.2" y2="16.2" />
          </svg>
          <input
            type="text"
            placeholder="Cari nama atau kode part…"
            value={kataKunci}
            onChange={(e) => setKataKunci(e.target.value)}
          />
        </div>
        <div className={styles.chipRow}>
          {daftarKategori.map((k) => (
            <button
              key={k}
              type="button"
              className={`${styles.filterChip} ${kategori === k ? styles.active : ''}`}
              onClick={() => setKategori(k)}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {gagalHapus && <div className={styles.errorBanner}>{gagalHapus}</div>}

      {error ? (
        <div className={styles.card}>Gagal memuat data produk. Tutup lalu buka ulang aplikasi.</div>
      ) : loading ? (
        <div className={styles.card}>Memuat data produk…</div>
      ) : (
        <TabelProduk
          daftar={hasilFilter}
          pesanKosong={
            daftar.length === 0
              ? 'Belum ada produk. Klik "Tambah Produk" untuk mulai mengisi katalog.'
              : undefined
          }
          onEdit={(produk) => navigate(`/produk/${produk.id}/edit`)}
          onHapus={handleHapus}
        />
      )}
    </>
  );
}
