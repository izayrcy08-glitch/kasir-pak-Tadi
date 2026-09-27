/// <reference types="node" />
// Pengaman tambalan patches/@sqlite.org+sqlite-wasm+*.patch.
//
// Library asli memanggil removeVfs() — MENGHAPUS seluruh direktori database —
// setiap kali pembukaan VFS opfs-sahpool gagal, termasuk kegagalan sepele
// seperti file masih dikunci worker lama saat app dimuat ulang. Untuk app
// kasir itu berarti seluruh data toko bisa hilang. Tes ini gagal kalau
// library di-update dan tambalannya tidak terpasang lagi: buat ulang
// tambalannya (npx patch-package @sqlite.org/sqlite-wasm) sebelum rilis.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const distDir = dirname(require.resolve('@sqlite.org/sqlite-wasm/package.json'));
const kodeBrowser = readFileSync(join(distDir, 'dist', 'index.mjs'), 'utf8');

describe('tambalan sqlite-wasm', () => {
  it('pembukaan VFS yang gagal tidak menghapus direktori database', () => {
    expect(kodeBrowser).not.toContain('await thePool.removeVfs().catch(() => {});');
    expect(kodeBrowser).toContain('PATCH kasir');
  });
});
