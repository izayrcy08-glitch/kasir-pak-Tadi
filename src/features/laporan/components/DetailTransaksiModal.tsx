import { useState } from 'react';
import { MODE_PEMANTAU } from '../../../platform/perangkat';
import { getPrinterAdapter } from '../../../platform/print';
import { usePengaturanToko } from '../../../shared/hooks/usePengaturanToko';
import { formatRupiah } from '../../../shared/lib/formatRupiah';
import { formatTanggalPendek, formatWaktu } from '../../../shared/lib/formatTanggal';
import type { MetodeBayar, Transaksi } from '../../../shared/types/transaksi';
import { formatStruk } from '../../transaksi/logic/formatStruk';
import styles from './DetailTransaksiModal.module.css';

interface Props {
  transaksi: Transaksi;
  onTutup: () => void;
}

const LABEL_METODE: Record<MetodeBayar, string> = {
  tunai: 'Tunai',
  qris_transfer: 'QRIS/Transfer',
};

export function DetailTransaksiModal({ transaksi, onTutup }: Props) {
  const [mengirim, setMengirim] = useState(false);
  const { pengaturan } = usePengaturanToko();
  const waktu = new Date(transaksi.dibuatPada);

  // Printer masih noop (belum ada hardware sungguhan tersambung) — jangan
  // tampilkan pesan "berhasil dicetak" yang menyesatkan, cukup indikasi
  // sesaat sedang mengirim lalu kembali normal (best-effort, sama seperti
  // pola cetak di TransaksiPage.handleBayar).
  async function handleCetakUlang() {
    setMengirim(true);
    try {
      const teks = formatStruk({
        namaToko: pengaturan?.namaToko,
        transaksiId: transaksi.id,
        item: transaksi.item,
        ringkasan: { subtotal: transaksi.subtotal, totalDiskon: transaksi.totalDiskon, total: transaksi.total },
        diskon: transaksi.diskon,
        metodeBayar: transaksi.metodeBayar,
        dibayar: transaksi.dibayar,
        kembalian: transaksi.kembalian,
        dibuatPada: waktu,
      });
      await getPrinterAdapter().printReceipt(new TextEncoder().encode(teks));
    } catch {
      // best-effort, lihat catatan di atas.
    } finally {
      setMengirim(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onTutup}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.head}>
          <div>
            <h2>Detail Transaksi</h2>
            <p className={styles.sub}>
              {formatTanggalPendek(waktu)} · {formatWaktu(waktu)}
            </p>
          </div>
          <button type="button" className={styles.tutupBtn} aria-label="Tutup" onClick={onTutup}>
            <svg viewBox="0 0 24 24">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.items}>
          {transaksi.item.map((it) => (
            <div key={it.produkId} className={styles.item}>
              <span className={styles.itemNama}>{it.nama}</span>
              <span className={styles.itemDetail}>
                {it.qty} × {formatRupiah(it.hargaSatuan)} = {formatRupiah(it.subtotalItem)}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.sum}>
          <div className={styles.sumRow}>
            <span>Subtotal</span>
            <span className={styles.mono}>{formatRupiah(transaksi.subtotal)}</span>
          </div>
          {transaksi.diskon && (
            <div className={styles.sumRow}>
              <span>Diskon</span>
              <span className={styles.mono}>− {formatRupiah(transaksi.totalDiskon)}</span>
            </div>
          )}
          <div className={`${styles.sumRow} ${styles.total}`}>
            <span>Total</span>
            <span className={styles.mono}>{formatRupiah(transaksi.total)}</span>
          </div>
          <div className={styles.sumRow}>
            <span>Metode Bayar</span>
            <span>{LABEL_METODE[transaksi.metodeBayar]}</span>
          </div>
          {transaksi.metodeBayar === 'tunai' && (
            <>
              <div className={styles.sumRow}>
                <span>Dibayar</span>
                <span className={styles.mono}>{formatRupiah(transaksi.dibayar ?? 0)}</span>
              </div>
              <div className={styles.sumRow}>
                <span>Kembalian</span>
                <span className={styles.mono}>{formatRupiah(transaksi.kembalian ?? 0)}</span>
              </div>
            </>
          )}
        </div>

        {/* iPhone (mode pemantau) tidak bisa mencetak — lihat platform/print. */}
        {!MODE_PEMANTAU && (
          <button type="button" className={styles.ctaFull} onClick={handleCetakUlang} disabled={mengirim}>
            {mengirim ? 'Mengirim…' : 'Cetak Ulang Struk'}
          </button>
        )}
      </div>
    </div>
  );
}
