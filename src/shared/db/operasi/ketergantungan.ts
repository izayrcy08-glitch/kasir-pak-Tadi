// Jam & pembuat ID yang bisa diganti di unit test supaya hasilnya
// deterministik. Di worker selalu pakai bawaan (fungsi tidak bisa dikirim
// lewat postMessage, jadi UI memang tidak bisa menggantinya).
export interface Ketergantungan {
  sekarang: () => Date;
  buatId: () => string;
}

export const ketergantunganBawaan: Ketergantungan = {
  sekarang: () => new Date(),
  buatId: () => crypto.randomUUID(),
};
