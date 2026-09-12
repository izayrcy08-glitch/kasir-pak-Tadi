import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { PengaturanToko, PengaturanTokoInput } from '../../../../shared/types/pengaturanToko';
import { kompresLogoWebp } from '../logic/kompresLogoWebp';
import styles from './FormIdentitasToko.module.css';

interface Props {
  awal: PengaturanToko | null;
  onSimpan: (input: PengaturanTokoInput) => Promise<void>;
}

export function FormIdentitasToko({ awal, onSimpan }: Props) {
  const [namaToko, setNamaToko] = useState(awal?.namaToko ?? '');
  const [logoWebp, setLogoWebp] = useState(awal?.logoWebp);
  const [errorNama, setErrorNama] = useState('');
  const [gagalLogo, setGagalLogo] = useState('');
  const [gagalSimpan, setGagalSimpan] = useState('');
  const [mengompres, setMengompres] = useState(false);
  const [menyimpan, setMenyimpan] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null);

  async function handlePilihLogo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setGagalLogo('');
    setMengompres(true);
    try {
      const dataUri = await kompresLogoWebp(file);
      setLogoWebp(dataUri);
    } catch {
      setGagalLogo('Gagal memproses gambar. Coba file lain (PNG/JPG).');
    } finally {
      setMengompres(false);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const namaTrim = namaToko.trim();
    if (!namaTrim) {
      setErrorNama('Nama toko wajib diisi.');
      return;
    }

    setErrorNama('');
    setGagalSimpan('');
    setMenyimpan(true);
    try {
      await onSimpan({ namaToko: namaTrim, logoWebp });
    } catch {
      setGagalSimpan('Gagal menyimpan pengaturan. Periksa koneksi, lalu coba lagi.');
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <div className={styles.logoField}>
        <div className={styles.logoUpload}>
          {logoWebp ? <img src={logoWebp} alt="Logo toko" /> : (namaToko.trim()[0]?.toUpperCase() ?? 'T')}
        </div>
        <div className={styles.logoMeta}>
          <p>
            PNG/JPG, disimpan sebagai WebP.
            <br />
            Disarankan persegi, min. 256&times;256px.
          </p>
          <button
            type="button"
            className={styles.btnOutline}
            onClick={() => inputFileRef.current?.click()}
            disabled={mengompres}
          >
            {mengompres ? 'Memproses…' : 'Ganti Logo'}
          </button>
          <input
            ref={inputFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={styles.hiddenInput}
            onChange={handlePilihLogo}
          />
          {gagalLogo && <p className={styles.formError}>{gagalLogo}</p>}
        </div>
      </div>

      <div className={styles.formField}>
        <label htmlFor="namaToko">Nama Toko</label>
        <input
          id="namaToko"
          className={styles.formInput}
          value={namaToko}
          onChange={(e) => setNamaToko(e.target.value)}
        />
        {errorNama && <p className={styles.formError}>{errorNama}</p>}
      </div>

      {gagalSimpan && <p className={styles.formError}>{gagalSimpan}</p>}

      <div className={styles.actions}>
        <button type="submit" className={styles.btnAccent} disabled={menyimpan || mengompres}>
          {menyimpan ? 'Menyimpan…' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}
