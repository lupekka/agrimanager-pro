import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserRole } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserName(data.name || 'Utente');
          } else {
            setUserRole('farmer');
            setUserName('Azienda Agricola');
          }
        } catch (e) {
          setUserRole('farmer');
          setUserName('Azienda Agricola');
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserName('');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email: string, password: string) => 
    signInWithEmailAndPassword(auth, email, password);

  const register = (email: string, password: string, role: UserRole, name: string) => 
    createUserWithEmailAndPassword(auth, email, password)
      .then((uc) => setDoc(doc(db, 'users', uc.user.uid), { role, name, email }));

  const logout = () => signOut(auth);

  return { user, userRole, userName, loading, login, register, logout };
};