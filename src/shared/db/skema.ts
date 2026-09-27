// Skema database SQLite, sebagai daftar migrasi berurutan. Versi skema DB
// disimpan di `PRAGMA user_version` (0 = DB baru). Migrasi ke-i membawa DB
// dari versi i ke i+1.
//
// ATURAN: migrasi yang sudah pernah dirilis ke device toko TIDAK BOLEH diubah
// — data toko sungguhan sudah dibentuk olehnya. Perubahan skema selalu berupa
// migrasi BARU di akhir array.
//
// Konvensi:
// - Uang = INTEGER rupiah (tanpa desimal).
// - Waktu = INTEGER epoch milidetik (UTC). Transaksi juga menyimpan
//   `tanggal_lokal` ('YYYY-MM-DD', jam toko — lihat idHariIni) supaya laporan
//   harian cukup GROUP BY kolom itu tanpa hitung zona waktu di SQL.
// - ID = TEXT (UUID dari crypto.randomUUID()) — tetap unik saat data dipindah
//   antar-device lewat export/import.
// - Tabel STRICT: SQLite menolak tipe yang salah (mis. 1500.5 ke kolom INTEGER)
//   alih-alih diam-diam menyimpannya.
// - CHECK constraint adalah pertahanan terakhir; validasi ramah-pengguna tetap
//   di logic/ masing-masing fitur.

export const MIGRASI: readonly string[] = [
  // v1 — struktur awal, meniru koleksi Firestore sebelum pivot offline-only.
  // Koleksi `agregat_laporan` sengaja tidak ditiru: laporan dihitung langsung
  // dengan SUM/GROUP BY dari transaksi + item_transaksi.
  `
  CREATE TABLE produk (
    id                 TEXT PRIMARY KEY,
    kode_part          TEXT,
    nama               TEXT NOT NULL CHECK (length(trim(nama)) > 0),
    kategori           TEXT NOT NULL CHECK (length(trim(kategori)) > 0),
    harga_beli         INTEGER NOT NULL CHECK (harga_beli >= 0),
    harga_jual         INTEGER NOT NULL CHECK (harga_jual >= 0),
    stok               INTEGER NOT NULL CHECK (stok >= 0),
    satuan             TEXT NOT NULL CHECK (satuan IN ('pcs', 'set', 'liter', 'dus')),
    kompatibilitas     TEXT,
    ambang_stok_rendah INTEGER CHECK (ambang_stok_rendah IS NULL OR ambang_stok_rendah >= 0),
    dibuat_pada        INTEGER NOT NULL,
    diperbarui_pada    INTEGER NOT NULL
  ) STRICT;

  CREATE TABLE transaksi (
    id            TEXT PRIMARY KEY,
    subtotal      INTEGER NOT NULL CHECK (subtotal >= 0),
    diskon_tipe   TEXT CHECK (diskon_tipe IN ('nominal', 'persen')),
    diskon_nilai  REAL,
    total_diskon  INTEGER NOT NULL CHECK (total_diskon >= 0),
    total         INTEGER NOT NULL CHECK (total >= 0),
    metode_bayar  TEXT NOT NULL CHECK (metode_bayar IN ('tunai', 'qris_transfer')),
    dibayar       INTEGER CHECK (dibayar IS NULL OR dibayar >= 0),
    kembalian     INTEGER CHECK (kembalian IS NULL OR kembalian >= 0),
    dibuat_pada   INTEGER NOT NULL,
    tanggal_lokal TEXT NOT NULL CHECK (tanggal_lokal GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    CHECK ((diskon_tipe IS NULL) = (diskon_nilai IS NULL)),
    CHECK (total = subtotal - total_diskon),
    CHECK (metode_bayar = 'tunai' OR (dibayar IS NULL AND kembalian IS NULL))
  ) STRICT;

  CREATE INDEX idx_transaksi_dibuat_pada ON transaksi (dibuat_pada);
  CREATE INDEX idx_transaksi_tanggal_lokal ON transaksi (tanggal_lokal);

  -- produk_id sengaja TANPA foreign key: produk boleh dihapus dari katalog,
  -- tapi histori penjualannya harus tetap utuh. Nama/harga di sini adalah
  -- snapshot saat transaksi, bukan referensi ke data produk terkini.
  CREATE TABLE item_transaksi (
    transaksi_id  TEXT NOT NULL REFERENCES transaksi (id) ON DELETE CASCADE,
    urutan        INTEGER NOT NULL CHECK (urutan >= 0),
    produk_id     TEXT NOT NULL,
    nama          TEXT NOT NULL,
    kode_part     TEXT,
    harga_satuan  INTEGER NOT NULL CHECK (harga_satuan >= 0),
    qty           INTEGER NOT NULL CHECK (qty > 0),
    subtotal_item INTEGER NOT NULL,
    PRIMARY KEY (transaksi_id, urutan),
    CHECK (subtotal_item = harga_satuan * qty)
  ) STRICT;

  CREATE INDEX idx_item_transaksi_produk ON item_transaksi (produk_id);

  -- Satu baris saja (id selalu 1).
  CREATE TABLE pengaturan_toko (
    id              INTEGER PRIMARY KEY CHECK (id = 1),
    nama_toko       TEXT NOT NULL,
    logo_webp       TEXT,
    diperbarui_pada INTEGER NOT NULL
  ) STRICT;
  `,

  // v2 — kapan terakhir file backup dibuat, untuk pengingat backup rutin.
  // Satu baris saja (id selalu 1); belum ada baris = belum pernah backup.
  `
  CREATE TABLE status_backup (
    id                   INTEGER PRIMARY KEY CHECK (id = 1),
    terakhir_backup_pada INTEGER NOT NULL
  ) STRICT;
  `,
];

export const VERSI_SKEMA = MIGRASI.length;
