import { describe, expect, it, vi } from 'vitest';
import { withTimeout } from './withTimeout';

describe('withTimeout', () => {
  it('resolves dengan nilai asli kalau promise selesai sebelum batas waktu', async () => {
    const hasil = await withTimeout(Promise.resolve('selesai'), 1000);
    expect(hasil).toBe('selesai');
  });

  it('resolves dengan undefined kalau promise belum selesai sampai batas waktu (mis. offline)', async () => {
    vi.useFakeTimers();
    const takKunjungSelesai = new Promise(() => {});
    const janji = withTimeout(takKunjungSelesai, 1000);
    vi.advanceTimersByTime(1000);
    await expect(janji).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it('meneruskan error kalau promise gagal sebelum batas waktu', async () => {
    await expect(withTimeout(Promise.reject(new Error('gagal')), 1000)).rejects.toThrow('gagal');
  });
});
