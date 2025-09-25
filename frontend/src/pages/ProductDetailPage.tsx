import { Helmet } from 'react-helmet-async';

export default function ProductDetailPage() {
  return (
    <>
      <Helmet>
        <title>Product Details - Global Product Analyzer</title>
      </Helmet>
      
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage product information
          </p>
        </div>
        
        {/* Product content */}
        <div className="text-center py-12">
          <p className="text-gray-500">Product details will be displayed here</p>
          <p className="mt-1 text-sm text-gray-400">
            This page is under construction
          </p>
        </div>
      </div>
    </>
  );
}
