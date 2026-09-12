import {
  collection,
  doc,
  type DocumentData,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  type QueryDocumentSnapshot,
  runTransaction,
  serverTimestamp,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore';
import { hitungKembalian } from '../../features/transaksi/logic/hitungKembalian';
import { hitungTotal } from '../../features/transaksi/logic/hitungTotal';
import { idHariIni } from '../lib/idHariIni';
import type { Produk } from '../types/produk';
import type { ItemTransaksi, MetodeBayar, Transaksi, TransaksiDraft } from '../types/transaksi';
import { COLLECTIONS } from './collections';
import { db } from './config';

const produkCollection = collection(db, COLLECTIONS.produk);
const transaksiCollection = collection(db, COLLECTIONS.transaksi);
const agregatLaporanCollection = collection(db, COLLECTIONS.agregatLaporan);

export interface DetailStokKurang {
  produkId: string;
  nama: string;
  diminta: number;
  tersedia: number;
}

export class StokTidakCukupError extends Error {
  readonly detail: DetailStokKurang[];

  constructor(detail: DetailStokKurang[]) {
    super('Stok tidak cukup untuk beberapa produk.');
    this.name = 'StokTidakCukupError';
    this.detail = detail;
  }
}

// Gabungkan qty per produkId — pertahanan kalau draft berisi produkId ganda.
// Seharusnya tidak terjadi karena useKeranjang selalu menggabungkan qty,
// tapi repo ini batas otoritatif ke Firestore jadi tidak boleh mengasumsikan itu.
function gabungkanQty(item: TransaksiDraft['item']): TransaksiDraft['item'] {
  const peta = new Map<string, number>();
  for (const it of item) {
    peta.set(it.produkId, (peta.get(it.produkId) ?? 0) + it.qty);
  }
  return Array.from(peta, ([produkId, qty]) => ({ produkId, qty }));
}

function buildAgregatUpdate(item: ItemTransaksi[], total: number, metodeBayar: MetodeBayar) {
  return {
    tanggal: idHariIni(),
    omzet: increment(total),
    jumlahTransaksi: increment(1),
    omzetPerMetode: { [metodeBayar]: increment(total) },
    jumlahTransaksiPerMetode: { [metodeBayar]: increment(1) },
    qtyTerjualPerProduk: Object.fromEntries(item.map((it) => [it.produkId, increment(it.qty)])),
    namaProdukPerId: Object.fromEntries(item.map((it) => [it.produkId, it.nama])),
    diperbaruiPada: serverTimestamp(),
  };
}

// Satu operasi atomik: baca stok terkini -> tolak seluruhnya kalau ada yang
// kurang -> tulis transaksi + kurangi stok + update agregat laporan. Firestore
// mewajibkan semua tx.get() selesai sebelum tx.set/update apa pun, jadi urutan
// baca-validasi-tulis di bawah ini tidak boleh diacak.
export async function simpanTransaksi(draft: TransaksiDraft): Promise<string> {
  const itemGabungan = gabungkanQty(draft.item);

  return runTransaction(db, async (tx) => {
    const produkRefs = itemGabungan.map((it) => doc(produkCollection, it.produkId));
    const produkSnaps = await Promise.all(produkRefs.map((ref) => tx.get(ref)));

    const item: ItemTransaksi[] = [];
    const kurang: DetailStokKurang[] = [];

    produkSnaps.forEach((snap, i) => {
      const diminta = itemGabungan[i].qty;
      if (!snap.exists()) {
        kurang.push({
          produkId: itemGabungan[i].produkId,
          nama: '(produk tidak ditemukan)',
          diminta,
          tersedia: 0,
        });
        return;
      }
      const p = snap.data() as Omit<Produk, 'id'>;
      if (p.stok < diminta) {
        kurang.push({ produkId: snap.id, nama: p.nama, diminta, tersedia: p.stok });
        return;
      }
      item.push({
        produkId: snap.id,
        nama: p.nama,
        kodePart: p.kodePart,
        hargaSatuan: p.hargaJual,
        qty: diminta,
        subtotalItem: p.hargaJual * diminta,
      });
    });

    if (kurang.length > 0) {
      throw new StokTidakCukupError(kurang);
    }

    const { subtotal, totalDiskon, total } = hitungTotal(item, draft.diskon);
    const kembalian =
      draft.metodeBayar === 'tunai' && draft.dibayar !== undefined
        ? hitungKembalian(total, draft.dibayar)
        : undefined;

    const transaksiRef = doc(transaksiCollection);
    // dibayar/kembalian sengaja bisa undefined untuk metode non-tunai —
    // config.ts mengaktifkan ignoreUndefinedProperties supaya field begini
    // otomatis tidak ikut ditulis, bukan menyebabkan error SDK.
    tx.set(transaksiRef, {
      item,
      subtotal,
      diskon: draft.diskon,
      totalDiskon,
      total,
      metodeBayar: draft.metodeBayar,
      dibayar: draft.metodeBayar === 'tunai' ? draft.dibayar : undefined,
      kembalian: draft.metodeBayar === 'tunai' ? kembalian : undefined,
      dibuatPada: serverTimestamp(),
    });

    produkRefs.forEach((ref, i) => {
      tx.update(ref, { stok: increment(-itemGabungan[i].qty), diperbaruiPada: serverTimestamp() });
    });

    // set(..., {merge:true}) dipakai (bukan update) karena dokumen agregat
    // hari ini mungkin belum ada — increment() di dalam objek yang di-merge
    // tetap benar menganggap field yang belum ada sebagai basis 0.
    tx.set(doc(agregatLaporanCollection, idHariIni()), buildAgregatUpdate(item, total, draft.metodeBayar), {
      merge: true,
    });

    return transaksiRef.id;
  });
}

export interface RiwayatTransaksiHalaman {
  daftar: Transaksi[];
  kursorBerikutnya: QueryDocumentSnapshot<DocumentData> | null;
}

const BATAS_RIWAYAT_DEFAULT = 50;

// Riwayat berpaginasi (limit + startAfter) karena toko yang ramai bisa
// punya ratusan transaksi sebulan — tidak realistis fetch semuanya
// sekaligus. Inequality & orderBy sama-sama di field `dibuatPada`, jadi
// tidak butuh index komposit tambahan di firestore.indexes.json.
export async function ambilRiwayatTransaksi(
  rentang: { mulai: Date; akhir: Date },
  opsi?: { batas?: number; kursorSetelah?: QueryDocumentSnapshot<DocumentData> | null },
): Promise<RiwayatTransaksiHalaman> {
  const batas = opsi?.batas ?? BATAS_RIWAYAT_DEFAULT;
  const klausa = [
    where('dibuatPada', '>=', Timestamp.fromDate(rentang.mulai)),
    where('dibuatPada', '<=', Timestamp.fromDate(rentang.akhir)),
    orderBy('dibuatPada', 'desc'),
    limit(batas),
    ...(opsi?.kursorSetelah ? [startAfter(opsi.kursorSetelah)] : []),
  ] as const;

  const snap = await getDocs(query(transaksiCollection, ...klausa));
  const daftar = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaksi);
  const kursorBerikutnya = snap.docs.length === batas ? (snap.docs.at(-1) ?? null) : null;

  return { daftar, kursorBerikutnya };
}
