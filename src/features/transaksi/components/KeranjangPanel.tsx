import { useState } from 'react';
import { formatRupiah } from '../../../shared/lib/formatRupiah';
import type { Diskon, MetodeBayar } from '../../../shared/types/transaksi';
import type { ItemKeranjang } from '../hooks/useKeranjang';
import styles from './KeranjangPanel.module.css';

interface Props {
  item: ItemKeranjang[];
  subtotal: number;
  diskon: Diskon;
  totalDiskon: number;
  total: number;
  metodeBayar: MetodeBayar;
  dibayarStr: string;
  kembalian: number | undefined;
  bisaBayar: boolean;
  menyimpan: boolean;
  onUbahQty: (produkId: string, qty: number) => void;
  onHapus: (produkId: string) => void;
  onGantiMetode: (metode: MetodeBayar) => void;
  onUbahDibayar: (nilai: string) => void;
  onUbahDiskon: (diskon: Diskon) => void;
  onBayar: () => void;
}

export function KeranjangPanel({
  item,
  subtotal,
  diskon,
  totalDiskon,
  total,
  metodeBayar,
  dibayarStr,
  kembalian,
  bisaBayar,
  menyimpan,
  onUbahQty,
  onHapus,
  onGantiMetode,
  onUbahDibayar,
  onUbahDiskon,
  onBayar,
}: Props) {
  const [editorTerbuka, setEditorTerbuka] = useState(false);
  const tipeDiskon = diskon?.tipe ?? 'nominal';

  function ubahTipeDiskon(tipe: 'nominal' | 'persen') {
    onUbahDiskon({ tipe, nilai: diskon?.nilai ?? 0 });
  }

  function ubahNilaiDiskon(teks: string) {
    const nilai = Number(teks);
    if (teks === '' || Number.isNaN(nilai) || nilai <= 0) {
      onUbahDiskon(null);
      return;
    }
    onUbahDiskon({ tipe: tipeDiskon, nilai });
  }

  function hapusDiskon() {
    onUbahDiskon(null);
    setEditorTerbuka(false);
  }

  return (
    <>
      <div className={styles.cartHead}>
        <h2>Keranjang</h2>
        <span className={styles.count}>{item.length} item</span>
      </div>

      {item.length === 0 ? (
        <p className={styles.empty}>Keranjang masih kosong. Cari barang, lalu ketuk untuk menambahkannya.</p>
      ) : (
        <div className={styles.items}>
          {item.map((it) => (
            <div key={it.produkId} className={styles.item}>
              <div className={styles.itemInfo}>
                <p className={styles.name}>{it.nama}</p>
                <div className={styles.qtyRow}>
                  <button
                    type="button"
                    onClick={() => onUbahQty(it.produkId, it.qty - 1)}
                    aria-label={`Kurangi qty ${it.nama}`}
                  >
                    −
                  </button>
                  <span className={styles.qty}>{it.qty}</span>
                  <button
                    type="button"
                    onClick={() => onUbahQty(it.produkId, it.qty + 1)}
                    disabled={it.qty >= it.stokTersedia}
                    aria-label={`Tambah qty ${it.nama}`}
                  >
                    +
                  </button>
                  <span className={styles.hargaSatuan}>× {formatRupiah(it.hargaSatuan)}</span>
                </div>
              </div>
              <div className={styles.itemAksi}>
                <span className={styles.lineTotal}>{formatRupiah(it.hargaSatuan * it.qty)}</span>
                <button
                  type="button"
                  className={styles.hapusBtn}
                  onClick={() => onHapus(it.produkId)}
                  aria-label={`Hapus ${it.nama}`}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M4 7h16" />
                    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.sum}>
        <div className={styles.sumRow}>
          <span>Subtotal</span>
          <span className={styles.val}>{formatRupiah(subtotal)}</span>
        </div>
        <div className={styles.sumRow}>
          <span>Diskon</span>
          {!diskon && !editorTerbuka ? (
            <button type="button" className={styles.linkDiskon} onClick={() => setEditorTerbuka(true)}>
              + Diskon
            </button>
          ) : (
            <span className={styles.val}>{diskon ? `− ${formatRupiah(totalDiskon)}` : formatRupiah(0)}</span>
          )}
        </div>
        {(editorTerbuka || diskon) && (
          <div className={styles.diskonEditor}>
            <div className={styles.tipeToggle}>
              <button
                type="button"
                className={`${styles.tipeBtn} ${tipeDiskon === 'nominal' ? styles.selected : ''}`}
                onClick={() => ubahTipeDiskon('nominal')}
              >
                Rp
              </button>
              <button
                type="button"
                className={`${styles.tipeBtn} ${tipeDiskon === 'persen' ? styles.selected : ''}`}
                onClick={() => ubahTipeDiskon('persen')}
              >
                %
              </button>
            </div>
            <input
              type="number"
              min={0}
              className={styles.diskonInput}
              placeholder={tipeDiskon === 'persen' ? 'Persen' : 'Nominal'}
              value={diskon?.nilai || ''}
              onChange={(e) => ubahNilaiDiskon(e.target.value)}
            />
            <button
              type="button"
              className={styles.hapusDiskonBtn}
              onClick={hapusDiskon}
              aria-label="Hapus diskon"
            >
              ×
            </button>
          </div>
        )}
        <div className={`${styles.sumRow} ${styles.total}`}>
          <span>Total</span>
          <span className={styles.val}>{formatRupiah(total)}</span>
        </div>
      </div>

      <div className={styles.payToggle}>
        <button
          type="button"
          className={`${styles.payBtn} ${metodeBayar === 'tunai' ? styles.selected : ''}`}
          onClick={() => onGantiMetode('tunai')}
        >
          Tunai
        </button>
        <button
          type="button"
          className={`${styles.payBtn} ${metodeBayar === 'qris_transfer' ? styles.selected : ''}`}
          onClick={() => onGantiMetode('qris_transfer')}
        >
          QRIS/Transfer
        </button>
      </div>

      {metodeBayar === 'tunai' && (
        <>
          <div className={styles.fieldRow}>
            <span>Dibayar</span>
            <input
              type="number"
              min={0}
              className={styles.dibayarInput}
              placeholder="Rp 0"
              value={dibayarStr}
              onChange={(e) => onUbahDibayar(e.target.value)}
            />
          </div>
          <div className={styles.fieldRow}>
            <span>Kembalian</span>
            <span className={styles.amt}>{formatRupiah(Math.max(kembalian ?? 0, 0))}</span>
          </div>
        </>
      )}

      <button type="button" className={styles.ctaFull} disabled={!bisaBayar} onClick={onBayar}>
        <svg viewBox="0 0 24 24">
          <path d="M6 9V4h12v5" />
          <rect x="4" y="9" width="16" height="7" rx="1.5" />
          <path d="M6 16v4h12v-4" />
        </svg>
        {menyimpan ? 'Menyimpan…' : 'Bayar & Cetak Struk'}
      </button>
    </>
  );
}
