import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { MarketItem } from '../types';

export const useMarketItems = () => {
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'market_items'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketItem));
      setMarketItems(items);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { marketItems, loading };
};