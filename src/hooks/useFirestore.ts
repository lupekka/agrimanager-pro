import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  QueryConstraint,
  DocumentData
} from 'firebase/firestore';
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
      const items = snapshot.docs.map(doc => {
        const docData = doc.data() as Omit<T, 'id'>;
        return { id: doc.id, ...docData } as T;
      });
      setData(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [collectionName, user, additionalConstraints]);

  const add = async (item: Omit<T, 'id'>) => {
    if (!user) throw new Error("Non autenticato");
    const docRef = await addDoc(collection(db, collectionName), { 
      ...item, 
      ownerId: user.uid 
    });
    return docRef;
  };

  const remove = async (id: string) => {
    return deleteDoc(doc(db, collectionName, id));
  };

  // FIX: Gestiamo il tipo correttamente
  const update = async (id: string, updates: Partial<Omit<T, 'id'>>) => {
    const docRef = doc(db, collectionName, id);
    return updateDoc(docRef, updates as DocumentData);
  };

  return { data, loading, add, remove, update };
};
