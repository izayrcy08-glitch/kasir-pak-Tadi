import styles from './SearchProduk.module.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchProduk({ value, onChange }: Props) {
  return (
    <div className={styles.search}>
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.2" y2="16.2" />
      </svg>
      <input
        type="text"
        placeholder="Cari nama atau kode part…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
