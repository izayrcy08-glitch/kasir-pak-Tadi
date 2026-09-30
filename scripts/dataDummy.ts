// Pembuat file backup berisi DATA DUMMY (contoh toko yang sudah berjalan
// ±2 tahun) untuk melihat tampilan & performa aplikasi dengan data banyak.
// Dipakai lewat `node scripts/buat-data-dummy.mjs`; hasilnya dimuat ke
// aplikasi lewat Pengaturan → Backup & Pulihkan Data. TIDAK pernah ikut ke
// dalam build aplikasi.
//
// Semua transaksi dibuat lewat simpanTransaksi() yang sama dengan aplikasi
// (atomik, harga diambil dari tabel produk), jadi datanya konsisten dengan
// aturan bisnis sungguhan — bukan INSERT mentah.
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { jalankanMigrasi } from '../src/shared/db/migrasi';
import { catatBackup } from '../src/shared/db/operasi/backup';
import { simpanPengaturanToko } from '../src/shared/db/operasi/pengaturanToko';
import { tambahProduk, updateProduk } from '../src/shared/db/operasi/produk';
import { simpanTransaksi } from '../src/shared/db/operasi/transaksi';
import type { ProdukInput, SatuanProduk } from '../src/shared/types/produk';
import type { Diskon, MetodeBayar } from '../src/shared/types/transaksi';

// PRNG deterministik (mulberry32) — hasil sama tiap dijalankan.
function buatAcak(benih: number) {
  let a = benih;
  const acak = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const bulat = (min: number, maks: number) => min + Math.floor(acak() * (maks - min + 1));
  return { acak, bulat };
}

type BarisKatalog = [kode: string, nama: string, hargaBeli: number, hargaJual: number, satuan: SatuanProduk, kompatibilitas?: string];

