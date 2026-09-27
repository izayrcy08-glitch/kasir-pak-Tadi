// Klien main-thread untuk sqlite.worker.ts. Satu worker untuk seluruh app —
// VFS opfs-sahpool mengunci file DB, jadi hanya satu koneksi per origin.
import type { DbRequest, DbResponse, InfoDb, NilaiSql } from './protokol';

type TanpaId<T> = T extends unknown ? Omit<T, 'id'> : never;

let worker: Worker | null = null;
let idBerikut = 1;
const menunggu = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function ambilWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./sqlite.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<DbResponse>) => {
      const res = e.data;
      const p = menunggu.get(res.id);
      if (!p) return;
      menunggu.delete(res.id);
      if (res.ok) p.resolve(res.hasil);
      else p.reject(new Error(res.pesan));
    };
  }
  return worker;
}

function kirim(req: TanpaId<DbRequest>): Promise<unknown> {
  const id = idBerikut++;
  return new Promise((resolve, reject) => {
    menunggu.set(id, { resolve, reject });
    ambilWorker().postMessage({ ...req, id });
  });
}

export function query<T = Record<string, unknown>>(sql: string, bind?: NilaiSql[]): Promise<T[]> {
  return kirim({ type: 'query', sql, bind }) as Promise<T[]>;
}

export function infoDb(): Promise<InfoDb> {
  return kirim({ type: 'info' }) as Promise<InfoDb>;
}

// Hasil postMessage selalu di-clone ke ArrayBuffer biasa (bukan Shared).
export function exportDb(): Promise<Uint8Array<ArrayBuffer>> {
  return kirim({ type: 'export' }) as Promise<Uint8Array<ArrayBuffer>>;
}
