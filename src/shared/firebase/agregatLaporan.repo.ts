import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import type { AgregatLaporanHarian } from '../types/agregatLaporan';
import { COLLECTIONS } from './collections';
import { db } from './config';

const agregatLaporanCollection = collection(db, COLLECTIONS.agregatLaporan);

// Id dokumen agregat sudah 'YYYY-MM-DD' — urut leksikografis sama dengan
// urut kalender, jadi range query lewat documentId() otomatis terindeks
// tanpa butuh index komposit tambahan. Hari tanpa transaksi tidak pernah
// punya dokumen, jadi hasilnya bisa "bolong tanggal" — pemanggil (logic/)
// harus benar terhadap itu, bukan berasumsi array berurutan tanpa celah.
export async function ambilAgregatRentang(
  idMulai: string,
  idAkhir: string,
): Promise<AgregatLaporanHarian[]> {
  const q = query(
    agregatLaporanCollection,
    where(documentId(), '>=', idMulai),
    where(documentId(), '<=', idAkhir),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AgregatLaporanHarian);
}
