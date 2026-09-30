import { useEffect, useMemo, useState } from 'react';
import { getPrinterAdapter } from '../../platform/print';
import { pesanGagalCetak } from '../../platform/print/pesanGagalCetak';
import { panggil } from '../../shared/db/klienDb';
import { PembayaranKurangError, StokTidakCukupError } from '../../shared/db/galat';
import { LihatLebih } from '../../shared/components/LihatLebih';
import { useBatasTampil } from '../../shared/hooks/useBatasTampil';
import { useMediaQuery } from '../../shared/hooks/useMediaQuery';
import { usePengaturanToko } from '../../shared/hooks/usePengaturanToko';
import type { Diskon, ItemTransaksi, MetodeBayar, TransaksiDraft } from '../../shared/types/transaksi';
import { filterProduk } from '../produk/logic/filterProduk';
import { useProduk } from '../produk/hooks/useProduk';
import { KeranjangPanel } from './components/KeranjangPanel';
import { ProdukGrid } from './components/ProdukGrid';
import { SearchProduk } from './components/SearchProduk';
import { useKeranjang } from './hooks/useKeranjang';
import { formatStruk } from './logic/formatStruk';
import { hitungKembalian } from './logic/hitungKembalian';
import { hitungTotal } from './logic/hitungTotal';
import styles from './TransaksiPage.module.css';

