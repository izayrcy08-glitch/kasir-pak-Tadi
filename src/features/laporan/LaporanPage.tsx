import { useMemo, useState } from 'react';
import { idHariIni } from '../../shared/lib/idHariIni';
import { formatRentangTanggal } from '../../shared/lib/formatTanggal';
import type { Transaksi } from '../../shared/types/transaksi';
import { DetailTransaksiModal } from './components/DetailTransaksiModal';
import { ProdukTerlarisCard } from './components/ProdukTerlarisCard';
import { RangeFilterToolbar, type PilihanRentang } from './components/RangeFilterToolbar';
import { RingkasanMetodeBayar } from './components/RingkasanMetodeBayar';
import { RiwayatTransaksiCard } from './components/RiwayatTransaksiCard';
import { StatRow } from './components/StatRow';
import { useEksporCsv } from './hooks/useEksporCsv';
import { useLaporanPeriode } from './hooks/useLaporanPeriode';
import { useRingkasanOmzet } from './hooks/useRingkasanOmzet';
import { useRiwayatTransaksi } from './hooks/useRiwayatTransaksi';
import { agregatOmzet } from './logic/agregatOmzet';
import { agregatProdukTerlaris } from './logic/agregatProdukTerlaris';
import { awalHari, akhirHari, hitungRentangPreset } from './logic/rentangTanggal';
import styles from './LaporanPage.module.css';

export function LaporanPage() {
  const [pilihan, setPilihan] = useState<PilihanRentang>('bulan_ini');
  const [kustomMulai, setKustomMulai] = useState(idHariIni());
  const [kustomAkhir, setKustomAkhir] = useState(idHariIni());
  const [pemicuMuatUlang, setPemicuMuatUlang] = useState(0);
  const [transaksiDipilih, setTransaksiDipilih] = useState<Transaksi | null>(null);

  const rentangAktif = useMemo(() => {
    if (pilihan === 'kustom') {
      const mulai = parseTanggalInput(kustomMulai);
      const akhir = parseTanggalInput(kustomAkhir);
      if (mulai && akhir) return { mulai: awalHari(mulai), akhir: akhirHari(akhir) };
    }
    return hitungRentangPreset(pilihan === 'kustom' ? 'bulan_ini' : pilihan, new Date());
  }, [pilihan, kustomMulai, kustomAkhir]);

  const ringkasanTetap = useRingkasanOmzet();
  const periode = useLaporanPeriode(rentangAktif, pemicuMuatUlang);
  const riwayat = useRiwayatTransaksi(rentangAktif, pemicuMuatUlang);
  const eksporCsv = useEksporCsv(rentangAktif);

  const ringkasanPeriode = useMemo(() => agregatOmzet(periode.dokumen), [periode.dokumen]);
  const produkTerlaris = useMemo(() => agregatProdukTerlaris(periode.dokumen), [periode.dokumen]);

  function muatUlang() {
    ringkasanTetap.muatUlang();
    setPemicuMuatUlang((n) => n + 1);
  }

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <h1>Laporan Penjualan</h1>
          <p className={styles.sub}>Ringkasan omzet, produk terlaris, dan riwayat transaksi.</p>
        </div>
        <div className={styles.headAksi}>
          <span className={styles.rangeChip}>
            <svg viewBox="0 0 24 24">
              <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
              <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" />
              <line x1="8" y1="3" x2="8" y2="6.5" />
              <line x1="16" y1="3" x2="16" y2="6.5" />
            </svg>
            {formatRentangTanggal(rentangAktif.mulai, rentangAktif.akhir)}
          </span>
          <button type="button" className={styles.muatUlangBtn} onClick={muatUlang}>
            Muat Ulang
          </button>
          <button
            type="button"
            className={styles.eksporBtn}
            onClick={eksporCsv.ekspor}
            disabled={eksporCsv.mengekspor || (!riwayat.loading && riwayat.daftar.length === 0)}
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 4v11" />
              <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
              <path d="M5 19.5h14" />
            </svg>
            {eksporCsv.mengekspor ? 'Menyiapkan…' : 'Ekspor CSV'}
          </button>
        </div>
      </div>

      {eksporCsv.sukses && (
        <div className={styles.successToast} role="status">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5 10.8 15.3 16 9.5" />
          </svg>
          {eksporCsv.sukses}
        </div>
      )}

      <RangeFilterToolbar
        pilihan={pilihan}
        kustomMulai={kustomMulai}
        kustomAkhir={kustomAkhir}
        onPilih={setPilihan}
        onUbahKustomMulai={setKustomMulai}
        onUbahKustomAkhir={setKustomAkhir}
      />

      {ringkasanTetap.error || periode.error || riwayat.error ? (
        <div className={styles.errorBanner}>Gagal memuat sebagian data laporan. Coba lagi.</div>
      ) : null}
      {eksporCsv.error && (
        <div className={styles.errorBanner} role="alert">
          {eksporCsv.error}
        </div>
      )}

      <StatRow
        omzetHariIni={ringkasanTetap.hariIni.omzet}
        omzetMingguIni={ringkasanTetap.mingguIni.omzet}
        omzetBulanIni={ringkasanTetap.bulanIni.omzet}
      />

      <div className={styles.grid2}>
        <div className={styles.kolomKiri}>
          <ProdukTerlarisCard daftar={produkTerlaris} />
          <RingkasanMetodeBayar ringkasan={ringkasanPeriode} />
        </div>
        <RiwayatTransaksiCard
          daftar={riwayat.daftar}
          adaLagi={riwayat.adaLagi}
          memuatLebih={riwayat.memuatLebih}
          onMuatLebih={riwayat.muatLebih}
          onKlikBaris={setTransaksiDipilih}
        />
      </div>

      {transaksiDipilih && (
        <DetailTransaksiModal transaksi={transaksiDipilih} onTutup={() => setTransaksiDipilih(null)} />
      )}
    </>
  );
}

// Input <input type="date"> selalu memberi 'YYYY-MM-DD' atau string kosong —
// diparse manual (bukan `new Date(str)`) supaya konsisten local time, sama
// seperti idHariIni, bukan UTC midnight yang bisa mundur satu hari di WIB.
function parseTanggalInput(nilai: string): Date | null {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nilai);
  if (!cocok) return null;
  const [, tahun, bulan, tanggal] = cocok;
  return new Date(Number(tahun), Number(bulan) - 1, Number(tanggal));
}
