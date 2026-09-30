import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './app/AppLayout';
import { GerbangDb } from './app/GerbangDb';
import { ProdukFormPage } from './features/produk/ProdukFormPage';
import { ProdukListPage } from './features/produk/ProdukListPage';
import { LaporanPage } from './features/laporan/LaporanPage';
import { TransaksiPage } from './features/transaksi/TransaksiPage';
import { PengaturanMenuPage } from './features/pengaturan/PengaturanMenuPage';
import { IdentitasTokoPage } from './features/pengaturan/identitas-toko/IdentitasTokoPage';
import { PengaturanPrinterPage } from './features/pengaturan/printer/PengaturanPrinterPage';
import { BackupPage } from './features/pengaturan/backup/BackupPage';
import { MuatDataPage } from './features/pengaturan/pemantau/MuatDataPage';
import { RUTE_MUAT_DATA } from './features/pengaturan/pemantau/rute';
import { UjiDbPage } from './app/UjiDbPage';
import { MODE_PEMANTAU } from './platform/perangkat';

const HALAMAN_AWAL = MODE_PEMANTAU ? '/laporan' : '/transaksi';

export default function App() {
  // SEMENTARA: build uji Android (VITE_UJI_DB=true) cuma berisi halaman uji DB.
  if (import.meta.env.VITE_UJI_DB === 'true') return <UjiDbPage />;

  return (
    <Routes>
      {import.meta.env.DEV && <Route path="uji-db" element={<UjiDbPage />} />}
      <Route element={<GerbangDb />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to={HALAMAN_AWAL} replace />} />
          <Route path="produk" element={<ProdukListPage />} />
          <Route path="laporan" element={<LaporanPage />} />
          {MODE_PEMANTAU ? (
            // iPhone: hanya lihat data (lihat platform/perangkat.ts). Halaman
            // yang mengubah data sengaja tidak didaftarkan sama sekali.
            <Route path={RUTE_MUAT_DATA.slice(1)} element={<MuatDataPage />} />
          ) : (
            <>
              <Route path="transaksi" element={<TransaksiPage />} />
              <Route path="produk/tambah" element={<ProdukFormPage />} />
              <Route path="produk/:id/edit" element={<ProdukFormPage />} />
              <Route path="pengaturan" element={<PengaturanMenuPage />} />
              <Route path="pengaturan/identitas" element={<IdentitasTokoPage />} />
              <Route path="pengaturan/printer" element={<PengaturanPrinterPage />} />
              <Route path="pengaturan/backup" element={<BackupPage />} />
            </>
          )}
        </Route>
      </Route>
      {/* Alamat tak dikenal (mis. /login dari versi lama yang masih ter-bookmark) → halaman utama. */}
      <Route path="*" element={<Navigate to={HALAMAN_AWAL} replace />} />
    </Routes>
  );
}
