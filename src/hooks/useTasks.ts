import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './useAuth';
import { Task } from '../types';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'tasks'), where("ownerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(items);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addTask = async (text: string, dueDate: string) => {
    if (!user) throw new Error("Non autenticato");
    return addDoc(collection(db, 'tasks'), { 
      text, 
      done: false, 
      dueDate, 
      ownerId: user.uid 
    });
  };

  const toggleTask = async (id: string, done: boolean) => {
    return updateDoc(doc(db, 'tasks', id), { done });
  };

  const deleteTask = async (id: string) => {
    return deleteDoc(doc(db, 'tasks', id));
  };

  return { tasks, loading, addTask, toggleTask, deleteTask };
};