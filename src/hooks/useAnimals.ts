import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';
import { Animal, Treatment } from '../types';  // ← IMPORT

// ✅ NESSUN TIPO DEFINITO LOCALMENTE

export const useAnimals = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setAnimals([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'animals'), where("ownerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            microchip: data.microchip || data.codice || 'N/D',
            nome: data.nome || '',
            species: data.species || 'Maiali',
            notes: data.notes || '',
            sire: data.sire || '',
            dam: data.dam || '',
            birthDate: data.birthDate || undefined,
            ownerId: data.ownerId || user.uid,
            treatments: Array.isArray(data.treatments) ? data.treatments : []
          } as Animal;
        });
        setAnimals(items);
        setLoading(false);
      },
      (err) => {
        console.error("🔥 useAnimals - ERRORE:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const addAnimal = async (animal: Omit<Animal, 'id' | 'ownerId' | 'treatments'>) => {
    if (!user) throw new Error("Non autenticato");
    return addDoc(collection(db, 'animals'), { 
      ...animal, 
      ownerId: user.uid, 
      treatments: [] 
    });
  };

  const deleteAnimal = async (id: string) => {
    return deleteDoc(doc(db, 'animals', id));
  };

  const updateAnimal = async (id: string, updates: Partial<Animal>) => {
    return updateDoc(doc(db, 'animals', id), updates);
  };

  const addTreatment = async (animalId: string, treatment: Treatment) => {
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;
    
    const currentTreatments = animal.treatments || [];
    return updateDoc(doc(db, 'animals', animalId), {
      treatments: [...currentTreatments, treatment]
    });
  };

  const updateTreatment = async (animalId: string, treatmentId: string, updates: Partial<Treatment>) => {
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;
    
    const updatedTreatments = animal.treatments?.map(t => 
      t.id === treatmentId ? { ...t, ...updates } : t
    ) || [];
    
    return updateDoc(doc(db, 'animals', animalId), {
      treatments: updatedTreatments
    });
  };

  const deleteTreatment = async (animalId: string, treatmentId: string) => {
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;
    
    const updatedTreatments = animal.treatments?.filter(t => t.id !== treatmentId) || [];
    return updateDoc(doc(db, 'animals', animalId), {
      treatments: updatedTreatments
    });
  };

  return { 
    animals, 
    loading,
    error,
    addAnimal, 
    deleteAnimal, 
    updateAnimal,
    addTreatment,
    updateTreatment,
    deleteTreatment
  };
};
