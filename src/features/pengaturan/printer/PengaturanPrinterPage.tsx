import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPrinterAdapter } from '../../../platform/print';
import { buildBukaLaciKas, buildInisialisasi, buildTeksBaris, gabungkanPerintah } from './logic/escposBuilder';
import styles from './PengaturanPrinterPage.module.css';

type KoneksiPrinter = 'bluetooth' | 'usb';
type LebarKertas = '58' | '80';

const KUNCI_KONEKSI = 'pengaturan-printer-koneksi';
const KUNCI_LEBAR_KERTAS = 'pengaturan-printer-lebar-kertas';

function bacaDariLocalStorage<T extends string>(kunci: string, pilihan: T[], default_: T): T {
  try {
    const nilai = window.localStorage.getItem(kunci);
    return pilihan.includes(nilai as T) ? (nilai as T) : default_;
  } catch {
    return default_;
  }
}

function tulisKeLocalStorage(kunci: string, nilai: string) {
  try {
    window.localStorage.setItem(kunci, nilai);
  } catch {
    // Penyimpanan pengaturan printer bersifat best-effort per device —
    // kalau localStorage tidak tersedia (mis. mode privat), pilihan cukup berlaku untuk sesi ini.
  }
}

export function PengaturanPrinterPage() {
  const navigate = useNavigate();
  const [koneksi, setKoneksi] = useState<KoneksiPrinter>(() =>
    bacaDariLocalStorage(KUNCI_KONEKSI, ['bluetooth', 'usb'], 'bluetooth'),
  );
  const [lebarKertas, setLebarKertas] = useState<LebarKertas>(() =>
    bacaDariLocalStorage(KUNCI_LEBAR_KERTAS, ['58', '80'], '58'),
  );
  const [pesanAksi, setPesanAksi] = useState('');
  const [terhubung, setTerhubung] = useState(false);

  const adapter = getPrinterAdapter();
  // isSupported() cuma berarti platform ini punya API-nya (mis. Web Serial
  // di Chrome/Edge desktop) — bukan berarti printer sudah dipilih/tersambung.
  const printerTersedia = adapter.isSupported();

  function handleGantiKoneksi(nilai: KoneksiPrinter) {
    setKoneksi(nilai);
    tulisKeLocalStorage(KUNCI_KONEKSI, nilai);
  }

  function handleGantiLebarKertas(nilai: LebarKertas) {
    setLebarKertas(nilai);
    tulisKeLocalStorage(KUNCI_LEBAR_KERTAS, nilai);
  }

  async function handleTesCetak() {
    setPesanAksi('');
    try {
      await adapter.connect();
      setTerhubung(true);
      const payload = gabungkanPerintah(buildInisialisasi(), buildTeksBaris('Tes cetak — Kasir Pak Tadi'));
      await adapter.printReceipt(payload);
    } catch {
      setTerhubung(false);
      setPesanAksi('Gagal tes cetak. Printer belum terhubung.');
    }
  }

  async function handleBukaLaciKas() {
    setPesanAksi('');
    try {
      await adapter.connect();
      setTerhubung(true);
      await adapter.printReceipt(buildBukaLaciKas());
    } catch {
      setTerhubung(false);
      setPesanAksi('Gagal membuka laci kas. Printer belum terhubung.');
    }
  }

  return (
    <>
      <div className={styles.pageHead}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/pengaturan')}>
          <svg viewBox="0 0 24 24">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Pengaturan
        </button>
        <h1>Printer Struk &amp; Laci Kas</h1>
        <p className={styles.sub}>Koneksi printer, lebar kertas, dan tes buka laci kas.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.connToggle}>
          <button
            type="button"
            className={`${styles.connBtn} ${koneksi === 'bluetooth' ? styles.selected : ''}`}
            onClick={() => handleGantiKoneksi('bluetooth')}
          >
            Bluetooth
          </button>
          <button
            type="button"
            className={`${styles.connBtn} ${koneksi === 'usb' ? styles.selected : ''}`}
            onClick={() => handleGantiKoneksi('usb')}
          >
            USB
          </button>
        </div>

        <div className={styles.statusRow}>
          <div className={styles.statusLeft}>
            <span className={`${styles.statusDot} ${terhubung ? styles.terhubung : ''}`} />
            <span className={styles.statusText}>
              {!printerTersedia
                ? 'Platform ini belum mendukung printer'
                : terhubung
                  ? 'Terhubung'
                  : 'Belum terhubung — klik Tes Cetak untuk pilih printer'}
            </span>
          </div>
        </div>

        <div className={styles.formField}>
          <label>Lebar Kertas</label>
          <div className={styles.chipRow}>
            <button
              type="button"
              className={`${styles.paperChip} ${lebarKertas === '58' ? styles.active : ''}`}
              onClick={() => handleGantiLebarKertas('58')}
            >
              58mm
            </button>
            <button
              type="button"
              className={`${styles.paperChip} ${lebarKertas === '80' ? styles.active : ''}`}
              onClick={() => handleGantiLebarKertas('80')}
            >
              80mm
            </button>
          </div>
        </div>

        <div className={styles.testRow}>
          <button
            type="button"
            className={styles.btnOutlineFlex}
            onClick={handleTesCetak}
            disabled={!printerTersedia}
          >
            Tes Cetak
          </button>
          <button
            type="button"
            className={styles.btnOutlineFlex}
            onClick={handleBukaLaciKas}
            disabled={!printerTersedia}
          >
            Buka Laci Kas
          </button>
        </div>

        {pesanAksi && <p className={styles.catatan}>{pesanAksi}</p>}
        {!printerTersedia && (
          <p className={styles.catatan}>
            Perangkat ini belum bisa dipakai untuk cetak — printer USB (Web Serial) baru didukung di
            Chrome/Edge Windows, sedangkan Bluetooth Android menyusul terpisah.
          </p>
        )}
      </div>
    </>
  );
}
