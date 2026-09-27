// SEMENTARA (migrasi SQLite, langkah 1): halaman uji coba untuk membuktikan
// SQLite-WASM + OPFS benar-benar menyimpan data permanen. Hapus setelah
// fondasi src/shared/db/ terbukti di Windows & Android.
import { useCallback, useEffect, useState } from 'react';
import { exportDb, infoDb, query } from '../shared/db/klienDb';
import type { InfoDb } from '../shared/db/protokol';
import styles from './UjiDbPage.module.css';

interface Catatan {
  id: number;
  isi: string;
  dibuat: string;
}

export function UjiDbPage() {
  const [info, setInfo] = useState<InfoDb | null>(null);
  const [persisten, setPersisten] = useState<boolean | null>(null);
  const [jumlah, setJumlah] = useState(0);
  const [terakhir, setTerakhir] = useState<Catatan[]>([]);
  const [pesan, setPesan] = useState('Menyiapkan database…');

  const muatUlang = useCallback(async () => {
    const [{ n }] = await query<{ n: number }>('select count(*) as n from uji_catatan');
    setJumlah(n);
    setTerakhir(
      await query<Catatan>('select id, isi, dibuat from uji_catatan order by id desc limit 5'),
    );
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await query(
          'create table if not exists uji_catatan (id integer primary key, isi text not null, dibuat text not null)',
        );
        setInfo(await infoDb());
        setPersisten((await navigator.storage?.persisted?.()) ?? null);
        await muatUlang();
        setPesan('Siap.');
      } catch (err) {
        setPesan(`Gagal: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();
  }, [muatUlang]);

  async function tambah() {
    await query('insert into uji_catatan (isi, dibuat) values (?, ?)', [
      `Catatan uji #${jumlah + 1}`,
      new Date().toISOString(),
    ]);
    await muatUlang();
  }

  async function mintaPersisten() {
    setPersisten((await navigator.storage?.persist?.()) ?? null);
  }

  async function unduhExport() {
    const bytes = await exportDb();
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/x-sqlite3' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kasir-uji.sqlite3';
    a.click();
    URL.revokeObjectURL(url);
    setPesan(`Export ${bytes.byteLength} byte.`);
  }

  return (
    <main className={styles.halaman}>
      <section className={styles.kartu}>
        <h1 className={styles.judul}>Uji SQLite-WASM</h1>
        <p className={styles.pesan} data-testid="pesan">
          {pesan}
        </p>
        <dl className={styles.info}>
          <dt>Versi SQLite</dt>
          <dd className={styles.mono}>{info?.versiSqlite ?? '–'}</dd>
          <dt>VFS</dt>
          <dd className={styles.mono}>{info?.vfs ?? '–'}</dd>
          <dt>Penyimpanan permanen</dt>
          <dd>{persisten === null ? 'tidak diketahui' : persisten ? 'ya' : 'belum'}</dd>
          <dt>Jumlah catatan</dt>
          <dd className={styles.mono} data-testid="jumlah">
            {jumlah}
          </dd>
        </dl>
        <div className={styles.tombolGrup}>
          <button className={styles.tombol} onClick={tambah}>
            Tambah catatan
          </button>
          <button className={styles.tombolSekunder} onClick={mintaPersisten}>
            Minta penyimpanan permanen
          </button>
          <button className={styles.tombolSekunder} onClick={unduhExport}>
            Export file DB
          </button>
        </div>
        <ul className={styles.daftar}>
          {terakhir.map((c) => (
            <li key={c.id}>
              {c.isi} <span className={styles.mono}>{c.dibuat}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
