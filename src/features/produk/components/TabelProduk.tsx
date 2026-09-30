import type { ReactNode } from "react";
import { formatRupiah } from "../../../shared/lib/formatRupiah";
import type { Produk } from "../../../shared/types/produk";
import { hitungStokRendah } from "../logic/hitungStokRendah";
import styles from "./TabelProduk.module.css";

interface Props {
  daftar: Produk[];
  pesanKosong?: string;
  /** Tanpa `aksi` (mode pemantau) = tabel hanya-baca, kolom Aksi disembunyikan. */
  aksi?: {
    onEdit: (produk: Produk) => void;
    onHapus: (produk: Produk) => void;
  };
  /** Ditaruh di dalam kartu, di bawah tabel (mis. tombol lihat lebih banyak). */
  footer?: ReactNode;
}

export function TabelProduk({
  daftar,
  pesanKosong = "Belum ada produk yang cocok. Coba ubah kata kunci atau kategori.",
  aksi,
  footer,
}: Props) {
  if (daftar.length === 0) {
    return (
      <div className={styles.card}>
        <p className={styles.empty}>{pesanKosong}</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <table className={styles.tabel}>
        <thead>
          <tr>
            <th>Produk</th>
            <th>Kategori</th>
            <th>Harga Beli</th>
            <th>Harga Jual</th>
            <th>Stok</th>
            <th>Satuan</th>
            {aksi && <th>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {daftar.map((produk) => {
            const stokRendah = hitungStokRendah(
              produk.stok,
              produk.ambangStokRendah,
            );
            return (
              <tr key={produk.id}>
                <td className={styles.nameCell} data-label="Produk">
                  {produk.kodePart && (
                    <span className={styles.code}>{produk.kodePart}</span>
                  )}
                  {produk.nama}
                </td>
                <td data-label="Kategori">
                  <span className={styles.catChip}>{produk.kategori}</span>
                </td>
                <td className={styles.mono} data-label="Harga Beli">
                  {formatRupiah(produk.hargaBeli)}
                </td>
                <td className={styles.mono} data-label="Harga Jual">
                  {formatRupiah(produk.hargaJual)}
                </td>
                <td className={styles.mono} data-label="Stok">
                  {produk.stok}
                  {stokRendah && (
                    <span className={styles.pillWarn}>Stok rendah</span>
                  )}
                </td>
                <td data-label="Satuan">{produk.satuan}</td>
                {aksi && (
                  <td className={styles.aksiCell} data-label="Aksi">
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`Edit ${produk.nama}`}
                      onClick={() => aksi.onEdit(produk)}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M12.9 4.5 15.5 7.1 6.6 16H4v-2.6L12.9 4.5Z" />
                        <path d="M11.2 6.2 13.8 8.8" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`Hapus ${produk.nama}`}
                      onClick={() => aksi.onHapus(produk)}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M4 7h16" />
                        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {footer}
    </div>
  );
}
