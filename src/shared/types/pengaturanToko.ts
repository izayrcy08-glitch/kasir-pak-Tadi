import type { Timestamp } from 'firebase/firestore';

export interface PengaturanToko {
  namaToko: string;
  logoWebp?: string;
  diperbaruiPada: Timestamp;
}

export type PengaturanTokoInput = Omit<PengaturanToko, 'diperbaruiPada'>;
