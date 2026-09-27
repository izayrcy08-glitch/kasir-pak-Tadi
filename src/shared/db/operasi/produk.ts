// Operasi katalog produk di SQLite (dijalankan di sqlite.worker.ts).
import type { Database } from '@sqlite.org/sqlite-wasm';
import type { Produk, ProdukInput, SatuanProduk } from '../../types/produk';
import { type Ketergantungan, ketergantunganBawaan } from './ketergantungan';

interface BarisProduk {
  id: string;
  kode_part: string | null;
  nama: string;
  kategori: string;
  harga_beli: number;
  harga_jual: number;
  stok: number;
  satuan: SatuanProduk;
  kompatibilitas: string | null;
  ambang_stok_rendah: number | null;
  dibuat_pada: number;
  diperbarui_pada: number;
}

function keProduk(b: BarisProduk): Produk {
  return {
    id: b.id,
    kodePart: b.kode_part ?? undefined,
    nama: b.nama,
    kategori: b.kategori,
    hargaBeli: b.harga_beli,
    hargaJual: b.harga_jual,
    stok: b.stok,
    satuan: b.satuan,
    kompatibilitas: b.kompatibilitas ?? undefined,
    ambangStokRendah: b.ambang_stok_rendah ?? undefined,
    dibuatPada: b.dibuat_pada,
    diperbaruiPada: b.diperbarui_pada,
  };
}

// String kosong dari form disimpan sebagai NULL, bukan '' — supaya "tidak
// diisi" konsisten satu bentuk saja.
function kosongJadiNull(s: string | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

function nilaiKolom(input: ProdukInput) {
  return [
    kosongJadiNull(input.kodePart),
    input.nama.trim(),
    input.kategori.trim(),
    input.hargaBeli,
    input.hargaJual,
    input.stok,
    input.satuan,
    kosongJadiNull(input.kompatibilitas),
    input.ambangStokRendah ?? null,
  ];
}

export function daftarProduk(db: Database): Produk[] {
  const baris = db.selectObjects('SELECT * FROM produk ORDER BY nama COLLATE NOCASE, id') as unknown as BarisProduk[];
  return baris.map(keProduk);
}

export function tambahProduk(db: Database, input: ProdukInput, dep: Ketergantungan = ketergantunganBawaan): string {
  const id = dep.buatId();
  const ms = dep.sekarang().getTime();
  db.exec({
    sql: `INSERT INTO produk (id, kode_part, nama, kategori, harga_beli, harga_jual, stok, satuan,
            kompatibilitas, ambang_stok_rendah, dibuat_pada, diperbarui_pada)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    bind: [id, ...nilaiKolom(input), ms, ms],
  });
  return id;
}

export function updateProduk(
  db: Database,
  id: string,
  input: ProdukInput,
  dep: Ketergantungan = ketergantunganBawaan,
): void {
  db.exec({
    sql: `UPDATE produk SET kode_part = ?, nama = ?, kategori = ?, harga_beli = ?, harga_jual = ?, stok = ?,
            satuan = ?, kompatibilitas = ?, ambang_stok_rendah = ?, diperbarui_pada = ?
          WHERE id = ?`,
    bind: [...nilaiKolom(input), dep.sekarang().getTime(), id],
  });
  if (db.changes() === 0) throw new Error('Produk tidak ditemukan (mungkin sudah dihapus).');
}

// Riwayat penjualan produk ini tetap utuh — item_transaksi menyimpan snapshot
// nama & harga, tidak bergantung pada baris produk (lihat skema v1).
export function hapusProduk(db: Database, id: string): void {
  db.exec({ sql: 'DELETE FROM produk WHERE id = ?', bind: [id] });
}
