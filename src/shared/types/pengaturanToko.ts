export interface PengaturanToko {
  namaToko: string;
  logoWebp?: string;
  diperbaruiPada: number; // epoch ms
}

export type PengaturanTokoInput = Omit<PengaturanToko, 'diperbaruiPada'>;
