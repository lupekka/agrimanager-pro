import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, QueryConstraint } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';

export const useFirestore = <T extends { id: string }>(
  collectionName: string,
  additionalConstraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    const constraints = [where("ownerId", "==", user.uid), ...additionalConstraints];
    const q = query(collection(db, collectionName), ...constraints);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setData(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [collectionName, user]);

  const add = async (item: Omit<T, 'id'>) => {
    if (!user) throw new Error("Non autenticato");
    return addDoc(collection(db, collectionName), { ...item, ownerId: user.uid });
  };

  const remove = async (id: string) => {
    return deleteDoc(doc(db, collectionName, id));
  };

  const update = async (id: string, updates: Partial<T>) => {
    return updateDoc(doc(db, collectionName, id), updates);
  };

  return { data, loading, add, remove, update };
};