const KATALOG: Record<string, BarisKatalog[]> = {
  'Oli & Pelumas': [
    ['OL-MPX1', 'Oli AHM MPX1 10W-30 0,8L', 42000, 52000, 'pcs', 'Honda bebek'],
    ['OL-SPX2', 'Oli AHM SPX2 10W-30 0,8L', 48000, 58000, 'pcs', 'Honda matic'],
    ['OL-YML', 'Yamalube Power Matic 0,8L', 45000, 55000, 'pcs', 'Yamaha matic'],
    ['OL-GRD', 'Oli Gardan Matic 120ml', 14000, 20000, 'pcs', 'Semua matic'],
    ['OL-SHL5', 'Shell Helix HX5 1L', 72000, 85000, 'liter', 'Mobil bensin'],
  ],
  Busi: [
    ['BS-C7HSA', 'Busi NGK C7HSA', 15000, 22000, 'pcs', 'Supra, Revo, Jupiter'],
    ['BS-CPR9', 'Busi NGK CPR9EA-9', 18000, 26000, 'pcs', 'Vario, Beat, Scoopy'],
    ['BS-U20', 'Busi Denso U20EPR9', 16000, 24000, 'pcs', 'Mio, Fino'],
    ['BS-IRD', 'Busi NGK Iridium CPR8EAIX', 85000, 110000, 'pcs', 'Matic 125-150cc'],
    ['BS-BKR6', 'Busi NGK BKR6E (mobil)', 22000, 32000, 'pcs', 'Avanza, Xenia'],
  ],
  'Kampas Rem': [
    ['KR-BEAT-D', 'Kampas Rem Depan Beat', 28000, 40000, 'set', 'Beat, Vario 110'],
    ['KR-BEAT-B', 'Kampas Rem Belakang Beat', 25000, 35000, 'set', 'Beat, Scoopy'],
    ['KR-NMAX-D', 'Kampas Rem Depan NMAX', 45000, 62000, 'set', 'NMAX, Aerox'],
    ['KR-SUPRA', 'Kampas Rem Tromol Supra', 22000, 32000, 'set', 'Supra, Revo'],
    ['KR-AVZ', 'Kampas Rem Depan Avanza', 165000, 210000, 'set', 'Avanza, Xenia'],
  ],
  Filter: [
    ['FL-UD-VAR', 'Filter Udara Vario 125', 38000, 52000, 'pcs', 'Vario 125/150'],
    ['FL-UD-BEAT', 'Filter Udara Beat FI', 32000, 45000, 'pcs', 'Beat FI, Scoopy FI'],
    ['FL-OL-NMAX', 'Filter Oli NMAX', 18000, 27000, 'pcs', 'NMAX, Aerox, Lexi'],
    ['FL-OL-AVZ', 'Filter Oli Avanza', 28000, 40000, 'pcs', 'Avanza, Xenia, Rush'],
    ['FL-BB', 'Filter Bensin Universal', 9000, 15000, 'pcs', 'Karburator'],
  ],
  Aki: [
    ['AK-GTZ5S', 'Aki GS GTZ5S Kering', 195000, 240000, 'pcs', 'Beat, Vario, Mio'],
    ['AK-YTZ6V', 'Aki Yuasa YTZ6V', 260000, 315000, 'pcs', 'PCX, NMAX'],
    ['AK-GM5Z', 'Aki GS GM5Z-3B Basah', 150000, 185000, 'pcs', 'Supra, Jupiter'],
    ['AK-NS40', 'Aki GS Astra NS40ZL', 720000, 850000, 'pcs', 'Mobil kecil'],
    ['AK-AIR', 'Air Aki Zuur 1L', 7000, 12000, 'pcs'],
  ],
  Lampu: [
    ['LP-DPN-LED', 'Lampu Depan LED H6', 45000, 65000, 'pcs', 'Beat, Vario, Mio'],
    ['LP-STOP', 'Bohlam Lampu Stop 12V', 5000, 9000, 'pcs'],
    ['LP-SEN', 'Bohlam Sein 12V 10W', 3500, 7000, 'pcs'],
    ['LP-H4', 'Bohlam Philips H4 12V', 38000, 55000, 'pcs', 'Mobil'],
    ['LP-SEIN-SET', 'Lampu Sein Set Beat', 55000, 78000, 'set', 'Beat FI'],
  ],
  Kabel: [
    ['KB-GAS-BEAT', 'Kabel Gas Beat', 22000, 32000, 'pcs', 'Beat, Scoopy'],
    ['KB-GAS-SUP', 'Kabel Gas Supra', 20000, 30000, 'pcs', 'Supra, Revo'],
    ['KB-KOP', 'Kabel Kopling Tiger', 35000, 48000, 'pcs', 'Tiger, Megapro'],
    ['KB-SPD', 'Kabel Speedometer Vario', 30000, 42000, 'pcs', 'Vario 110/125'],
    ['KB-RMB', 'Kabel Rem Belakang Mio', 25000, 35000, 'pcs', 'Mio, Fino'],
  ],
  'Ban & Ban Dalam': [
    ['BN-8090-14', 'Ban IRC 80/90-14 Tubeless', 165000, 205000, 'pcs', 'Ring 14 belakang'],
    ['BN-7090-14', 'Ban IRC 70/90-14 Tubeless', 145000, 180000, 'pcs', 'Ring 14 depan'],
    ['BN-FDR-17', 'Ban FDR 70/90-17', 175000, 215000, 'pcs', 'Ring 17'],
    ['BD-17', 'Ban Dalam Swallow 17', 28000, 40000, 'pcs', 'Ring 17'],
    ['BD-14', 'Ban Dalam Swallow 14', 26000, 38000, 'pcs', 'Ring 14'],
  ],
  'Rantai & Gir': [
    ['RT-428', 'Rantai SSS 428H-120L', 85000, 115000, 'pcs', 'Bebek 110-125cc'],
    ['GS-SUP', 'Gir Set Supra X 125', 160000, 210000, 'set', 'Supra X 125'],
    ['GS-JUP', 'Gir Set Jupiter Z', 150000, 195000, 'set', 'Jupiter Z, Vega'],
    ['VB-BEAT', 'V-Belt Beat FI', 85000, 115000, 'pcs', 'Beat FI, Scoopy FI'],
    ['RL-BEAT', 'Roller Beat 13gr', 35000, 50000, 'set', 'Beat, Vario 110'],
  ],
  'Baut & Mur': [
    ['BT-M6', 'Baut M6 x 20 (isi 50)', 18000, 28000, 'dus'],
    ['BT-M8', 'Baut M8 x 25 (isi 50)', 25000, 38000, 'dus'],
    ['BT-PRBL', 'Baut Probolt Cakram', 8000, 15000, 'pcs'],
    ['MR-M10', 'Mur M10 (isi 50)', 20000, 30000, 'dus'],
    ['RG-SIL', 'Ring Seal Oli Mesin', 3000, 6000, 'pcs'],
  ],
};

const HARI_DATA = 730;
const TRANSAKSI_PER_HARI = 10;

