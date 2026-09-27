// Menyimpan/mengirim file (mis. file backup) keluar dari aplikasi, per platform:
// - Android (Capacitor): tulis ke cache app lalu buka menu Bagikan bawaan
//   Android — pengguna pilih WhatsApp, Google Drive, simpan ke Files, dll.
//   (<a download> tidak jalan di WebView Capacitor.)
// - Browser/PWA Windows: dialog "Simpan sebagai" (bisa langsung ke flashdisk);
//   kalau browser tidak mendukung, unduh biasa ke folder Unduhan.
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export type HasilSimpanBerkas = 'tersimpan' | 'dibatalkan';

interface OpsiSimpan {
  nama: string;
  bytes: Uint8Array<ArrayBuffer>;
  mime: string;
  /** Judul menu Bagikan (Android). */
  judul: string;
  /** Awalan nama file lama di cache Android yang boleh dibersihkan. */
  awalanBersihkan?: string;
}

export function simpanBerkas(opsi: OpsiSimpan): Promise<HasilSimpanBerkas> {
  return Capacitor.isNativePlatform() ? bagikanAndroid(opsi) : simpanWeb(opsi);
}

function keBase64(bytes: Uint8Array<ArrayBuffer>, mime: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pembaca = new FileReader();
    pembaca.onload = () => {
      const dataUrl = pembaca.result as string;
      resolve(dataUrl.slice(dataUrl.indexOf(',') + 1));
    };
    pembaca.onerror = () => reject(pembaca.error ?? new Error('Gagal membaca file.'));
    pembaca.readAsDataURL(new Blob([bytes], { type: mime }));
  });
}

async function bagikanAndroid({ nama, bytes, mime, judul, awalanBersihkan }: OpsiSimpan): Promise<HasilSimpanBerkas> {
  // File lama tidak dihapus tepat setelah dibagikan (aplikasi tujuan mungkin
  // masih membacanya) — dibersihkan saat membagikan file berikutnya.
  if (awalanBersihkan) {
    const { files } = await Filesystem.readdir({ path: '', directory: Directory.Cache });
    await Promise.all(
      files
        .filter((f) => f.type === 'file' && f.name.startsWith(awalanBersihkan))
        .map((f) => Filesystem.deleteFile({ path: f.name, directory: Directory.Cache })),
    );
  }
  const { uri } = await Filesystem.writeFile({
    path: nama,
    data: await keBase64(bytes, mime),
    directory: Directory.Cache,
  });
  try {
    await Share.share({ title: judul, dialogTitle: judul, files: [uri] });
    return 'tersimpan';
  } catch (err) {
    if (err instanceof Error && /cancel/i.test(err.message)) return 'dibatalkan';
    throw err;
  }
}

// File System Access API (Chrome/Edge desktop) — belum ada di lib.dom TS.
interface JendelaDenganPickerSimpan {
  showSaveFilePicker?: (opsi: { suggestedName: string }) => Promise<{
    createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
  }>;
}

async function simpanWeb({ nama, bytes, mime }: OpsiSimpan): Promise<HasilSimpanBerkas> {
  const blob = new Blob([bytes], { type: mime });
  const picker = (window as JendelaDenganPickerSimpan).showSaveFilePicker;
  if (picker) {
    let handle;
    try {
      handle = await picker({ suggestedName: nama });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'dibatalkan';
      throw err;
    }
    const tulis = await handle.createWritable();
    await tulis.write(blob);
    await tulis.close();
    return 'tersimpan';
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  a.click();
  // Beri waktu browser memulai unduhan sebelum URL dilepas.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'tersimpan';
}
