// Operasi transaksi di SQLite. Fungsi-fungsi ini dijalankan DI DALAM
// sqlite.worker.ts (akses DB sinkron) — UI memanggilnya lewat
// `panggil('simpanTransaksi', ...)` di klienDb.ts.
import type { Database } from '@sqlite.org/sqlite-wasm';
import { hitungKembalian } from '../../../features/transaksi/logic/hitungKembalian';
import { hitungTotal } from '../../../features/transaksi/logic/hitungTotal';
import { idHariIni } from '../../lib/idHariIni';
import type { ItemTransaksi, MetodeBayar, Transaksi, TransaksiDraft } from '../../types/transaksi';
import { type DetailStokKurang, PembayaranKurangError, StokTidakCukupError } from '../galat';
import { type Ketergantungan, ketergantunganBawaan } from './ketergantungan';

// Gabungkan qty per produkId — pertahanan kalau draft berisi produkId ganda.
// Seharusnya tidak terjadi karena useKeranjang selalu menggabungkan qty,
// tapi fungsi ini batas otoritatif ke DB jadi tidak boleh mengasumsikan itu.
function gabungkanQty(item: TransaksiDraft['item']): TransaksiDraft['item'] {
  const peta = new Map<string, number>();
  for (const it of item) {
    peta.set(it.produkId, (peta.get(it.produkId) ?? 0) + it.qty);
  }
  return Array.from(peta, ([produkId, qty]) => ({ produkId, qty }));
}

interface BarisProdukUntukJual {
  id: string;
  nama: string;
  kode_part: string | null;
  harga_jual: number;
  stok: number;
}

// Satu operasi atomik (BEGIN IMMEDIATE … COMMIT): baca stok terkini -> tolak
// seluruhnya kalau ada yang kurang -> tulis transaksi + item + kurangi stok.
// Error apa pun di tengah jalan = ROLLBACK, tidak ada yang setengah tersimpan.
// Nama & harga diambil ulang dari tabel produk (bukan dari UI) supaya tidak
// bisa dimanipulasi dari cache keranjang.
export function simpanTransaksi(
  db: Database,
  draft: TransaksiDraft,
  dep: Ketergantungan = ketergantunganBawaan,
): string {
  const itemGabungan = gabungkanQty(draft.item);
  if (itemGabungan.length === 0) throw new Error('Keranjang kosong.');

  return db.transaction('IMMEDIATE', () => {
    const item: ItemTransaksi[] = [];
    const kurang: DetailStokKurang[] = [];

    for (const { produkId, qty } of itemGabungan) {
      const p = db.selectObject(
        'SELECT id, nama, kode_part, harga_jual, stok FROM produk WHERE id = ?',
        [produkId],
      ) as BarisProdukUntukJual | undefined;
      if (!p) {
        kurang.push({ produkId, nama: '(produk tidak ditemukan)', diminta: qty, tersedia: 0 });
        continue;
      }
      if (p.stok < qty) {
        kurang.push({ produkId, nama: p.nama, diminta: qty, tersedia: p.stok });
        continue;
      }
      item.push({
        produkId,
        nama: p.nama,
        kodePart: p.kode_part ?? undefined,
        hargaSatuan: p.harga_jual,
        qty,
        subtotalItem: p.harga_jual * qty,
      });
    }

    if (kurang.length > 0) throw new StokTidakCukupError(kurang);

    const { subtotal, totalDiskon, total } = hitungTotal(item, draft.diskon);
    const tunai = draft.metodeBayar === 'tunai';
    const dibayar = tunai ? (draft.dibayar ?? null) : null;
    const kembalian = dibayar === null ? null : hitungKembalian(total, dibayar);
    if (kembalian !== null && kembalian < 0) throw new PembayaranKurangError(total, dibayar!);

    const id = dep.buatId();
    const sekarang = dep.sekarang();
    const ms = sekarang.getTime();

    db.exec({
      sql: `INSERT INTO transaksi (id, subtotal, diskon_tipe, diskon_nilai, total_diskon, total,
              metode_bayar, dibayar, kembalian, dibuat_pada, tanggal_lokal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      bind: [
        id,
        subtotal,
        draft.diskon?.tipe ?? null,
        draft.diskon?.nilai ?? null,
        totalDiskon,
        total,
        draft.metodeBayar,
        dibayar,
        kembalian,
        ms,
        idHariIni(sekarang),
      ],
    });

    item.forEach((it, urutan) => {
      db.exec({
        sql: `INSERT INTO item_transaksi (transaksi_id, urutan, produk_id, nama, kode_part,
                harga_satuan, qty, subtotal_item)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        bind: [id, urutan, it.produkId, it.nama, it.kodePart ?? null, it.hargaSatuan, it.qty, it.subtotalItem],
      });
      // CHECK (stok >= 0) di skema jadi pengaman terakhir kalau validasi di
      // atas terlewati — UPDATE ini akan gagal dan seluruh transaksi di-rollback.
      db.exec({
        sql: 'UPDATE produk SET stok = stok - ?, diperbarui_pada = ? WHERE id = ?',
        bind: [it.qty, ms, it.produkId],
      });
    });

    return id;
  });
}

// ---------------------------------------------------------------------------
// Riwayat