export async function buatDataDummy(akhir: Date): Promise<{ bytes: Uint8Array; ringkasan: string }> {
  const sqlite3 = await sqlite3InitModule();
  const db = new sqlite3.oo1.DB(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  jalankanMigrasi(db);

  const { acak, bulat } = buatAcak(20260930);
  const hariKe = (n: number, jam = 7) => {
    const t = new Date(akhir.getFullYear(), akhir.getMonth(), akhir.getDate() - (HARI_DATA - 1) + n, jam, 0, 0);
    return t;
  };
  const dep = (waktu: Date) => ({ sekarang: () => waktu, buatId: () => crypto.randomUUID() });

  simpanPengaturanToko(db, { namaToko: 'Toko Sparepart (Data Contoh)' }, dep(hariKe(0)));

  // Katalog: 50 produk. Stok awal besar supaya simulasi tidak tertahan
  // "stok tidak cukup"; stok akhir disetel realistis di bagian akhir.
  const produk: { id: string; input: ProdukInput; bobot: number }[] = [];
  for (const [kategori, daftar] of Object.entries(KATALOG)) {
    for (const [kodePart, nama, hargaBeli, hargaJual, satuan, kompatibilitas] of daftar) {
      const input: ProdukInput = {
        kodePart,
        nama,
        kategori,
        hargaBeli,
        hargaJual,
        stok: 1_000_000,
        satuan,
        kompatibilitas,
        ambangStokRendah: satuan === 'dus' ? 2 : hargaJual > 150_000 ? 2 : 5,
      };
      const id = tambahProduk(db, input, dep(hariKe(0)));
      // Barang murah & habis pakai (oli, busi, bohlam) jauh lebih laris.
      const bobot = hargaJual < 30_000 ? 6 : hargaJual < 70_000 ? 4 : hargaJual < 250_000 ? 2 : 0.6;
      produk.push({ id, input, bobot });
    }
  }
  const totalBobot = produk.reduce((s, p) => s + p.bobot, 0);
  const pilihProduk = () => {
    let r = acak() * totalBobot;
    for (const p of produk) {
      r -= p.bobot;
      if (r <= 0) return p;
    }
    return produk[produk.length - 1]!;
  };

  let jumlahTransaksi = 0;
  let naikHarga = false;
  for (let n = 0; n < HARI_DATA; n++) {
    // Kenaikan harga ±8% di pertengahan periode — histori transaksi lama
    // tetap memakai harga lama (snapshot di item_transaksi).
    if (!naikHarga && n >= HARI_DATA / 2) {
      naikHarga = true;
      for (const p of produk) {
        const naik = (h: number) => Math.round((h * 1.08) / 500) * 500;
        p.input = { ...p.input, hargaBeli: naik(p.input.hargaBeli), hargaJual: naik(p.input.hargaJual) };
        updateProduk(db, p.id, p.input, dep(hariKe(n, 7)));
      }
    }

    const hari = hariKe(n);
    // Minggu lebih sepi; rata-rata tetap ±10 transaksi/hari.
    const jumlahHariIni =
      hari.getDay() === 0 ? bulat(3, 7) : bulat(TRANSAKSI_PER_HARI - 3, TRANSAKSI_PER_HARI + 3);
    const menit = Array.from({ length: jumlahHariIni }, () => bulat(8 * 60, 17 * 60 + 30)).sort((a, b) => a - b);

    for (const m of menit) {
      const waktu = new Date(hari.getFullYear(), hari.getMonth(), hari.getDate(), Math.floor(m / 60), m % 60, bulat(0, 59));
      const jumlahJenis = acak() < 0.6 ? 1 : acak() < 0.75 ? 2 : 3;
      const item = new Map<string, number>();
      while (item.size < jumlahJenis) {
        const p = pilihProduk();
        item.set(p.id, p.input.satuan === 'pcs' && p.input.hargaJual < 30_000 ? bulat(1, 4) : 1);
      }
      const subtotal = [...item].reduce((s, [id, qty]) => s + produk.find((p) => p.id === id)!.input.hargaJual * qty, 0);

      let diskon: Diskon = null;
      const r = acak();
      if (r < 0.08 && subtotal >= 50_000) diskon = { tipe: 'nominal', nilai: bulat(1, 5) * 1000 };
      else if (r < 0.12 && subtotal >= 100_000) diskon = { tipe: 'persen', nilai: 5 };
      const total = diskon === null ? subtotal : diskon.tipe === 'nominal' ? subtotal - diskon.nilai : subtotal - Math.round((subtotal * diskon.nilai) / 100);

      const metodeBayar: MetodeBayar = acak() < 0.7 ? 'tunai' : 'qris_transfer';
      // Uang tunai dibulatkan ke pecahan yang wajar (5rb/10rb/50rb/100rb).
      const pecahan = [5000, 10_000, 50_000, 100_000][bulat(0, 3)]!;
      const dibayar = metodeBayar === 'tunai' ? Math.ceil((total + 1) / pecahan) * pecahan : undefined;

      simpanTransaksi(
        db,
        { item: [...item].map(([produkId, qty]) => ({ produkId, qty })), diskon, metodeBayar, dibayar },
        dep(waktu),
      );
      jumlahTransaksi++;
    }
  }

  // Stok akhir realistis: sebagian besar aman, beberapa menipis/habis supaya
  // penanda "stok rendah" ikut terlihat.
  for (const p of produk) {
    const r = acak();
    const stok = r < 0.08 ? 0 : r < 0.2 ? bulat(1, p.input.ambangStokRendah ?? 3) : bulat(8, 60);
    db.exec({ sql: 'UPDATE produk SET stok = ? WHERE id = ?', bind: [stok, p.id] });
  }

  // Anggap backup terakhir kemarin, supaya pengingat backup tidak mengganggu.
  catatBackup(db, dep(hariKe(HARI_DATA - 2, 18)));

  db.exec('VACUUM');
  const bytes = sqlite3.capi.sqlite3_js_db_export(db);
  const omzet = db.selectValue('SELECT SUM(total) FROM transaksi') as number;
  db.close();
  return {
    bytes,
    ringkasan: `${produk.length} produk, ${Object.keys(KATALOG).length} kategori, ${jumlahTransaksi} transaksi, omzet total Rp ${omzet.toLocaleString('id-ID')}`,
  };
}
