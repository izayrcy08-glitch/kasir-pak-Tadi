import { panggil } from '../../../../shared/db/klienDb';
import { SEMUA_TABEL } from '../../../../shared/db/operasi/tabelDiubah';
import { useDataDb } from '../../../../shared/hooks/useDataDb';

const ambil = () => panggil('ringkasData');

// Isi data yang sedang ditampilkan di mode pemantau — dimuat ulang otomatis
// setelah file baru dimuat (pulihkanBackup memberi tahu SEMUA_TABEL).
export function useRingkasanData() {
  const { data, loading, error } = useDataDb(ambil, SEMUA_TABEL);
  return { ringkasan: data, loading, error };
}
