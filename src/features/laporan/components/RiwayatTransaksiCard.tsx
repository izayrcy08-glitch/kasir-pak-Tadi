import { formatTanggalPendek, formatWaktu } from '../../../shared/lib/formatTanggal';
import { formatRupiah } from '../../../shared/lib/formatRupiah';
import type { MetodeBayar, Transaksi } from '../../../shared/types/transaksi';
import styles from './RiwayatTransaksiCard.module.css';

interface Props {
  daftar: Transaksi[];
  adaLagi: boolean;
  memuatLebih: boolean;
  onMuatLebih: () => void;
  onKlikBaris: (transaksi: Transaksi) => void;
}

const LABEL_METODE: Record<MetodeBayar, string> = {
  tunai: 'Tunai',
  qris_transfer: 'QRIS',
};

export function RiwayatTransaksiCard({ daftar, adaLagi, memuatLebih, onMuatLebih, onKlikBaris }: Props) {
  return (
    <div className={styles.card}>
      <h2>Riwayat Transaksi</h2>
      {daftar.length === 0 ? (
        <p className={styles.empty}>Belum ada transaksi pada rentang ini.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Waktu</th>
                <th>Total</th>
                <th>Metode</th>
              </tr>
            </thead>
            <tbody>
              {daftar.map((t) => {
                const waktu = t.dibuatPada.toDate();
                return (
                  <tr key={t.id} className={styles.row} onClick={() => onKlikBaris(t)}>
                    <td>{formatTanggalPendek(waktu)}</td>
                    <td className={styles.mono}>{formatWaktu(waktu)}</td>
                    <td className={styles.mono}>{formatRupiah(t.total)}</td>
                    <td>
                      <span className={`${styles.payTag} ${t.metodeBayar === 'tunai' ? styles.tunai : styles.qris}`}>
                        {LABEL_METODE[t.metodeBayar]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {adaLagi && (
            <button type="button" className={styles.muatLebih} onClick={onMuatLebih} disabled={memuatLebih}>
              {memuatLebih ? 'Memuat…' : 'Muat Lebih'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
