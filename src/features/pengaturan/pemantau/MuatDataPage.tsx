import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { BerkasBackupTidakValidError } from '../../../shared/db/galat';
import { panggil, periksaBackup, pulihkanBackup } from '../../../shared/db/klienDb';
import { formatTanggalPendek, formatWaktu } from '../../../shared/lib/formatTanggal';
import { adaTransaksiLebihBaru } from '../backup/logic/bandingkanIsi';
import { useRingkasanData } from './hooks/useRingkasanData';
import styles from './MuatDataPage.module.css';

function formatTerakhir(ms: number | null): string {
  if (ms === null) return '—';
  const t = new Date(ms);
  return `${formatTanggalPendek(t)} · ${formatWaktu(t)}`;
}

// Mode pemantau (iPhone): tampilkan salinan data kasir dari file backup.
// Beda dengan Pulihkan di kasir, mengganti data di sini tidak berisiko —
// isinya memang cuma salinan — jadi file langsung dimuat tanpa dialog
// "ganti semua data". Konfirmasi hanya kalau file lebih lama dari yang
// sedang ditampilkan (kemungkinan salah pilih file).
export function MuatDataPage() {
  const { ringkasan } = useRingkasanData();
  const inputFile = useRef<HTMLInputElement>(null);
  const [memuat, setMemuat] = useState(false);
  const [error, setError] = useState('');
  const [sukses, setSukses] = useState('');

  useEffect(() => {
    if (!sukses) return;
    const timer = setTimeout(() => setSukses(''), 3000);
    return () => clearTimeout(timer);
  }, [sukses]);

  async function handlePilihFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Kosongkan supaya file yang sama bisa dipilih lagi.
    e.target.value = '';
    if (!file) return;
    setError('');
    setSukses('');
    setMemuat(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const [isiFile, isiSekarang] = await Promise.all([periksaBackup(bytes), panggil('ringkasData')]);
      if (
        adaTransaksiLebihBaru(isiSekarang, isiFile) &&
        !window.confirm(
          `File ini lebih lama dari data yang sedang ditampilkan.\n\n` +
            `Transaksi terakhir di file: ${formatTerakhir(isiFile.transaksiTerakhirPada)}\n` +
            `Yang sedang ditampilkan: ${formatTerakhir(isiSekarang.transaksiTerakhirPada)}\n\n` +
            `Tetap tampilkan data dari file ini?`,
        )
      ) {
        return;
      }
      await pulihkanBackup(bytes);
      setSukses('Data dari kasir berhasil dimuat.');
    } catch (err) {
      setError(
        err instanceof BerkasBackupTidakValidError
          ? err.message
          : `Gagal memuat file: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setMemuat(false);
    }
  }

  const baris = ringkasan
    ? [
        { label: 'Nama toko', nilai: ringkasan.namaToko ?? '—', angka: false },
        { label: 'Produk', nilai: ringkasan.jumlahProduk, angka: true },
        { label: 'Transaksi', nilai: ringkasan.jumlahTransaksi, angka: true },
        { label: 'Transaksi terakhir', nilai: formatTerakhir(ringkasan.transaksiTerakhirPada), angka: true },
      ]
    : [];

  return (
    <>
      <div className={styles.pageHead}>
        <h1>Muat Data dari Kasir</h1>
        <p className={styles.sub}>
          Perangkat ini hanya menampilkan salinan data kasir. Muat file backup terbaru untuk melihat penjualan terkini.
        </p>
      </div>

      {sukses && (
        <div className={styles.successToast} role="status">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M8 12.5 10.8 15.3 16 9.5" />
          </svg>
          {sukses}
        </div>
      )}

      <div className={styles.cards}>
        <section className={styles.card}>
          <h2>Muat file terbaru</h2>
          <ol className={styles.langkah}>
            <li>
              Di perangkat kasir: <strong>Pengaturan → Backup &amp; Pulihkan Data → Buat file backup</strong>, lalu kirim
              ke perangkat ini (mis. lewat WhatsApp).
            </li>
            <li>
              Di perangkat ini: buka file kiriman itu, tekan <strong>Bagikan → Simpan ke File</strong>.
            </li>
            <li>Tekan tombol di bawah, lalu pilih file tadi.</li>
          </ol>
          <input ref={inputFile} type="file" className={styles.hiddenInput} onChange={handlePilihFile} />
          <button
            type="button"
            className={styles.btnAccent}
            onClick={() => inputFile.current?.click()}
            disabled={memuat}
          >
            {memuat ? 'Memuat file…' : 'Pilih file backup…'}
          </button>
          {error && (
            <p className={styles.formError} role="alert">
              {error}
            </p>
          )}
          <p className={styles.catatan}>
            Data kasir tidak berubah apa pun yang dilakukan di sini. Transaksi baru di kasir baru terlihat setelah file
            berikutnya dimuat.
          </p>
        </section>

        <section className={styles.card}>
          <h2>Data yang sedang ditampilkan</h2>
          <table className={styles.tabel}>
            <tbody>
              {baris.map((b) => (
                <tr key={b.label}>
                  <th scope="row">{b.label}</th>
                  <td className={b.angka ? styles.angka : undefined}>{b.nilai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
