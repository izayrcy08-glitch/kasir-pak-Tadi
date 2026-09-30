import { describe, expect, it } from 'vitest';
import { pesanGagalCetak } from './pesanGagalCetak';
import { GalatPrinter } from './printerAdapter';

describe('pesanGagalCetak', () => {
  it('pesan GalatPrinter ditampilkan apa adanya', () => {
    expect(pesanGagalCetak(new GalatPrinter('Printer Bluetooth belum dipilih.'))).toBe('Printer Bluetooth belum dipilih.');
  });

  it('Web Serial tanpa port terpilih → arahkan pilih port', () => {
    for (const nama of ['SecurityError', 'NotFoundError']) {
      expect(pesanGagalCetak(new DOMException('Must be handling a user gesture', nama))).toMatch(/Printer USB belum dipilih/);
    }
  });

  it('galat lain → langkah umum + detail asli', () => {
    const pesan = pesanGagalCetak(new Error('socket closed'));
    expect(pesan).toMatch(/printer menyala/);
    expect(pesan).toContain('(socket closed)');
  });
});
