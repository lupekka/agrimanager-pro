import React, { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { ProductCard } from './ProductCard';
import { ProductForm } from './ProductForm';
import { StockLogs } from './StockLogs';
import { PublishForm } from '../market/PublishForm';

export const ProductList: React.FC = () => {
  const { products, stockLogs, addProduct, modifyProduct, deleteProduct, publishToMarket } = useProducts();
  const [sellingProduct, setSellingProduct] = useState<any>(null);

  return (
    <div className="space-y-6">
      {/* Form di pubblicazione (se attivo) */}
      {sellingProduct && (
        <PublishForm
          product={sellingProduct}
          onPublish={async (price, phone) => {
            await publishToMarket(sellingProduct, price, phone);
            setSellingProduct(null);
          }}
          onCancel={() => setSellingProduct(null)}
        />
      )}

      {/* Form aggiunta prodotto */}
      <ProductForm onSave={addProduct} />

      {/* Griglia prodotti */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
       {(products || []).map(p => (
          <ProductCard
            key={p.id}
            product={p}
            onModify={modifyProduct}
            onPublish={setSellingProduct}
            onDelete={deleteProduct}
          />
        ))}
      </div>

      {/* Log movimenti */}
      <StockLogs logs={stockLogs} />
    </div>
  );
};
