import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { formatRupiah } from '../../../shared/lib/formatRupiah';
import type { Produk } from '../../../shared/types/produk';
import { hitungStokRendah } from '../../produk/logic/hitungStokRendah';
import { cariProduk } from '../logic/cariProduk';
import { SearchProduk } from './SearchProduk';
import styles from './CariTambahProduk.module.css';

interface Props {
  daftar: Produk[];
  /** produkId → qty yang sudah ada di keranjang. */
  qtyDiKeranjang: ReadonlyMap<string, number>;
  onTambah: (produk: Produk) => void;
}

const ID_DAFTAR = 'daftar-cari-produk';

// Halaman Transaksi tidak menampilkan produk sampai kolom cari diketuk (atas
// permintaan pemilik — daftar produk yang selalu tampil mendorong keranjang
// jauh ke bawah di HP). Ketuk kolom cari → semua produk muncul di kotak yang
// bisa digulir sendiri; mengetik menyaringnya; ketuk di luar → tertutup.
export function CariTambahProduk({ daftar, qtyDiKeranjang, onTambah }: Props) {
  const [kataKunci, setKataKunci] = useState('');
  const [terbuka, setTerbuka] = useState(false);
  const [sorot, setSorot] = useState(0);
  const [terakhirDitambah, setTerakhirDitambah] = useState<string | null>(null);
  const wadahRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const daftarRef = useRef<HTMLUListElement>(null);

  const hasil = useMemo(() => cariProduk(daftar, kataKunci), [daftar, kataKunci]);

  // Sorotan kembali ke hasil teratas tiap kata kunci berubah.
  const [kunciSorot, setKunciSorot] = useState(kataKunci);
  if (kunciSorot !== kataKunci) {
    setKunciSorot(kataKunci);
    setSorot(0);
  }

  // Tutup daftar kalau mengetuk di luar kotak pencarian.
  useEffect(() => {
    if (!terbuka) return;
    function diLuar(e: PointerEvent) {
      if (!wadahRef.current?.contains(e.target as Node)) setTerbuka(false);
    }
    document.addEventListener('pointerdown', diLuar);
    return () => document.removeEventListener('pointerdown', diLuar);
  }, [terbuka]);

  useEffect(() => {
    if (!terakhirDitambah) return;
    const timer = setTimeout(() => setTerakhirDitambah(null), 2500);
    return () => clearTimeout(timer);
  }, [terakhirDitambah]);

  const sisaStok = (p: Produk) => p.stok - (qtyDiKeranjang.get(p.id) ?? 0);

  function tambah(p: Produk) {
    if (sisaStok(p) <= 0) return;
    onTambah(p);
    setTerakhirDitambah(`${p.nama} masuk keranjang (×${(qtyDiKeranjang.get(p.id) ?? 0) + 1})`);
    // Habis mengetik → kosongkan & siap cari barang berikutnya. Kalau sedang
    // menggulir daftar (tanpa kata kunci), biarkan daftar & posisi guliran.
    if (kataKunci) {
      setKataKunci('');
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setTerbuka(true);
      const baru = Math.min(Math.max(sorot + (e.key === 'ArrowDown' ? 1 : -1), 0), hasil.length - 1);
      setSorot(baru);
      daftarRef.current?.children[baru]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const p = hasil[sorot];
      if (terbuka && p) tambah(p);
    } else if (e.key === 'Escape') {
      if (kataKunci) setKataKunci('');
      else setTerbuka(false);
    }
  }

  return (
    <div ref={wadahRef} className={styles.wadah} onFocus={() => setTerbuka(true)}>
      <div onClick={() => setTerbuka(true)}>
        <SearchProduk
          value={kataKunci}
          onChange={(v) => {
            setKataKunci(v);
            setTerbuka(true);
          }}
          onKeyDown={handleKeyDown}
          inputRef={inputRef}
          idHasil={ID_DAFTAR}
        />
      </div>

      {terakhirDitambah && (
        <p className={styles.ditambah} role="status">
          <svg viewBox="0 0 24 24">
            <path d="M5 12.5 9.5 17 19 7.5" />
          </svg>
          {terakhirDitambah}
        </p>
      )}

      {!terbuka ? (
        <p className={styles.petunjuk}>Ketuk kolom cari untuk melihat daftar barang, atau langsung ketik.</p>
      ) : hasil.length === 0 ? (
        <p className={styles.kosong}>
          {daftar.length === 0 ? 'Belum ada produk. Tambahkan dulu di menu Produk.' : 'Tidak ada barang yang cocok.'}
        </p>
      ) : (
        <ul id={ID_DAFTAR} ref={daftarRef} className={styles.daftar} role="listbox" aria-label="Daftar barang">
          {hasil.map((p, i) => {
            const diKeranjang = qtyDiKeranjang.get(p.id) ?? 0;
            const habis = p.stok <= 0;
            const penuh = !habis && sisaStok(p) <= 0;
            return (
              <li key={p.id} role="option" aria-selected={i === sorot}>
                <button
                  type="button"
                  className={`${styles.baris} ${i === sorot && kataKunci ? styles.disorot : ''}`}
                  disabled={habis || penuh}
                  onClick={() => tambah(p)}
                >
                  <span className={styles.info}>
                    <span className={styles.nama}>
                      {p.kodePart && <span className={styles.kode}>{p.kodePart}</span>}
                      {p.nama}
                    </span>
                    <span className={styles.meta}>
                      <span className={styles.kategori}>{p.kategori}</span>
                      {p.kompatibilitas && <span className={styles.kompat}>{p.kompatibilitas}</span>}
                    </span>
                  </span>
                  <span className={styles.kanan}>
                    <span className={styles.harga}>{formatRupiah(p.hargaJual)}</span>
                    {habis ? (
                      <span className={styles.stokHabis}>Stok habis</span>
                    ) : penuh ? (
                      <span className={styles.stokHabis}>Semua stok di keranjang</span>
                    ) : diKeranjang > 0 ? (
                      <span className={styles.diKeranjang}>
                        <span className={styles.angka}>×{diKeranjang}</span> di keranjang
                      </span>
                    ) : hitungStokRendah(p.stok, p.ambangStokRendah) ? (
                      <span className={styles.stokRendah}>
                        Stok <span className={styles.angka}>{p.stok}</span>
                      </span>
                    ) : (
                      <span className={styles.stok}>
                        Stok <span className={styles.angka}>{p.stok}</span>
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