// Kursor keyset: (dibuat_pada, id) baris terakhir halaman sebelumnya. id ikut
// dipakai supaya dua transaksi di milidetik yang sama tidak terlewat/dobel.
export interface KursorRiwayat {
  dibuatPada: number;
  id: string;
}

export interface RiwayatTransaksiHalaman {
  daftar: Transaksi[];
  kursorBerikutnya: KursorRiwayat | null;
}

interface BarisTransaksi {
  id: string;
  subtotal: number;
  diskon_tipe: 'nominal' | 'persen' | null;
  diskon_nilai: number | null;
  total_diskon: number;
  total: number;
  metode_bayar: MetodeBayar;
  dibayar: number | null;
  kembalian: number | null;
  dibuat_pada: number;
}

interface BarisItem {
  transaksi_id: string;
  produk_id: string;
  nama: string;
  kode_part: string | null;
  harga_satuan: number;
  qty: number;
  subtotal_item: number;
}

const BATAS_RIWAYAT_DEFAULT = 50;

export function ambilRiwayatTransaksi(
  db: Database,
  rentang: { mulai: Date; akhir: Date },
  opsi?: { batas?: number; kursorSetelah?: KursorRiwayat | null },
): RiwayatTransaksiHalaman {
  const batas = opsi?.batas ?? BATAS_RIWAYAT_DEFAULT;
  const k = opsi?.kursorSetelah ?? null;

  const baris = db.selectObjects(
    `SELECT id, subtotal, diskon_tipe, diskon_nilai, total_diskon, total, metode_bayar,
            dibayar, kembalian, dibuat_pada
     FROM transaksi
     WHERE dibuat_pada BETWEEN ? AND ?
       AND (? IS NULL OR (dibuat_pada, id) < (?, ?))
     ORDER BY dibuat_pada DESC, id DESC
     LIMIT ?`,
    [rentang.mulai.getTime(), rentang.akhir.getTime(), k?.id ?? null, k?.dibuatPada ?? null, k?.id ?? null, batas],
  ) as unknown as BarisTransaksi[];

  const semuaItem =
    baris.length === 0
      ? []
      : (db.selectObjects(
          `SELECT transaksi_id, produk_id, nama, kode_part, harga_satuan, qty, subtotal_item
           FROM item_transaksi
           WHERE transaksi_id IN (${baris.map(() => '?').join(', ')})
           ORDER BY transaksi_id, urutan`,
          baris.map((b) => b.id),
        ) as unknown as BarisItem[]);
  const daftar = susunTransaksi(baris, semuaItem);

  const terakhir = baris.at(-1);
  const kursorBerikutnya =
    baris.length === batas && terakhir ? { dibuatPada: terakhir.dibuat_pada, id: terakhir.id } : null;

  return { daftar, kursorBerikutnya };
}

// Semua transaksi dalam rentang, urut dari yang terlama — untuk ekspor CSV
// laporan. Tanpa batas halaman; item diambil lewat subquery rentang (bukan
// daftar id di `IN (?, ?, ...)`) supaya tidak mentok batas jumlah parameter
// SQLite saat rentangnya berisi ribuan transaksi.
export function ambilTransaksiRentang(db: Database, rentang: { mulai: Date; akhir: Date }): Transaksi[] {
  const bind = [rentang.mulai.getTime(), rentang.akhir.getTime()];
  const baris = db.selectObjects(
    `SELECT id, subtotal, diskon_tipe, diskon_nilai, total_diskon, total, metode_bayar,
            dibayar, kembalian, dibuat_pada
     FROM transaksi
     WHERE dibuat_pada BETWEEN ? AND ?
     ORDER BY dibuat_pada, id`,
    bind,
  ) as unknown as BarisTransaksi[];
  const semuaItem = db.selectObjects(
    `SELECT transaksi_id, produk_id, nama, kode_part, harga_satuan, qty, subtotal_item
     FROM item_transaksi
     WHERE transaksi_id IN (SELECT id FROM transaksi WHERE dibuat_pada BETWEEN ? AND ?)
     ORDER BY transaksi_id, urutan`,
    bind,
  ) as unknown as BarisItem[];
  return susunTransaksi(baris, semuaItem);
}

function susunTransaksi(baris: BarisTransaksi[], semuaItem: BarisItem[]): Transaksi[] {
  const itemPerTransaksi = new Map<string, ItemTransaksi[]>();
  for (const it of semuaItem) {
    const daftar = itemPerTransaksi.get(it.transaksi_id) ?? [];
    daftar.push({
      produkId: it.produk_id,
      nama: it.nama,
      kodePart: it.kode_part ?? undefined,
      hargaSatuan: it.harga_satuan,
      qty: it.qty,
      subtotalItem: it.subtotal_item,
    });
    itemPerTransaksi.set(it.transaksi_id, daftar);
  }

  return baris.map((b) => ({
    id: b.id,
    item: itemPerTransaksi.get(b.id) ?? [],
    subtotal: b.subtotal,
    diskon: b.diskon_tipe === null ? null : { tipe: b.diskon_tipe, nilai: b.diskon_nilai! },
    totalDiskon: b.total_diskon,
    total: b.total,
    metodeBayar: b.metode_bayar,
    dibayar: b.dibayar ?? undefined,
    kembalian: b.kembalian ?? undefined,
    dibuatPada: b.dibuat_pada,
  }));
}
