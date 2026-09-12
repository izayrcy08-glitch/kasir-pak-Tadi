import type { Diskon } from '../../../shared/types/transaksi';
import { terapkanDiskon } from './terapkanDiskon';

export interface ItemUntukTotal {
  hargaSatuan: number;
  qty: number;
}

export interface RingkasanTotal {
  subtotal: number;
  totalDiskon: number;
  total: number;
}

export function hitungTotal(item: ItemUntukTotal[], diskon: Diskon): RingkasanTotal {
  const subtotal = item.reduce((acc, it) => acc + it.hargaSatuan * it.qty, 0);
  const totalDiskon = terapkanDiskon(subtotal, diskon);
  return { subtotal, totalDiskon, total: subtotal - totalDiskon };
}
