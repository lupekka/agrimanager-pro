import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';
import { Product, StockLog } from '../types';  // ← IMPORT

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
 const { user, userData } = useAuth();
const userName = userData?.username || user?.email || 'Azienda Agricola';

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setStockLogs([]);
      setLoading(false);
      return;
    }

    const productsQuery = query(collection(db, 'products'), where("ownerId", "==", user.uid));
    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(items);
    });

    const logsQuery = query(
      collection(db, 'stock_logs'), 
      where("ownerId", "==", user.uid), 
      orderBy('date', 'desc'), 
      limit(15)
    );
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockLog));
      setStockLogs(items);
      setLoading(false);
    });

    return () => {
      unsubProducts();
      unsubLogs();
    };
  }, [user]);

  const addProduct = async (product: Omit<Product, 'id' | 'ownerId'>) => {
    if (!user) throw new Error("Non autenticato");
    
    const existing = products.find(p => p.name.toLowerCase() === product.name.toLowerCase());
    if (existing) {
      await updateDoc(doc(db, 'products', existing.id), { 
        quantity: existing.quantity + product.quantity 
      });
    } else {
      await addDoc(collection(db, 'products'), { ...product, ownerId: user.uid });
    }
  };

  const modifyProduct = async (product: Product, amount: number, isAddition: boolean) => {
    const newQty = isAddition ? product.quantity + amount : Math.max(0, product.quantity - amount);
    await updateDoc(doc(db, 'products', product.id), { quantity: newQty });
    await addDoc(collection(db, 'stock_logs'), { 
      productName: product.name, 
      change: isAddition ? amount : -amount, 
      date: new Date().toISOString(), 
      ownerId: user!.uid,
      reason: 'modifica scorta'
    });
  };

  const deleteProduct = async (id: string) => {
    return deleteDoc(doc(db, 'products', id));
  };

  const publishToMarket = async (product: Product, price: number, phone: string) => {
    if (!user) throw new Error("Non autenticato");
    
    await addDoc(collection(db, 'market_items'), { 
      name: product.name, 
      price: Number(price), 
      quantity: product.quantity, 
      unit: product.unit, 
      sellerId: user!.uid, 
      sellerName: userName || user!.email || 'Azienda Agricola', 
      contactEmail: user!.email || '', 
      contactPhone: phone, 
      createdAt: new Date().toISOString(),
      ownerId: user!.uid
    });
    
    await addDoc(collection(db, 'stock_logs'), {
      productName: product.name,
      change: -product.quantity,
      date: new Date().toISOString(),
      ownerId: user!.uid,
      reason: 'pubblicazione market'
    });
    
    await deleteDoc(doc(db, 'products', product.id));
  };

  return { 
    products, 
    stockLogs, 
    loading, 
    addProduct, 
    modifyProduct, 
    deleteProduct,
    publishToMarket 
  };
};
