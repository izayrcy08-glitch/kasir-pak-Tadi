import { formatRupiah } from '../../../shared/lib/formatRupiah';
import type { Produk } from '../../../shared/types/produk';
import { hitungStokRendah } from '../../produk/logic/hitungStokRendah';
import styles from './ProdukGrid.module.css';

interface Props {
  daftar: Produk[];
  onTambah: (produk: Produk) => void;
}

export function ProdukGrid({ daftar, onTambah }: Props) {
  if (daftar.length === 0) {
    return <p className={styles.empty}>Tidak ada produk yang cocok. Coba ubah kata kunci pencarian.</p>;
  }

  return (
    <div className={styles.grid}>
      {daftar.map((produk) => {
        const stokRendah = hitungStokRendah(produk.stok, produk.ambangStokRendah);
        const habis = produk.stok <= 0;
        return (
          <div key={produk.id} className={styles.tile}>
            <span className={styles.catChip}>{produk.kategori}</span>
            <p className={styles.name}>{produk.nama}</p>
            {stokRendah && <span className={styles.lowDot}>Stok {produk.stok}</span>}
            <div className={styles.meta}>
              <span className={styles.price}>{formatRupiah(produk.hargaJual)}</span>
              <button
                type="button"
                className={styles.addBtn}
                aria-label={`Tambah ${produk.nama} ke keranjang`}
                disabled={habis}
                onClick={() => onTambah(produk)}
              >
                <svg viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
