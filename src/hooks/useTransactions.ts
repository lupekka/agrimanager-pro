import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';

// TIPI DEFINITI DIRETTAMENTE QUI
export type TransactionType = 'Entrata' | 'Uscita';

export interface Transaction { 
  id: string; 
  type: TransactionType; 
  amount: number; 
  desc: string; 
  species: string; 
  date: string; 
  ownerId: string; 
}

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'transactions'), 
      where("ownerId", "==", user.uid),
      orderBy('date', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'ownerId'>) => {
    if (!user) throw new Error("Non autenticato");
    return addDoc(collection(db, 'transactions'), { 
      ...transaction, 
      ownerId: user.uid 
    });
  };

  const deleteTransaction = async (id: string) => {
    return deleteDoc(doc(db, 'transactions', id));
  };

  return { transactions, loading, addTransaction, deleteTransaction };
};
