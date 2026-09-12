import type { ProdukTerlaris } from '../logic/agregatProdukTerlaris';
import styles from './ProdukTerlarisCard.module.css';

interface Props {
  daftar: ProdukTerlaris[];
}

export function ProdukTerlarisCard({ daftar }: Props) {
  return (
    <div className={styles.card}>
      <h2>Produk Terlaris</h2>
      {daftar.length === 0 ? (
        <p className={styles.empty}>Belum ada produk terjual pada rentang ini.</p>
      ) : (
        daftar.map((p, i) => (
          <div key={p.produkId} className={styles.rankRow}>
            <span className={styles.rankNum}>{i + 1}</span>
            <span className={styles.rankName}>{p.nama}</span>
            <span className={styles.rankQty}>{p.qty} terjual</span>
          </div>
        ))
      )}
    </div>
  );
}
