import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CampaignsPage from '@/pages/CampaignsPage';
import SettingsPage from '@/pages/SettingsPage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  return (
    <>
      <Helmet>
        <title>Global Product Analyzer</title>
        <meta name="description" content="Automated dropshipping product research and validation platform" />
      </Helmet>
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
