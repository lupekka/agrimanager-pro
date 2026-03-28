import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';
import { AnimalGroup } from '../types';

export const useAnimalGroups = () => {
  const [groups, setGroups] = useState<AnimalGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Carica i gruppi
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'animalGroups'), where("ownerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AnimalGroup));
        setGroups(items);
        setLoading(false);
      },
      (err) => {
        console.error("🔥 useAnimalGroups - ERRORE:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Crea un nuovo gruppo (parto)
  const addGroup = async (group: Omit<AnimalGroup, 'id' | 'ownerId' | 'createdAt'>) => {
    if (!user) throw new Error("Non autenticato");
    
    const newGroup = {
      ...group,
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      currentQuantity: group.quantity // inizialmente uguale alla quantità
    };
    
    return addDoc(collection(db, 'animalGroups'), newGroup);
  };

  // Riduci la quantità di un gruppo (vendita/morte)
  const reduceQuantity = async (groupId: string, amount: number = 1, reason: string = 'vendita') => {
    if (!user) throw new Error("Non autenticato");
    
    const groupRef = doc(db, 'animalGroups', groupId);
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error("Gruppo non trovato");
    
    const newQuantity = Math.max(0, group.currentQuantity - amount);
    
    // Registra la transazione
    await addDoc(collection(db, 'transactions'), {
      desc: `Vendita di ${amount} ${group.species.toLowerCase()} dal gruppo "${group.name}"`,
      amount: 0, // l'utente inserirà il prezzo
      type: 'Entrata',
      species: group.species,
      date: new Date().toLocaleDateString('it-IT'),
      ownerId: user.uid,
      groupId: groupId
    });
    
    // Aggiorna il gruppo
    await updateDoc(groupRef, { currentQuantity: newQuantity });
    
    return newQuantity;
  };

  // Aumenta la quantità di un gruppo (nuovi nati aggiunti al gruppo)
  const increaseQuantity = async (groupId: string, amount: number = 1) => {
    if (!user) throw new Error("Non autenticato");
    
    const groupRef = doc(db, 'animalGroups', groupId);
    const group = groups.find(g => g.id === groupId);
    if (!group) throw new Error("Gruppo non trovato");
    
    const newQuantity = group.currentQuantity + amount;
    
    await updateDoc(groupRef, { 
      currentQuantity: newQuantity,
      quantity: group.quantity + amount // aggiorna anche la quantità originale
    });
    
    return newQuantity;
  };

  // Elimina un gruppo (se vuoto o per errore)
  const deleteGroup = async (groupId: string) => {
    return deleteDoc(doc(db, 'animalGroups', groupId));
  };

  // Aggiorna note del gruppo
  const updateGroupNotes = async (groupId: string, notes: string) => {
    return updateDoc(doc(db, 'animalGroups', groupId), { notes });
  };

  return {
    groups,
    loading,
    error,
    addGroup,
    reduceQuantity,
    increaseQuantity,
    deleteGroup,
    updateGroupNotes
  };
};
