import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { simpanBerkas } from '../../../platform/berkas';
import type { RingkasanData } from '../../../shared/db/berkasBackup';
import { BerkasBackupTidakValidError } from '../../../shared/db/galat';
import { exportDb, panggil, periksaBackup, pulihkanBackup } from '../../../shared/db/klienDb';
import { formatTanggalPendek, formatWaktu } from '../../../shared/lib/formatTanggal';
import { KonfirmasiPulihkan } from './components/KonfirmasiPulihkan';
import { useStatusBackup } from './hooks/useStatusBackup';
import { AWALAN_BERKAS_BACKUP, namaBerkasBackup, perluPengingatBackup } from './logic/jadwalBackup';
import styles from './BackupPage.module.css';

interface CalonPulihkan {
  bytes: Uint8Array;
  namaFile: string;
  isiFile: RingkasanData;
  isiSekarang: RingkasanData;
}

function pesanGalat(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function BackupPage() {
  const navigate = useNavigate();
  const { status } = useStatusBackup();
  const inputFile = useRef<HTMLInputElement>(null);
  const [membuat, setMembuat] = useState(false);
  const [memeriksa, setMemeriksa] = useState(false);
  const [errorBackup, setErrorBackup] = useState('');
  const [errorPulihkan, setErrorPulihkan] = useState('');
  const [calon, setCalon] = useState<CalonPulihkan | null>(null);
  const [sukses, setSukses] = useState('');

  useEffect(() => {
    if (!sukses) return;
    const timer = setTimeout(() => setSukses(''), 3000);
    return () => clearTimeout(timer);
  }, [sukses]);

  async function handleBuatBackup() {
    setErrorBackup('');
    setMembuat(true);
    try {
      const hasil = await simpanBerkas({
        nama: namaBerkasBackup(new Date()),
        bytes: await exportDb(),
        mime: 'application/octet-stream',
        judul: 'Kirim file backup Kasir',
        awalanBersihkan: AWALAN_BERKAS_BACKUP,
      });
      if (hasil === 'tersimpan') {
        await panggil('catatBackup');
        setSukses('File backup tersimpan.');
      }
    } catch (err) {
      setErrorBackup(`Gagal membuat file backup: ${pesanGalat(err)}`);
    } finally {
      setMembuat(false);
    }
  }

  async function handlePilihFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Kosongkan supaya file yang sama bisa dipilih lagi setelah dibatalkan.
    e.target.value = '';
    if (!file) return;
    setErrorPulihkan('');
    setMemeriksa(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const [isiFile, isiSekarang] = await Promise.all([periksaBackup(bytes), panggil('ringkasData')]);
      setCalon({ bytes, namaFile: file.name, isiFile, isiSekarang });
    } catch (err) {
      setErrorPulihkan(
        err instanceof BerkasBackupTidakValidError ? err.message : `Gagal membaca file: ${pesanGalat(err)}`,
      );
    } finally {
      setMemeriksa(false);
    }
  }

  async function handleGantiData() {
    if (!calon) return;
    await pulihkanBackup(calon.bytes);
    setCalon(null);
    setSukses('Data toko berhasil dipulihkan.');
  }

  const perluBackup = status ? perluPengingatBackup(status, new Date()) : false;
  const terakhir = status?.terakhirBackupPada ? new Date(status.terakhirBackupPada) : null;

  return (
    <>
      <div className={styles.pageHead}>
        <button type="button" className={styles.backLink} onClick={() => navigate('/pengaturan')}>
          <svg viewBox="0 0 24 24">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Pengaturan
        </button>
        <h1>Backup & Pulihkan Data</h1>
        <p className={styles.sub}>Data toko hanya tersimpan di device ini — simpan salinannya di tempat lain.</p>
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
          <h2>Backup data</h2>
          <p className={styles.teks}>
            Buat file berisi seluruh data toko, lalu simpan di luar device ini — kirim ke WhatsApp sendiri, Google
            Drive, atau flashdisk. Kalau device rusak atau hilang, data bisa dipulihkan dari file itu.
          </p>
          <p className={styles.status}>
            {terakhir ? (
              <>
                Backup terakhir:{' '}
                <span className={styles.angka}>
                  {formatTanggalPendek(terakhir)} · {formatWaktu(terakhir)}
                </span>
              </>
            ) : (
              'Belum pernah backup di device ini.'
            )}
            {perluBackup && <span className={styles.pillWarn}>Perlu backup</span>}
          </p>
          <button type="button" className={styles.btnAccent} onClick={handleBuatBackup} disabled={membuat}>
            {membuat ? 'Membuat file…' : 'Buat file backup'}
          </button>
          {errorBackup && <p className={styles.formError}>{errorBackup}</p>}
        </section>

        <section className={styles.card}>
          <h2>Pulihkan dari backup</h2>
          <p className={styles.teks}>
            Pakai saat ganti device atau setelah data hilang. <strong>Semua data di device ini</strong> (produk,
            transaksi, identitas toko) akan diganti dengan isi file backup.
          </p>
          <input ref={inputFile} type="file" className={styles.hiddenInput} onChange={handlePilihFile} />
          <button
            type="button"
            className={styles.btnOutline}
            onClick={() => inputFile.current?.click()}
            disabled={memeriksa}
          >
            {memeriksa ? 'Memeriksa file…' : 'Pilih file backup…'}
          </button>
          {errorPulihkan && <p className={styles.formError}>{errorPulihkan}</p>}
        </section>

        <section className={styles.card}>
          <h2>Pindah kasir ke device lain</h2>
          <ol className={styles.langkah}>
            <li>Di device lama: buat file backup, kirim ke device baru.</li>
            <li>Di device baru: Pulihkan dari backup, pilih file tadi.</li>
            <li>
              Berhenti memakai device lama untuk transaksi. Data kedua device tidak tersambung — transaksi di device
              lama tidak akan masuk ke device baru.
            </li>
          </ol>
        </section>
      </div>

      {calon && (
        <KonfirmasiPulihkan
          namaFile={calon.namaFile}
          isiFile={calon.isiFile}
          isiSekarang={calon.isiSekarang}
          onGanti={handleGantiData}
          onBatal={() => setCalon(null)}
        />
      )}
    </>
  );
}
