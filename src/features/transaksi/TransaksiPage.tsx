import { useEffect, useMemo, useState } from 'react';
import { getPrinterAdapter } from '../../platform/print';
import { simpanTransaksi, StokTidakCukupError } from '../../shared/firebase/transaksi.repo';
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

  const hasilFilter = useMemo(() => filterProduk(daftar, kataKunci, 'Semua'), [daftar, kataKunci]);
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

  async function handleBayar() {
    setErrorSimpan('');
    setSukses('');
    setMenyimpan(true);
    try {
      const draft: TransaksiDraft = {
        item: keranjang.item.map((it) => ({ produkId: it.produkId, qty: it.qty })),
        diskon,
        metodeBayar,
        dibayar: metodeBayar === 'tunai' ? dibayar : undefined,
      };
      const id = await simpanTransaksi(draft);

      try {
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
        await getPrinterAdapter().printReceipt(new TextEncoder().encode(teks));
      } catch {
        // Cetak best-effort — printer belum tersedia (noop) sampai fitur
        // Pengaturan > Printer dibangun. Kegagalan print tidak boleh
        // membatalkan status sukses transaksi yang sudah tersimpan.
      }

      keranjang.kosongkan();
      setDiskon(null);
      setDibayarStr('');
      setSukses('Transaksi tersimpan.');
    } catch (err) {
      if (err instanceof StokTidakCukupError) {
        const detail = err.detail
          .map((d) => `${d.nama} (diminta ${d.diminta}, tersedia ${d.tersedia})`)
          .join('; ');
        setErrorSimpan(`Stok tidak cukup: ${detail}.`);
      } else {
        setErrorSimpan('Gagal menyimpan transaksi. Periksa koneksi, lalu coba lagi.');
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
            <p className={styles.empty}>Gagal memuat data produk. Periksa koneksi, lalu muat ulang halaman.</p>
          ) : loading ? (
            <p className={styles.empty}>Memuat data produk…</p>
          ) : (
            <ProdukGrid daftar={hasilFilter} onTambah={keranjang.tambah} />
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
