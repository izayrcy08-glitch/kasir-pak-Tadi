import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './app/AppLayout';
import { GerbangDb } from './app/GerbangDb';
import { RequireAuth } from './app/RequireAuth';
import { LoginPage } from './features/auth/LoginPage';
import { ProdukFormPage } from './features/produk/ProdukFormPage';
import { ProdukListPage } from './features/produk/ProdukListPage';
import { LaporanPage } from './features/laporan/LaporanPage';
import { TransaksiPage } from './features/transaksi/TransaksiPage';
import { PengaturanMenuPage } from './features/pengaturan/PengaturanMenuPage';
import { IdentitasTokoPage } from './features/pengaturan/identitas-toko/IdentitasTokoPage';
import { PengaturanPrinterPage } from './features/pengaturan/printer/PengaturanPrinterPage';
import { UjiDbPage } from './app/UjiDbPage';

export default function App() {
  // SEMENTARA: build uji Android (VITE_UJI_DB=true) cuma berisi halaman uji DB.
  if (import.meta.env.VITE_UJI_DB === 'true') return <UjiDbPage />;

  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      {import.meta.env.DEV && <Route path="uji-db" element={<UjiDbPage />} />}
      <Route element={<RequireAuth />}>
        <Route element={<GerbangDb />}>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to="/transaksi" replace />} />
            <Route path="transaksi" element={<TransaksiPage />} />
            <Route path="produk" element={<ProdukListPage />} />
            <Route path="produk/tambah" element={<ProdukFormPage />} />
            <Route path="produk/:id/edit" element={<ProdukFormPage />} />
            <Route path="laporan" element={<LaporanPage />} />
            <Route path="pengaturan" element={<PengaturanMenuPage />} />
            <Route path="pengaturan/identitas" element={<IdentitasTokoPage />} />
            <Route path="pengaturan/printer" element={<PengaturanPrinterPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
