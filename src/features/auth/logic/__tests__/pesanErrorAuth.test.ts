import { describe, expect, it } from 'vitest';
import { pesanErrorAuth } from '../pesanErrorAuth';

describe('pesanErrorAuth', () => {
  it('memetakan kredensial salah ke pesan yang sama (tidak bocorkan email terdaftar atau tidak)', () => {
    expect(pesanErrorAuth('auth/invalid-credential')).toBe('Email atau password salah.');
    expect(pesanErrorAuth('auth/wrong-password')).toBe('Email atau password salah.');
    expect(pesanErrorAuth('auth/user-not-found')).toBe('Email atau password salah.');
  });

  it('memetakan kode dikenal lain ke pesan spesifik', () => {
    expect(pesanErrorAuth('auth/too-many-requests')).toContain('Terlalu banyak percobaan');
    expect(pesanErrorAuth('auth/network-request-failed')).toContain('koneksi internet');
  });

  it('jatuh ke pesan default untuk kode tak dikenal atau kosong', () => {
    expect(pesanErrorAuth('auth/entah-apa')).toBe('Gagal masuk. Coba lagi.');
    expect(pesanErrorAuth(undefined)).toBe('Gagal masuk. Coba lagi.');
  });
});
