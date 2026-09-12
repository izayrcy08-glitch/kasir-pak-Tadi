import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './app/AppLayout';
import { FiturBelumDibangun } from './app/FiturBelumDibangun';
import { ProdukFormPage } from './features/produk/ProdukFormPage';
import { ProdukListPage } from './features/produk/ProdukListPage';
import { LaporanPage } from './features/laporan/LaporanPage';
import { TransaksiPage } from './features/transaksi/TransaksiPage';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/transaksi" replace />} />
        <Route path="transaksi" element={<TransaksiPage />} />
        <Route path="produk" element={<ProdukListPage />} />
        <Route path="produk/tambah" element={<ProdukFormPage />} />
        <Route path="produk/:id/edit" element={<ProdukFormPage />} />
        <Route path="laporan" element={<LaporanPage />} />
        <Route path="pengaturan" element={<FiturBelumDibangun judul="Pengaturan" />} />
      </Route>
    </Routes>
  );
}
