import { useState, type FormEvent } from 'react';
import type { Produk, ProdukInput, SatuanProduk } from '../../../shared/types/produk';
import { validasiProduk } from '../logic/validasiProduk';
import styles from './FormProduk.module.css';

interface Props {
  awal?: Produk;
  daftarKategori: string[];
  onSimpan: (input: ProdukInput) => Promise<void>;
  onBatal: () => void;
}

const SATUAN_OPTIONS: SatuanProduk[] = ['pcs', 'set', 'liter', 'dus'];

function hanyaAngka(nilai: string): string {
  return nilai.replace(/\D/g, '');
}

export function FormProduk({ awal, daftarKategori, onSimpan, onBatal }: Props) {
  const [nama, setNama] = useState(awal?.nama ?? '');
  const [kodePart, setKodePart] = useState(awal?.kodePart ?? '');
  const [kategori, setKategori] = useState(awal?.kategori ?? '');
  const [hargaBeli, setHargaBeli] = useState(String(awal?.hargaBeli ?? ''));
  const [hargaJual, setHargaJual] = useState(String(awal?.hargaJual ?? ''));
  const [stok, setStok] = useState(String(awal?.stok ?? ''));
  const [satuan, setSatuan] = useState<SatuanProduk>(awal?.satuan ?? 'pcs');
  const [kompatibilitas, setKompatibilitas] = useState(awal?.kompatibilitas ?? '');
  const [error, setError] = useState<Partial<Record<keyof ProdukInput, string>>>({});
  const [gagalSimpan, setGagalSimpan] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const input: ProdukInput = {
      nama: nama.trim(),
      kodePart: kodePart.trim() || undefined,
      kategori: kategori.trim(),
      hargaBeli: Number(hargaBeli || 0),
      hargaJual: Number(hargaJual || 0),
      stok: Number(stok || 0),
      satuan,
      kompatibilitas: kompatibilitas.trim() || undefined,
      ambangStokRendah: awal?.ambangStokRendah,
    };

    const hasil = validasiProduk(input);
    if (!hasil.valid) {
      setError(hasil.error);
      setGagalSimpan('');
      return;
    }

    setError({});
    setGagalSimpan('');
    setMenyimpan(true);
    try {
      await onSimpan(input);
    } catch {
      setGagalSimpan('Gagal menyimpan produk. Coba lagi.');
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <div className={styles.formGrid}>
        <div className={`${styles.formField} ${styles.span2}`}>
          <label htmlFor="nama">Nama Produk</label>
          <input
            id="nama"
            className={styles.formInput}
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
          {error.nama && <p className={styles.formError}>{error.nama}</p>}
        </div>

        <div className={styles.formField}>
          <label htmlFor="kodePart">
            Kode Part <span className={styles.opt}>(opsional)</span>
          </label>
          <input
            id="kodePart"
            className={styles.formInput}
            value={kodePart}
            onChange={(e) => setKodePart(e.target.value)}
          />
        </div>
        <div className={styles.formField}>
          <label htmlFor="kategori">Kategori</label>
          <input
            id="kategori"
            className={styles.formInput}
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
            list="daftar-kategori"
            placeholder="mis. Oli, Kampas Rem"
          />
          <datalist id="daftar-kategori">
            {daftarKategori.map((k) => (
              <option key={k} value={k} />
            ))}
          </datalist>
          {error.kategori && <p className={styles.formError}>{error.kategori}</p>}
        </div>

        <div className={styles.formField}>
          <label htmlFor="hargaBeli">Harga Beli</label>
          <div className={styles.inputRp}>
            <span className={styles.prefix}>Rp</span>
            <input
              id="hargaBeli"
              className={styles.formInput}
              inputMode="numeric"
              value={hargaBeli}
              onChange={(e) => setHargaBeli(hanyaAngka(e.target.value))}
            />
          </div>
          {error.hargaBeli && <p className={styles.formError}>{error.hargaBeli}</p>}
        </div>
        <div className={styles.formField}>
          <label htmlFor="hargaJual">Harga Jual</label>
          <div className={styles.inputRp}>
            <span className={styles.prefix}>Rp</span>
            <input
              id="hargaJual"
              className={styles.formInput}
              inputMode="numeric"
              value={hargaJual}
              onChange={(e) => setHargaJual(hanyaAngka(e.target.value))}
            />
          </div>
          {error.hargaJual && <p className={styles.formError}>{error.hargaJual}</p>}
        </div>

        <div className={styles.formField}>
          <label htmlFor="stok">{awal ? 'Stok' : 'Stok Awal'}</label>
          <input
            id="stok"
            className={styles.formInput}
            inputMode="numeric"
            value={stok}
            onChange={(e) => setStok(hanyaAngka(e.target.value))}
          />
          {error.stok && <p className={styles.formError}>{error.stok}</p>}
        </div>
        <div className={styles.formField}>
          <label htmlFor="satuan">Satuan</label>
          <select
            id="satuan"
            className={styles.formInput}
            value={satuan}
            onChange={(e) => setSatuan(e.target.value as SatuanProduk)}
          >
            {SATUAN_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.formField} ${styles.span2}`}>
          <label htmlFor="kompatibilitas">
            Kompatibilitas Kendaraan <span className={styles.opt}>(opsional)</span>
          </label>
          <input
            id="kompatibilitas"
            className={styles.formInput}
            value={kompatibilitas}
            onChange={(e) => setKompatibilitas(e.target.value)}
          />
          <p className={styles.formHint}>Bantu pencarian nanti — pisahkan dengan koma.</p>
        </div>
      </div>

      {gagalSimpan && <p className={styles.formError}>{gagalSimpan}</p>}

      <div className={styles.actions}>
        <button type="submit" className={styles.btnAccent} disabled={menyimpan}>
          {menyimpan ? 'Menyimpan…' : 'Simpan Produk'}
        </button>
        <button type="button" className={styles.btnText} onClick={onBatal}>
          Batal
        </button>
      </div>
    </form>
  );
}
