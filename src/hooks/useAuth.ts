import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserRole, User as UserType } from '../types'; // Importa UserType per i dati

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserType | null>(null); // NUOVO
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserType;
            setUserData(data);
          } else {
            // Crea dati di default per retrocompatibilità
            const defaultData: UserType = {
              uid: u.uid,
              email: u.email || '',
              username: u.email?.split('@')[0] || 'Utente',
              farmName: 'Azienda Agricola',
              location: '',
              role: 'farmer'
            };
            setUserData(defaultData);
          }
        } catch (e) {
          console.error('Errore caricamento dati utente:', e);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email: string, password: string) => 
    signInWithEmailAndPassword(auth, email, password);

  const register = async (
    email: string, 
    password: string, 
    role: UserRole,
    username: string,
    farmName: string,
    location: string
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    const userData: UserType = {
      uid: userCredential.user.uid,
      email,
      username,
      farmName,
      location,
      role,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', userCredential.user.uid), userData);
  };

  const logout = () => signOut(auth);

  return { 
    user, 
    userData,
    loading, 
    login, 
    register, 
    logout 
  };
};
