import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configurazione DIRETTA (senza import.meta.env)
const firebaseConfig = {
  apiKey: "AIzaSyD6ZxCO6BvGLKfsF235GSsLh-7GQm84Vdk",
  authDomain: "agrimanager-pro-e3cf7.firebaseapp.com",
  projectId: "agrimanager-pro-e3cf7",
  storageBucket: "agrimanager-pro-e3cf7.firebasestorage.app",
  messagingSenderId: "415553695665",
  appId: "1:415553695665:web:6e9ddd9f5241424afad790"
};

console.log("🚀 Uso configurazione Firebase diretta");

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { 
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) 
});
export const auth = getAuth(app);

// Per debug (solo in sviluppo)
if (import.meta.env?.DEV) {
  (window as any).db = db;
  console.log("📦 Firestore disponibile su window.db");
}
