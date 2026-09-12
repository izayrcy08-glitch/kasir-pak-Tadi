// Dipakai supaya aksi simpan/aktivitas online tidak menggantung selamanya di UI
// saat perangkat offline — Firestore menunda promise write sampai tersinkron ke
// server, padahal datanya sudah masuk cache lokal & langsung tampil lewat
// onSnapshot. Kalau belum selesai dalam `ms`, anggap "sudah diantre untuk
// sinkron" dan lanjutkan; kalau promise gagal (reject) lebih cepat dari `ms`,
// error itu tetap diteruskan supaya bisa ditampilkan ke user.
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(undefined), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