export function TransaksiPage() {
  const { daftar, loading, error } = useProduk();
  const { pengaturan } = usePengaturanToko();
  const keranjang = useKeranjang();

  const [kataKunci, setKataKunci] = useState('');
  const [diskon, setDiskon] = useState<Diskon>(null);
  const [metodeBayar, setMetodeBayar] = useState<MetodeBayar>('tunai');
  const [dibayarStr, setDibayarStr] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [errorSimpan, setErrorSimpan] = useState('');
  const [sukses, setSukses] = useState('');
  const [gagalCetak, setGagalCetak] = useState<{ pesan: string; bytes: Uint8Array } | null>(null);
  const [mencetakUlang, setMencetakUlang] = useState(false);

  const hasilFilter = useMemo(() => filterProduk(daftar, kataKunci, 'Semua'), [daftar, kataKunci]);
  // Di HP/tablet grid produk ada DI ATAS keranjang dan halaman ikut
  // menggulir — tanpa batas, keranjang terdorong jauh ke bawah. Di stasiun
  // kasir (>=1024px) grid punya gulir sendiri di samping keranjang, jadi
  // tampil semua seperti mockup.
  const layarLebar = useMediaQuery('(min-width: 1024px)');
  const tampil = useBatasTampil(6, kataKunci);
  const batasProduk = layarLebar ? Infinity : tampil.batas;
  const produkTampil = hasilFilter.slice(0, batasProduk);
  const ringkasan = useMemo(() => hitungTotal(keranjang.item, diskon), [keranjang.item, diskon]);
  const dibayar = Number(dibayarStr || 0);
  const kembalian = metodeBayar === 'tunai' ? hitungKembalian(ringkasan.total, dibayar) : undefined;
  const bisaBayar =
    keranjang.item.length > 0 &&
    !menyimpan &&
    (metodeBayar !== 'tunai' || (kembalian !== undefined && kembalian >= 0));

  // Notifikasi sukses sengaja sementara (toast) — bukan banner permanen —
  // supaya tidak menghalangi keranjang berikutnya sampai di-dismiss manual.
  useEffect(() => {
    if (!sukses) return;
    const timer = setTimeout(() => setSukses(''), 3000);
    return () => clearTimeout(timer);
  }, [sukses]);

  async function cetak(bytes: Uint8Array): Promise<boolean> {
    try {
      await getPrinterAdapter().printReceipt(bytes);
      setGagalCetak(null);
      return true;
    } catch (err) {
      // Transaksi sudah tersimpan — gagal cetak tidak boleh membatalkannya,
      // tapi kasir wajib tahu struk tidak keluar (dulu gagal diam-diam).
      setGagalCetak({ pesan: pesanGagalCetak(err), bytes });
      return false;
    }
  }

  async function handleCobaCetakLagi() {
    if (!gagalCetak) return;
    setMencetakUlang(true);
    if (await cetak(gagalCetak.bytes)) setSukses('Struk tercetak.');
    setMencetakUlang(false);
  }

  async function handleBayar() {
    setErrorSimpan('');
    setSukses('');
    setGagalCetak(null);
    setMenyimpan(true);
    try {
      const draft: TransaksiDraft = {
        item: keranjang.item.map((it) => ({ produkId: it.produkId, qty: it.qty })),
        diskon,
        metodeBayar,
        dibayar: metodeBayar === 'tunai' ? dibayar : undefined,
      };
      const id = await panggil('simpanTransaksi', draft);

      const itemStruk: ItemTransaksi[] = keranjang.item.map((it) => ({
        produkId: it.produkId,
        nama: it.nama,
        kodePart: it.kodePart,
        hargaSatuan: it.hargaSatuan,
        qty: it.qty,
        subtotalItem: it.hargaSatuan * it.qty,
      }));
      const teks = formatStruk({
        namaToko: pengaturan?.namaToko,
        transaksiId: id,
        item: itemStruk,
        ringkasan,
        diskon,
        metodeBayar,
        dibayar: metodeBayar === 'tunai' ? dibayar : undefined,
        kembalian: metodeBayar === 'tunai' ? kembalian : undefined,
        dibuatPada: new Date(),
      });

      keranjang.kosongkan();
      setDiskon(null);
      setDibayarStr('');
      if (await cetak(new TextEncoder().encode(teks))) setSukses('Transaksi tersimpan.');
    } catch (err) {
      if (err instanceof StokTidakCukupError) {
        const detail = err.detail
          .map((d) => `${d.nama} (diminta ${d.diminta}, tersedia ${d.tersedia})`)
          .join('; ');
        setErrorSimpan(`Stok tidak cukup: ${detail}.`);
      } else if (err instanceof PembayaranKurangError) {
        setErrorSimpan('Uang yang dibayar kurang dari total.');
      } else {
        setErrorSimpan('Gagal menyimpan transaksi. Coba lagi; kalau terus gagal, tutup lalu buka ulang aplikasi.');
      }
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Transaksi</h1>
        <p className={styles.sub}>Cari produk, tambah ke keranjang, lalu bayar.</p>
      </div>

      {errorSimpan && <div className={styles.errorBanner}>{errorSimpan}</div>}
      {gagalCetak && (
        <div className={styles.cetakGagal} role="alert">
          <p className={styles.cetakGagalTeks}>
            <strong>Transaksi tersimpan, tapi struk tidak tercetak.</strong> {gagalCetak.pesan}
          </p>
          <div className={styles.cetakGagalAksi}>
            <button
              type="button"
              className={styles.btnCobaLagi}
              onClick={handleCobaCetakLagi}
              disabled={mencetakUlang}
            >
              {mencetakUlang ? 'Mencetak…' : 'Coba cetak lagi'}
            </button>
            <button type="button" className={styles.btnTutup} onClick={() => setGagalCetak(null)}>
              Tutup
            </button>
          </div>
        </div>
      )}
      {sukses && (
        <div className={styles.successToast} role="status">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5 10.8 15.3 16 9.5" />
          </svg>
          {sukses}
        </div>
      )}

      <div className={styles.workspace}>
        <div className={`${styles.card} ${styles.panelSearch}`}>
          <SearchProduk value={kataKunci} onChange={setKataKunci} />
          {error ? (
            <p className={styles.empty}>Gagal memuat data produk. Tutup lalu buka ulang aplikasi.</p>
          ) : loading ? (
            <p className={styles.empty}>Memuat data produk…</p>
          ) : (
            <>
              <ProdukGrid daftar={produkTampil} onTambah={keranjang.tambah} />
              <LihatLebih
                bisaLebihBanyak={hasilFilter.length > batasProduk}
                bisaLebihSedikit={!layarLebar && produkTampil.length > 6}
                onLebihBanyak={tampil.lebihBanyak}
                onLebihSedikit={tampil.lebihSedikit}
                keterangan={
                  hasilFilter.length > batasProduk || produkTampil.length > 6 ? (
                    <>
                      <span className={styles.angka}>{produkTampil.length}</span> dari{' '}
                      <span className={styles.angka}>{hasilFilter.length}</span> produk
                    </>
                  ) : undefined
                }
              />
            </>
          )}
        </div>

        <div className={`${styles.card} ${styles.panelCart}`}>
          <KeranjangPanel
            item={keranjang.item}
            subtotal={ringkasan.subtotal}
            diskon={diskon}
            totalDiskon={ringkasan.totalDiskon}
            total={ringkasan.total}
            metodeBayar={metodeBayar}
            dibayarStr={dibayarStr}
            kembalian={kembalian}
            bisaBayar={bisaBayar}
            menyimpan={menyimpan}
            onUbahQty={keranjang.ubahQty}
            onHapus={keranjang.hapus}
            onGantiMetode={setMetodeBayar}
            onUbahDibayar={setDibayarStr}
            onUbahDiskon={setDiskon}
            onBayar={handleBayar}
          />
        </div>
      </div>
    </>
  );
}
