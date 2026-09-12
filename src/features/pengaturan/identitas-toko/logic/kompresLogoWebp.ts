const SISI_MAKS = 256;
const KUALITAS_WEBP = 0.9;

// Bergantung pada Canvas/Image API browser (bukan react/firebase, tapi juga
// bukan murni portable ke Node) — tidak ada unit test otomatis untuk fungsi
// ini karena vitest di proyek ini jalan di environment Node tanpa jsdom+canvas.
// Diverifikasi manual lewat browser saat verifikasi UI Identitas Toko.
export function kompresLogoWebp(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const gambar = new Image();
    const urlSementara = URL.createObjectURL(file);

    gambar.onload = () => {
      URL.revokeObjectURL(urlSementara);

      const skala = Math.min(1, SISI_MAKS / Math.max(gambar.width, gambar.height));
      const lebar = Math.round(gambar.width * skala);
      const tinggi = Math.round(gambar.height * skala);

      const canvas = document.createElement('canvas');
      canvas.width = lebar;
      canvas.height = tinggi;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D tidak didukung di perangkat ini.'));
        return;
      }
      ctx.drawImage(gambar, 0, 0, lebar, tinggi);

      resolve(canvas.toDataURL('image/webp', KUALITAS_WEBP));
    };
    gambar.onerror = () => {
      URL.revokeObjectURL(urlSementara);
      reject(new Error('Gagal membaca file gambar.'));
    };
    gambar.src = urlSementara;
  });
}
