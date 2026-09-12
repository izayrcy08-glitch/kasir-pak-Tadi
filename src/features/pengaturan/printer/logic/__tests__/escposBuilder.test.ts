import { describe, expect, it } from 'vitest';
import {
  buildBukaLaciKas,
  buildInisialisasi,
  buildPotongKertas,
  buildTeksBaris,
  gabungkanPerintah,
} from '../escposBuilder';

describe('buildInisialisasi', () => {
  it('menghasilkan ESC @', () => {
    expect(buildInisialisasi()).toEqual(new Uint8Array([0x1b, 0x40]));
  });
});

describe('buildTeksBaris', () => {
  it('mengubah teks jadi UTF-8 diikuti line feed', () => {
    expect(buildTeksBaris('Hi')).toEqual(new Uint8Array([0x48, 0x69, 0x0a]));
  });

  it('menghasilkan line feed saja untuk teks kosong', () => {
    expect(buildTeksBaris('')).toEqual(new Uint8Array([0x0a]));
  });
});

describe('buildPotongKertas', () => {
  it('menghasilkan GS V B 0', () => {
    expect(buildPotongKertas()).toEqual(new Uint8Array([0x1d, 0x56, 0x42, 0x00]));
  });
});

describe('buildBukaLaciKas', () => {
  it('menghasilkan ESC p 0 25 250', () => {
    expect(buildBukaLaciKas()).toEqual(new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]));
  });
});

describe('gabungkanPerintah', () => {
  it('menggabungkan beberapa perintah jadi satu buffer berurutan', () => {
    const hasil = gabungkanPerintah(buildInisialisasi(), buildTeksBaris('A'), buildPotongKertas());
    expect(hasil).toEqual(new Uint8Array([0x1b, 0x40, 0x41, 0x0a, 0x1d, 0x56, 0x42, 0x00]));
  });

  it('mengembalikan buffer kosong tanpa argumen', () => {
    expect(gabungkanPerintah()).toEqual(new Uint8Array([]));
  });
});
