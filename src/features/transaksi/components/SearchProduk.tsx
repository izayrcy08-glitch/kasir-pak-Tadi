import type { KeyboardEvent, Ref } from 'react';
import styles from './SearchProduk.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: Ref<HTMLInputElement>;
  /** id elemen daftar hasil (aria-controls). */
  idHasil?: string;
}

export function SearchProduk({ value, onChange, onKeyDown, inputRef, idHasil }: Props) {
  return (
    <div className={styles.search}>
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.2" y2="16.2" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder="Cari nama, kode part, atau motor…"
        aria-label="Cari barang"
        aria-controls={idHasil}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {value && (
        <button type="button" className={styles.hapus} aria-label="Hapus pencarian" onClick={() => onChange('')}>
          <svg viewBox="0 0 24 24">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
