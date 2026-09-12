const ESC = 0x1b;
const GS = 0x1d;

// Reset printer ke state default (ESC @).
export function buildInisialisasi(): Uint8Array {
  return new Uint8Array([ESC, 0x40]);
}

// Satu baris teks UTF-8 diakhiri line feed.
export function buildTeksBaris(teks: string): Uint8Array {
  const encoder = new TextEncoder();
  const isi = encoder.encode(teks);
  const hasil = new Uint8Array(isi.length + 1);
  hasil.set(isi, 0);
  hasil[isi.length] = 0x0a;
  return hasil;
}

// Feed kertas lalu potong sebagian (GS V B 0) — standar ESC/POS.
export function buildPotongKertas(): Uint8Array {
  return new Uint8Array([GS, 0x56, 0x42, 0x00]);
}

// Kirim pulsa ke pin 2 laci kas (ESC p 0 t1 t2) dengan timing standar.
export function buildBukaLaciKas(): Uint8Array {
  return new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xfa]);
}

export function gabungkanPerintah(...perintah: Uint8Array[]): Uint8Array {
  const total = perintah.reduce((n, p) => n + p.length, 0);
  const hasil = new Uint8Array(total);
  let offset = 0;
  for (const p of perintah) {
    hasil.set(p, offset);
    offset += p.length;
  }
  return hasil;
}
