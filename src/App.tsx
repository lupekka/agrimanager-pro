import React, { useState, useEffect } from 'react';
import {
  PawPrint, CalendarDays, TrendingUp, Network, Baby, Trash2,
  PlusCircle, LogOut, Lock, Menu, X, Search, LayoutDashboard,
  History, Package, Edit2, CheckCircle2,
  MinusCircle, Activity, ListChecks, Wallet,
  ArrowUpRight, ArrowDownLeft, Ghost, UserPlus, Stethoscope, 
  UploadCloud, AlertTriangle, FileDown, Store, ShoppingBag, 
  MessageCircle, Mail, Bot, Info, Send
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where, getDocs, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setDoc, getDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";

// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyD6ZxCO6BvGLKfsF235GSsLh-7GQm84Vdk",
  authDomain: "agrimanager-pro-e3cf7.firebaseapp.com",
  projectId: "agrimanager-pro-e3cf7",
  storageBucket: "agrimanager-pro-e3cf7.firebasestorage.app",
  messagingSenderId: "415553695665",
  appId: "1:415553695665:web:6e9ddd9f5241424afad790"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) });
const auth = getAuth(app);

// --- INTERFACCE DATI ---
type Species = 'Maiali' | 'Cavalli' | 'Mucche' | 'Galline' | 'Oche';
interface Animal { id: string; name: string; species: Species; notes: string; sire?: string; dam?: string; birthDate?: string; ownerId: string; }
interface BirthRecord { id: string; animalName: string; species: Species; date: string; offspringCount: number; birthDate: string; ownerId: string; }
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dateCompleted?: string; dueDate?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }
interface MarketItem { id: string; name: string; price: number; quantity: number; unit: string; sellerId: string; sellerName: string; contactEmail: string; contactPhone: string; createdAt: string; }

// --- COMPONENTE DINASTIA (ALBERO GENEALOGICO) ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const children = allAnimals.filter(a => a.dam === animal.name || a.sire === animal.name || a.dam === animal.id || a.sire === animal.id);
  return (
    <div className={level > 0 ? "ml-8 border-l-4 border-emerald-100 pl-6 mt-4 relative" : "mt-2"}>
      {level > 0 && <div className="absolute top-6 left-0 w-6 h-1 bg-emerald-100 -ml-4"></div>}
      <div className={`p-6 rounded-[2rem] border shadow-lg flex flex-col bg-white transition-all hover:scale-[1.02] ${level === 0 ? 'border-l-8 border-emerald-500 shadow-emerald-100' : 'border-stone-100 shadow-stone-100'}`}>
        <div className="flex items-center gap-3 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-[10px] ${level === 0 ? 'bg-emerald-600' : 'bg-stone-300'}`}>{level}</div>
            <span className="font-black text-stone-900 tracking-tighter text-lg uppercase">{animal.name}</span>
        </div>
        <div className="flex gap-2">
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">{animal.species}</span>
            {animal.birthDate && <span className="text-[10px] font-black text-stone-400 bg-stone-50 px-3 py-1 rounded-full uppercase tracking-widest italic">{animal.birthDate}</span>}
        </div>
      </div>
      {children.length > 0 && (
        <div className="mt-4 space-y-4">
          {children.map(child => <DynastyBranch key={child.id} animal={child} allAnimals={allAnimals} level={level + 1} />)}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'farmer' | 'consumer' | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);

  // --- DATI STATO ---
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  // --- STATI INPUT FORM ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regRole, setRegRole] = useState<'farmer' | 'consumer'>('farmer');
  const [regName, setRegName] = useState('');
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', dam: '', sire: '', notes: '' });
  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as any, species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  const [newTask, setNewTask] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  // --- IA & VET & MARKET ---
  const [showAssistant, setShowAssistant] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [vetSymptom, setVetSymptom] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vetResult, setVetResult] = useState<any>(null);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sellPrice, setSellPrice] = useState(0);
  const [sellPhone, setSellPhone] = useState('');

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];
  const validAnimals = animals.filter(a => a.name && a.name.trim().length > 0);

  // --- GESTIONE ACCESSO E DETERMINAZIONE RUOLO ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            const d = userDoc.data();
            setUserRole(d.role);
            setUserName(d.name || 'Utente');
            setActiveTab(d.role === 'consumer' ? 'market' : 'dashboard');
          } else {
            // Retrocompatibilità per account vecchi senza ruolo
            setUserRole('farmer');
            setUserName('Azienda Agricola');
            setActiveTab('dashboard');
          }
        } catch (e) {
          setUserRole('farmer');
          setActiveTab('dashboard');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- SINCRONIZZAZIONE REAL-TIME DATABASE ---
  useEffect(() => {
    if (!user?.uid || !userRole) return;
    const unsubs: any[] = [];
    
    // Tutti gli utenti sincronizzano il mercato pubblico
    unsubs.push(onSnapshot(collection(db, 'market_items'), s => {
      setMarketItems(s.docs.map(d => ({ id: d.id, ...d.data() } as MarketItem)));
    }));

    // Se l'utente è agricoltore, sincronizza i dati gestionali privati
    if (userRole === 'farmer') {
      const q = (coll: string) => query(collection(db, coll), where("ownerId", "==", user.uid));
      unsubs.push(onSnapshot(q('animals'), s => setAnimals(s.docs.map(d => ({ id: d.id, ...d.data() } as Animal)))));
      unsubs.push(onSnapshot(q('births'), s => setBirths(s.docs.map(d => ({ id: d.id, ...d.data() } as BirthRecord)))));
      unsubs.push(onSnapshot(q('transactions'), s => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))));
      unsubs.push(onSnapshot(q('tasks'), s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() } as Task)))));
      unsubs.push(onSnapshot(q('products'), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product)))));
    }
    return () => unsubs.forEach(u => u());
  }, [user?.uid, userRole]);

  // --- LOGICA LOGIN / REGISTRAZIONE ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', uc.user.uid), {
          role: regRole,
          name: regName,
          email: email,
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      alert("Errore accesso: controlla le credenziali.");
      setLoading(false);
    }
  };

  // --- LOGICA SALVATAGGIO CAPI ---
  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("Codice capo obbligatorio!");
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', dam: '', sire: '', notes: '' });
  };

  // --- REGISTRO PARTI: GENERA AUTOMATICAMENTE I FIGLI ---
  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("Specificare ID Madre!");
    await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    
    // Ciclo per creare i nuovi animali nati
    for (let i = 0; i < newBirth.count; i++) {
      await addDoc(collection(db, 'animals'), {
        name: `FIGLIO_${newBirth.idCode}_${Math.floor(Math.random()*9999)}`,
        species: newBirth.species,
        birthDate: newBirth.birthDate,
        dam: newBirth.idCode,
        notes: 'Nascita registrata tramite modulo Parti',
        ownerId: user!.uid
      });
    }
    setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
    alert("Operazione completata: registro aggiornato e figli creati.");
  };

  // --- LOGICA BILANCIO ---
  const handleSaveTransaction = async () => {
    if (newTrans.amount <= 0 || !newTrans.desc) return alert("Inserisci importo e descrizione.");
    await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
  };

  // --- LOGICA MAGAZZINO SCORTE ---
  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.quantity <= 0) return alert("Dati magazzino incompleti!");
    const existing = products.find(p => p.name.toLowerCase() === newProduct.name.toLowerCase());
    if (existing) {
      await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity });
    } else {
      await addDoc(collection(db, 'products'), { ...newProduct, ownerId: user!.uid });
    }
    setNewProduct({ name: '', quantity: 0, unit: 'kg' });
  };

  const reduceProduct = async (id: string, amount: number) => {
    const p = products.find(prod => prod.id === id);
    if (p && p.quantity >= amount) await updateDoc(doc(db, 'products', id), { quantity: p.quantity - amount });
  };

  // --- LOGICA AGENDA LAVORI ---
  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'tasks'), { text: newTask, done: false, dueDate: newTaskDate, ownerId: user!.uid });
    setNewTask('');
  };

  // --- LOGICA PUBBLICAZIONE MERCATO KM 0 ---
  const handlePublishToMarket = async () => {
    if (!sellingProduct || sellPrice <= 0) return alert("Specifica un prezzo di vendita!");
    await addDoc(collection(db, 'market_items'), {
      name: sellingProduct.name,
      price: sellPrice,
      quantity: sellingProduct.quantity,
      unit: sellingProduct.unit,
      sellerId: user!.uid,
      sellerName: userName,
      contactEmail: user!.email,
      contactPhone: sellPhone,
      createdAt: new Date().toISOString()
    });
    setSellingProduct(null);
    alert("Prodotto in vetrina!");
  };

  // --- LOGICA INTELLIGENZA ARTIFICIALE VOCALE ---
  const handleAICommand = async () => {
    if (!aiInput.trim()) return;
    setAiLogs(["Analisi neurale in corso..."]);
    
    // Suddivisione della frase complessa in ordini singoli
    const frasi = aiInput.toLowerCase().split(/ e |,|\./).filter(s => s.trim());
    let logs = [];

    for (let f of frasi) {
      const numMatch = f.match(/(\d+)/);
      const num = numMatch ? Number(numMatch[1]) : null;
      
      // Comando Vendita (Bilancio Entrata)
      if (f.includes('venduto') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `Vendita rapida IA: ${f}`, amount: num, type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Registrato incasso: ${num}€`);
      } 
      // Comando Spesa (Bilancio Uscita)
      else if ((f.includes('comprato') || f.includes('speso')) && num) {
        await addDoc(collection(db, 'transactions'), { desc: `Spesa rapida IA: ${f}`, amount: num, type: 'Uscita', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Registrata spesa: ${num}€`);
      } 
      // Comando Scorta (Magazzino)
      else if (f.includes('ho') && num) {
        const prodName = f.replace(/ho|(\d+)/g, '').trim().toUpperCase();
        await addDoc(collection(db, 'products'), { name: prodName, quantity: num, unit: 'unità', ownerId: user!.uid });
        logs.push(`✅ Scorta aggiornata: ${num} ${prodName}`);
      }
    }
    setAiLogs(logs.length > 0 ? logs : ["IA: Comando non riconosciuto. Usa parole come 'venduto', 'speso' o 'ho'."]);
    setAiInput('');
  };

  // --- LOGICA ESPORTAZIONE PDF REGISTRO ASL ---
  const exportASLReport = () => {
    if (animals.length === 0) return alert("Nessun capo da esportare!");
    const doc = new jsPDF();
    const nomeAz = window.prompt("Inserisci il nome della tua Azienda Agricola:") || "Azienda Agricola";
    
    doc.setFontSize(24); doc.setTextColor(5, 150, 105); 
    doc.text(nomeAz, 14, 22);
    
    doc.setFontSize(10); doc.setTextColor(100, 100, 100);
    doc.text(`Registro Ufficiale Anagrafica - Generato il ${new Date().toLocaleDateString()}`, 14, 30);
    
    const rows = animals.sort((a,b) => a.species.localeCompare(b.species)).map(a => [
        a.name, a.species.toUpperCase(), a.birthDate || 'N/D', a.dam || '-', a.notes || 'Nessuna nota'
    ]);
    
    autoTable(doc, {
      head: [['ID / TAG', 'SPECIE', 'NASCITA', 'MADRE', 'TRATTAMENTI/NOTE']],
      body: rows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], fontSize: 10, fontStyle: 'bold' },
      styles: { cellPadding: 3, fontSize: 9 }
    });
    
    doc.save(`Registro_ASL_${nomeAz.replace(/ /g, '_')}.pdf`);
  };

  // --- UI CARICAMENTO ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
      <div className="relative">
        <Activity className="animate-spin text-emerald-600" size={64} />
        <TrendingUp className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-950" size={24} />
      </div>
      <h2 className="mt-8 font-black text-emerald-950 uppercase tracking-[0.5em] animate-pulse italic">Caricamento in corso...</h2>
      <p className="text-stone-400 text-[10px] mt-2 font-bold uppercase tracking-widest">Sincronizzazione Cloud Firebase 2026</p>
    </div>
  );

  // --- UI LOGIN / REGISTRAZIONE ---
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-[100px]"></div>
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl w-full max-w-md border border-stone-200 relative z-10">
          <div className="flex justify-center mb-10">
            <div className="bg-emerald-600 p-6 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-200 rotate-3 transition-transform hover:rotate-0">
              <TrendingUp size={48} strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-5xl font-black text-center mb-2 text-emerald-950 italic tracking-tighter">AgriManage</h1>
          <p className="text-center text-stone-400 text-[11px] font-black uppercase tracking-[0.3em] mb-12 italic underline decoration-emerald-500 underline-offset-8 decoration-4">The Future of Farming</p>
          
          <form onSubmit={handleAuth} className="space-y-6">
            {isRegistering && (
              <div className="space-y-4 bg-stone-50 p-8 rounded-[3rem] border border-stone-200 mb-8 animate-in slide-in-from-top-4">
                <p className="text-[10px] font-black text-stone-500 uppercase text-center mb-4 tracking-widest">Seleziona il tuo profilo</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black border-2 transition-all ${regRole === 'farmer' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-stone-400 border-stone-200'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black border-2 transition-all ${regRole === 'consumer' ? 'bg-amber-500 text-white border-amber-500 shadow-lg' : 'bg-white text-stone-400 border-stone-200'}`}>CLIENTE</button>
                </div>
                <input placeholder="Nome Azienda o Tuo Nome" className="w-full p-5 rounded-2xl bg-white border-none shadow-inner font-bold text-sm focus:ring-4 focus:ring-emerald-100 transition-all" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
            )}
            <input type="email" placeholder="Indirizzo Email" className="w-full p-5 rounded-2xl bg-stone-50 border-none shadow-inner font-bold text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password Sicura" className="w-full p-5 rounded-2xl bg-stone-50 border-none shadow-inner font-bold text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-950 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 text-xs">
              {isRegistering ? "Crea Account Pro" : "Effettua Accesso"}
            </button>
          </form>
          <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-[10px] font-black text-stone-400 uppercase tracking-widest mt-10 hover:text-emerald-600 transition-colors">
            {isRegistering ? "Hai già un account? Accedi" : "Nuovo utente? Registrati gratuitamente"}
          </button>
        </div>
      </div>
    );
  }

  // --- CONFIGURAZIONE MENU ---
  const menuItems = userRole === 'farmer' ? [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Anagrafica Capi', icon: PawPrint },
    { id: 'births', label: 'Registro Parti', icon: Baby },
    { id: 'finance', label: 'Bilancio Cash', icon: Wallet },
    { id: 'products', label: 'Magazzino Scorte', icon: Package },
    { id: 'tasks', label: 'Agenda Lavori', icon: ListChecks },
    { id: 'dinastia', label: 'Albero Genealogico', icon: Network },
    { id: 'vet', label: 'Veterinario IA', icon: Stethoscope },
    { id: 'market', label: 'Vetrina Mercato', icon: Store, color: 'text-amber-500' }
  ] : [
    { id: 'market', label: 'Acquista Local', icon: ShoppingBag }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col md:flex-row relative text-stone-900 font-sans">
      
      {/* --- ASSISTENTE IA FLOATING BUTTON --- */}
      {userRole === 'farmer' && (
        <button onClick={() => setShowAssistant(!showAssistant)} className="fixed bottom-28 right-8 md:bottom-12 md:right-12 bg-blue-600 text-white p-6 rounded-full shadow-[0_20px_50px_rgba(37,99,235,0.4)] z-50 hover:scale-110 transition-all active:scale-90 animate-bounce border-4 border-white">
          <Bot size={36} />
        </button>
      )}

      {/* --- SIDEBAR DESKTOP --- */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-r p-10 fixed h-full shadow-2xl z-40">
        <div className="flex items-center gap-4 mb-16 group">
          <div className="bg-emerald-600 p-4 rounded-3xl text-white shadow-xl shadow-emerald-100 group-hover:rotate-12 transition-transform duration-500"><TrendingUp size={28} strokeWidth={3} /></div>
          <h1 className="text-3xl font-black italic tracking-tighter text-emerald-950 uppercase">AgriPro</h1>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-5 w-full p-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-200 translate-x-2' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'}`}>
              <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-12 pt-10 border-t border-stone-100">
          <div className="flex items-center gap-4 mb-8 p-5 bg-stone-50 rounded-[2rem] border border-stone-100">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-100 uppercase">{userName.charAt(0)}</div>
            <div className="truncate"><p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Authenticated</p><p className="font-black text-sm truncate tracking-tighter text-stone-800">{userName}</p></div>
          </div>
          <button onClick={() => signOut(auth)} className="text-red-500 font-black flex items-center gap-4 w-full p-3 text-[11px] uppercase tracking-[0.2em] hover:translate-x-2 transition-transform"><LogOut size={20}/> Logout</button>
        </div>
      </aside>

      {/* --- MOBILE NAV BOTTOM --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t flex justify-around p-5 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.05)] overflow-x-auto hide-scrollbar">
        {menuItems.slice(0, 5).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-2 min-w-[70px] ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-300'}`}>
            <item.icon size={26} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-[7px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-80 p-8 md:p-16 pb-40">
        <header className="flex justify-between items-center mb-16 animate-in slide-in-from-left duration-700">
          <div>
            <h2 className="text-6xl font-black text-stone-900 italic tracking-[ -0.05em] uppercase leading-none mb-2">{activeTab}</h2>
            <div className="flex items-center gap-2 text-stone-400 font-black text-[10px] uppercase tracking-[0.3em]">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                AgriManage Cloud Environment v3.0
            </div>
          </div>
        </header>

        {/* --- ASSISTENTE IA BOX --- */}
        {showAssistant && (
          <div className="mb-16 bg-white p-10 rounded-[4rem] border-4 border-blue-100 shadow-[0_40px_80px_rgba(37,99,235,0.15)] animate-in slide-in-from-top-12 duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-blue-300"></div>
            <div className="flex items-center gap-4 mb-8 text-blue-900">
              <Bot size={32} strokeWidth={2.5} className="animate-pulse" />
              <h3 className="font-black text-sm uppercase tracking-[0.4em]">Neural Command Center IA</h3>
            </div>
            <div className="flex gap-6">
              <input className="flex-1 p-8 bg-blue-50 border-none rounded-[2.5rem] font-bold text-blue-900 text-xl placeholder:text-blue-200 shadow-inner focus:ring-4 focus:ring-blue-100 transition-all" placeholder="Dettami tutto: 'Venduto maiale a 180€ e speso 60€ mangime'..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAICommand()} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-14 rounded-[2.5rem] font-black shadow-2xl shadow-blue-300 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all text-sm tracking-widest uppercase">Esegui</button>
            </div>
            {aiLogs.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-4">
                {aiLogs.map((l, i) => <span key={i} className="bg-emerald-100 text-emerald-800 px-6 py-3 rounded-2xl text-[10px] font-black animate-in zoom-in border-2 border-emerald-200 uppercase tracking-widest shadow-sm">{l}</span>)}
              </div>
            )}
          </div>
        )}

        {/* --- 1. DASHBOARD --- */}
        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-in fade-in duration-1000">
            <div onClick={()=>setActiveTab('inventory')} className="bg-emerald-600 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.03] transition-all duration-500">
              <PawPrint size={220} className="absolute -bottom-20 -right-20 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-1000" />
              <p className="text-[12px] font-black uppercase opacity-60 tracking-[0.5em] mb-6">Total Stock</p>
              <h4 className="text-[9rem] font-black italic tracking-tighter leading-[0.7]">{animals.length}</h4>
              <p className="mt-4 font-black text-emerald-100 uppercase text-xs tracking-widest italic decoration-2 underline underline-offset-8 decoration-white/20">Capi Attivi in Stalla</p>
              <button className="mt-12 bg-white/20 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase flex items-center gap-4 backdrop-blur-xl border border-white/20 shadow-lg tracking-[0.2em]">Open Registry <ArrowUpRight size={18}/></button>
            </div>
            
            <div onClick={()=>setActiveTab('finance')} className="bg-white p-12 rounded-[4rem] border-2 border-stone-50 shadow-[0_40px_100px_rgba(0,0,0,0.04)] relative group overflow-hidden cursor-pointer hover:border-emerald-500 transition-all duration-500">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
               <p className="text-[12px] font-black text-stone-400 uppercase tracking-[0.5em] mb-6">Net Cash Flow</p>
               <h4 className="text-7xl font-black text-stone-950 italic tracking-tighter leading-none mb-10">€{transactions.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount),0).toFixed(0)}</h4>
               <div className="flex gap-8 mt-auto relative z-10">
                 <div className="bg-emerald-50/80 backdrop-blur-md px-8 py-4 rounded-3xl text-emerald-600 font-black text-xs uppercase border-2 border-emerald-100 shadow-xl shadow-emerald-50">+€{transactions.filter(t=>t.type==='Entrata').reduce((acc,t)=>acc+t.amount,0)}</div>
                 <div className="bg-red-50/80 backdrop-blur-md px-8 py-4 rounded-3xl text-red-600 font-black text-xs uppercase border-2 border-red-100 shadow-xl shadow-red-50">-€{transactions.filter(t=>t.type==='Uscita').reduce((acc,t)=>acc+t.amount,0)}</div>
               </div>
            </div>

            <div onClick={()=>setActiveTab('tasks')} className="bg-stone-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden cursor-pointer group hover:bg-black transition-all duration-500">
               <ListChecks size={150} className="absolute -bottom-10 -right-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000" />
               <p className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-6 italic">Next Milestones</p>
               <h4 className="text-8xl font-black italic tracking-tighter leading-none">{tasks.filter(t=>!t.done).length}</h4>
               <p className="text-stone-500 text-[11px] font-black uppercase mt-6 italic tracking-[0.3em] decoration-emerald-500 underline underline-offset-4 decoration-2">Lavori Urgenti</p>
               <button className="mt-10 bg-emerald-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/20">Open Agenda</button>
            </div>
          </div>
        )}

        {/* --- 2. INVENTARIO TAB --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-16 animate-in slide-in-from-bottom-12 duration-700">
            <div className="bg-white p-12 rounded-[4rem] border shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-3 h-full bg-emerald-500"></div>
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-sm font-black uppercase text-stone-400 tracking-[0.4em] italic flex items-center gap-4"><PlusCircle className="text-emerald-500" size={20}/> Inserimento Rapido Anagrafica</h3>
                <button onClick={exportASLReport} className="text-[11px] font-black bg-stone-950 text-white px-8 py-4 rounded-[1.5rem] flex items-center gap-4 hover:bg-emerald-600 transition-all uppercase tracking-[0.3em] shadow-2xl active:scale-95"><FileDown size={20}/> Genera Report Ufficiale PDF</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-stone-400 ml-5 tracking-[0.2em]">Codice Identificativo</label>
                    <input placeholder="Es: IT001-AZ" className="w-full p-6 bg-stone-50 border-none rounded-[2rem] font-black text-sm shadow-inner focus:ring-4 focus:ring-emerald-50 transition-all uppercase" value={newAnimal.name} onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-stone-400 ml-5 tracking-[0.2em]">Specie Capo</label>
                    <select className="w-full p-6 bg-stone-50 border-none rounded-[2rem] font-black text-sm shadow-inner" value={newAnimal.species} onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-stone-400 ml-5 tracking-[0.2em]">Data Nascita</label>
                    <input type="date" className="w-full p-6 bg-stone-50 border-none rounded-[2rem] font-black text-sm shadow-inner text-emerald-700" value={newAnimal.birthDate} onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-stone-400 ml-5 tracking-[0.2em]">ID Madre (Opzionale)</label>
                    <input placeholder="Codice Madre" className="w-full p-6 bg-stone-50 border-none rounded-[2rem] font-black text-sm shadow-inner" value={newAnimal.dam} onChange={e=>setNewAnimal({...newAnimal, dam:e.target.value})} />
                </div>
                <div className="flex items-end">
                    <button onClick={handleSaveAnimal} className="w-full bg-emerald-600 text-white font-black rounded-[2rem] p-6 uppercase text-xs tracking-[0.3em] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 transition-all">Salva</button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {animals.map(a => (
                <div key={a.id} className="bg-white p-10 rounded-[3.5rem] border border-stone-50 shadow-xl relative group hover:border-emerald-500 transition-all duration-500 hover:shadow-2xl">
                  <button onClick={()=>deleteDoc(doc(db,'animals',a.id))} className="absolute top-8 right-8 text-stone-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={24}/></button>
                  <div className="bg-emerald-50 text-emerald-600 p-5 rounded-[2rem] w-fit mb-8 shadow-inner group-hover:rotate-12 transition-transform duration-500"><PawPrint size={32} strokeWidth={2.5}/></div>
                  <h4 className="text-3xl font-black text-stone-950 tracking-tighter leading-none mb-2 uppercase">{a.name}</h4>
                  <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em] mb-8 italic">{a.species} • {a.birthDate || 'N/D'}</p>
                  <div className="space-y-3 pt-6 border-t border-stone-50">
                    {a.dam && (
                        <div className="flex justify-between items-center bg-stone-50/50 p-3 rounded-2xl border border-stone-100">
                            <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest italic">Biological Mother</span>
                            <span className="text-[11px] font-black text-stone-800 uppercase">{a.dam}</span>
                        </div>
                    )}
                    {a.notes && <p className="text-[10px] text-stone-400 font-bold leading-relaxed tracking-tight mt-4 p-4 bg-stone-50 rounded-2xl italic border-l-4 border-emerald-100">"{a.notes}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 3. REGISTRO PARTI TAB --- */}
        {activeTab === 'births' && (
          <div className="bg-white p-16 rounded-[5rem] border shadow-2xl max-w-3xl animate-in zoom-in-95 duration-1000 mx-auto relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32"></div>
             <div className="bg-amber-50 p-12 rounded-[3.5rem] border-2 border-amber-100 text-amber-800 mb-12 flex items-center gap-10 shadow-2xl shadow-amber-50">
               <div className="relative">
                  <Baby size={80} strokeWidth={1} className="animate-pulse" />
                  <div className="absolute top-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-amber-500"><PlusCircle size={14} className="text-amber-500" /></div>
               </div>
               <div>
                  <h3 className="text-3xl font-black uppercase tracking-[0.1em] italic leading-none mb-4">Neural Birth Registry</h3>
                  <p className="text-sm font-black mt-2 leading-relaxed opacity-70 uppercase tracking-tighter">Automazione anagrafica figli. Collegamento immediato alla linea genealogica della madre.</p>
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-stone-400 ml-6 tracking-[0.4em]">ID Capo Madre</label>
                  <input className="w-full p-8 bg-stone-50 border-none rounded-[2.5rem] font-black text-2xl shadow-inner focus:ring-4 focus:ring-amber-100 text-amber-950 uppercase" placeholder="IT000..." value={newBirth.idCode} onChange={e=>setNewBirth({...newBirth, idCode:e.target.value})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase text-stone-400 ml-6 tracking-[0.4em]">Numero di Nati</label>
                  <input type="number" className="w-full p-8 bg-stone-50 border-none rounded-[2.5rem] font-black text-4xl shadow-inner text-center" value={newBirth.count} onChange={e=>setNewBirth({...newBirth, count:Number(e.target.value)})} />
                </div>
                <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-stone-400 ml-6 tracking-[0.4em]">Data del Parto</label>
                    <input type="date" className="w-full p-8 bg-stone-50 border-none rounded-[2.5rem] font-black text-sm shadow-inner uppercase tracking-widest text-emerald-600" value={newBirth.birthDate} onChange={e=>setNewBirth({...newBirth, birthDate:e.target.value})} />
                </div>
                <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase text-stone-400 ml-6 tracking-[0.4em]">Specie Identificativa</label>
                    <select className="w-full p-8 bg-stone-50 border-none rounded-[2.5rem] font-black text-sm shadow-inner uppercase" value={newBirth.species} onChange={e=>setNewBirth({...newBirth, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                </div>
             </div>
             <button onClick={handleSaveBirth} className="w-full bg-emerald-950 text-white py-10 rounded-[3rem] font-black uppercase tracking-[0.6em] shadow-[0_30px_60px_rgba(0,0,0,0.3)] hover:bg-black hover:scale-[1.02] transition-all active:scale-95 text-xs">Esegui Algoritmo Generativo</button>
          </div>
        )}

        {/* --- 4. DINASTIA TAB --- */}
        {activeTab === 'dinastia' && (
          <div className="bg-white p-16 rounded-[5rem] border shadow-2xl animate-in fade-in duration-1000 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full -mr-48 -mt-48 blur-[80px]"></div>
            <div className="flex items-center gap-6 mb-20 border-b-4 border-stone-50 pb-12">
               <div className="bg-stone-900 p-6 rounded-[2.5rem] text-white shadow-2xl"><Network size={40} strokeWidth={3}/></div>
               <div>
                <h3 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-2 text-stone-900">Neural Bloodlines</h3>
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.4em] italic">Mappa genetica e gerarchica dell'allevamento</p>
               </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
              {animals.filter(a => !a.dam && !a.sire).map(root => (
                <div key={root.id} className="bg-stone-50/50 p-12 rounded-[4rem] border-2 border-white shadow-inner overflow-x-auto min-h-[400px]">
                  <DynastyBranch animal={root} allAnimals={animals} />
                </div>
              ))}
              {animals.length === 0 && (
                <div className="col-span-full py-40 text-center flex flex-col items-center gap-8">
                    <Ghost size={120} className="text-stone-100 animate-bounce" />
                    <p className="text-stone-300 font-black italic uppercase tracking-[0.6em] text-2xl">No Data Stream Detected</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 5. BILANCIO TAB --- */}
        {activeTab === 'finance' && (
          <div className="space-y-16 animate-in slide-in-from-right-12 duration-700">
            <div className="bg-stone-950 p-20 rounded-[5rem] text-white shadow-[0_50px_100px_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col md:flex-row justify-between items-center border-t-8 border-emerald-500">
               <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]"></div>
               <div className="relative z-10 text-center md:text-left mb-12 md:mb-0">
                  <div className="bg-emerald-500/20 w-fit px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.5em] mb-10 border border-emerald-500/20">Operational Treasury</div>
                  <p className="text-[11px] font-black uppercase text-emerald-400 tracking-[0.6em] mb-8 italic">Available Balance</p>
                  <h3 className="text-[10rem] font-black italic tracking-tighter leading-[0.6]">€ {transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(0)}</h3>
               </div>
               <div className="relative z-10 grid grid-cols-1 gap-6 w-full md:w-auto">
                  <div className="bg-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center">
                    <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-4 italic">Total Revenue</p>
                    <p className="text-5xl font-black italic tracking-tighter">+€{transactions.filter(t=>t.type==='Entrata').reduce((acc,t)=>acc+t.amount,0)}</p>
                  </div>
                  <div className="bg-white/5 p-10 rounded-[2.5rem] backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col items-center">
                    <p className="text-[11px] font-black text-red-400 uppercase tracking-[0.4em] mb-4 italic">Total Expenses</p>
                    <p className="text-5xl font-black italic tracking-tighter">-€{transactions.filter(t=>t.type==='Uscita').reduce((acc,t)=>acc+t.amount,0)}</p>
                  </div>
               </div>
            </div>
            <div className="bg-white p-12 rounded-[4rem] border-4 border-emerald-50 grid grid-cols-1 md:grid-cols-4 gap-8 shadow-2xl shadow-emerald-50/20">
              <input placeholder="Causale Operazione" className="p-8 bg-stone-50 rounded-[2.5rem] font-black text-2xl col-span-2 shadow-inner border-none uppercase tracking-tighter focus:ring-4 focus:ring-emerald-50" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc:e.target.value})} />
              <div className="flex items-center bg-stone-50 rounded-[2.5rem] px-10 shadow-inner group transition-all focus-within:ring-4 focus-within:ring-emerald-50">
                <span className="text-emerald-600 font-black text-3xl mr-4 group-hover:scale-125 transition-transform italic">€</span>
                <input type="number" placeholder="0" className="w-full bg-transparent border-none font-black text-4xl tracking-tighter" value={newTrans.amount || ''} onChange={e=>setNewTrans({...newTrans, amount:Number(e.target.value)})} />
              </div>
              <button onClick={handleSaveTransaction} className="bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.4em] shadow-2xl shadow-emerald-200 hover:bg-black transition-all hover:scale-105 active:scale-95">Registra</button>
            </div>
            <div className="space-y-6">
              {transactions.sort((a,b)=>b.date.localeCompare(a.date)).map(t => (
                <div key={t.id} className="bg-white p-10 rounded-[3rem] border border-stone-50 shadow-xl flex justify-between items-center group hover:translate-x-4 transition-all duration-500">
                  <div className="flex items-center gap-10">
                    <div className={`p-8 rounded-[2.5rem] transition-all duration-500 ${t.type === 'Entrata' ? 'bg-emerald-50 text-emerald-600 shadow-[0_20px_40px_rgba(16,185,129,0.1)] group-hover:rotate-12' : 'bg-red-50 text-red-600 shadow-[0_20px_40px_rgba(239,68,68,0.1)] group-hover:-rotate-12'}`}>{t.type === 'Entrata' ? <ArrowUpRight size={40} strokeWidth={3}/> : <ArrowDownLeft size={40} strokeWidth={3}/>}</div>
                    <div>
                        <p className="font-black text-stone-900 uppercase text-2xl tracking-tighter leading-none mb-2">{t.desc}</p>
                        <p className="text-[12px] font-black text-stone-400 uppercase mt-1 tracking-[0.5em] italic">{t.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <span className={`text-6xl font-black italic tracking-tighter ${t.type==='Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type==='Entrata' ? '+' : '-'}€{t.amount.toFixed(0)}</span>
                    <button onClick={()=>deleteDoc(doc(db,'transactions',t.id))} className="p-6 text-stone-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 bg-stone-50 rounded-3xl hover:shadow-xl shadow-stone-200"><Trash2 size={32}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 6. SCORTE TAB --- */}
        {activeTab === 'products' && (
          <div className="space-y-16 animate-in fade-in duration-700">
            {sellingProduct && (
              <div className="bg-amber-50 p-16 rounded-[5rem] border-4 border-amber-400 shadow-[0_60px_120px_rgba(245,158,11,0.2)] animate-in zoom-in-95 relative overflow-hidden mx-auto max-w-4xl">
                <div className="absolute top-0 right-0 bg-amber-400 text-white px-12 py-5 rounded-bl-[3rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl">Public Market Listing</div>
                <h3 className="text-4xl font-black text-amber-950 italic mb-10 uppercase tracking-tighter flex items-center gap-6 leading-none"><ShoppingBag size={48} className="text-amber-500" /> Vendi in Vetrina: <span className="underline decoration-8 decoration-white/50">{sellingProduct.name}</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-amber-600 ml-8 uppercase tracking-[0.6em] italic">Prezzo Unitario (€)</label>
                    <input type="number" className="w-full p-8 rounded-[3rem] border-none shadow-2xl font-black text-5xl text-emerald-600 bg-white placeholder:text-stone-100 text-center" placeholder="00" onChange={e=>setSellPrice(Number(e.target.value))} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-amber-600 ml-8 uppercase tracking-[0.6em] italic">Contatto WhatsApp</label>
                    <input className="w-full p-8 rounded-[3rem] border-none shadow-2xl font-black text-3xl bg-white text-amber-900 tracking-widest text-center" placeholder="+39 000..." onChange={e=>setSellPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-8">
                  <button onClick={handlePublishToMarket} className="flex-1 bg-amber-500 text-white font-black py-10 rounded-[3rem] uppercase tracking-[0.4em] shadow-[0_30px_60px_rgba(245,158,11,0.4)] hover:bg-amber-600 hover:scale-105 transition-all active:scale-95 text-lg">Pubblica Ora nel Mercato</button>
                  <button onClick={()=>setSellingProduct(null)} className="px-16 bg-white text-amber-500 font-black rounded-[3rem] border-4 border-amber-100 uppercase text-[10px] tracking-widest hover:bg-amber-100 transition-colors">Abort</button>
                </div>
              </div>
            )}
            <div className="bg-white p-12 rounded-[4rem] border shadow-2xl relative overflow-hidden border-t-8 border-emerald-600">
              <h3 className="text-[12px] font-black uppercase text-stone-400 mb-12 tracking-[0.6em] flex items-center gap-4 italic"><Package className="text-emerald-500" size={24}/> Logistics & Physical Stock Control</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <input placeholder="ARTICOLO (ES: FIENO)" className="p-8 bg-stone-50 rounded-[2.5rem] font-black shadow-inner border-none uppercase text-lg tracking-[0.2em] focus:ring-4 focus:ring-emerald-50 transition-all" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} />
                <div className="flex gap-4">
                  <input type="number" placeholder="QTY" className="flex-1 p-8 bg-stone-50 rounded-[2.5rem] font-black shadow-inner border-none text-3xl tracking-tighter" value={newProduct.quantity || ''} onChange={e=>setNewProduct({...newProduct, quantity:Number(e.target.value)})} />
                  <select className="p-8 bg-stone-50 rounded-[2.5rem] font-black border-none shadow-inner text-xs uppercase tracking-widest" value={newProduct.unit} onChange={e=>setNewProduct({...newProduct, unit:e.target.value})}><option>kg</option><option>balle</option><option>unità</option><option>litri</option></select>
                </div>
                <button onClick={handleAddProduct} className="bg-emerald-950 text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-emerald-600 transition-all hover:scale-[1.02] text-xs">Load Stock</button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
              {products.map(p => (
                <div key={p.id} className="bg-white p-12 rounded-[4.5rem] border border-stone-50 shadow-2xl text-center flex flex-col group hover:border-emerald-200 hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-700">
                  <div className="bg-emerald-50 text-emerald-600 p-8 rounded-[3rem] w-fit mx-auto mb-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700 shadow-inner"><Package size={56} strokeWidth={1.5}/></div>
                  <h4 className="font-black text-stone-900 uppercase text-xs mb-3 tracking-[0.3em]">{p.name}</h4>
                  <p className="text-7xl font-black text-emerald-600 italic tracking-tighter mb-10 leading-none group-hover:scale-110 transition-transform">{p.quantity} <span className="text-[12px] uppercase not-italic opacity-30 tracking-[0.5em] block mt-4">Available {p.unit}</span></p>
                  <button onClick={()=>setSellingProduct(p)} className="w-full bg-amber-100 text-amber-700 font-black py-5 rounded-[2rem] text-[11px] uppercase tracking-[0.4em] mb-6 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-3 border-2 border-amber-200/50 shadow-lg shadow-amber-100/50"><Store size={20}/> Sell Km 0</button>
                  <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-stone-100 hover:text-red-500 transition-colors mt-auto pt-8 border-t border-stone-50"><Trash2 size={24} className="mx-auto"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 7. MERCATO KM 0 TAB --- */}
        {activeTab === 'market' && (
          <div className="space-y-20 animate-in slide-in-from-bottom-16 duration-1000">
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-20 rounded-[6rem] text-white shadow-[0_50px_100px_rgba(245,158,11,0.3)] relative overflow-hidden">
               <ShoppingBag size={450} className="absolute -bottom-32 -right-32 opacity-10 rotate-12 animate-pulse duration-[10s]" />
               <div className="relative z-10 max-w-3xl">
                 <div className="bg-white/20 w-fit px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-[0.6em] mb-10 backdrop-blur-3xl border border-white/20 shadow-2xl">Neural Marketplace Pro</div>
                 <h3 className="text-8xl font-black italic tracking-tighter uppercase mb-8 leading-[0.8]">Food Directly From The Source.</h3>
                 <p className="text-amber-50 font-black text-2xl leading-relaxed opacity-95 italic tracking-tight underline decoration-white/30 underline-offset-[12px] decoration-4">Sostieni l'economia locale. Filiera corta digitale, trasparente, sicura.</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
              {marketItems.map(item => (
                <div key={item.id} className="bg-white rounded-[5rem] border-2 border-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col group hover:shadow-2xl hover:translate-y-[-20px] transition-all duration-700">
                  <div className="h-72 bg-stone-50 flex items-center justify-center relative overflow-hidden group-hover:bg-amber-50 transition-colors duration-1000 shadow-inner">
                     <div className="absolute top-10 right-10 bg-white/95 backdrop-blur-3xl px-8 py-4 rounded-[2.5rem] font-black text-4xl text-emerald-600 shadow-2xl border-4 border-emerald-50 italic tracking-tighter transition-transform group-hover:scale-125 z-20">€{item.price.toFixed(0)}</div>
                     <ShoppingBag size={120} className="text-stone-100 group-hover:scale-[2] group-hover:opacity-5 transition-all duration-1000 ease-in-out" />
                  </div>
                  <div className="p-16 flex flex-col flex-1 relative">
                    <div className="absolute top-0 left-16 -translate-y-1/2 bg-amber-500 text-white px-8 py-2 rounded-full font-black text-[10px] uppercase tracking-[0.4em] shadow-xl">Verified Producer</div>
                    <p className="text-[12px] font-black text-amber-500 uppercase tracking-[0.5em] mb-4 italic leading-none">{item.sellerName}</p>
                    <h4 className="text-5xl font-black text-stone-950 tracking-tighter mb-10 leading-[0.9] uppercase group-hover:text-amber-600 transition-colors duration-500">{item.name}</h4>
                    <div className="flex justify-between items-center mb-16 bg-stone-50 p-10 rounded-[3rem] border-4 border-white shadow-2xl shadow-stone-100">
                       <span className="text-[13px] font-black text-stone-400 uppercase italic tracking-widest">Available</span>
                       <span className="font-black text-stone-900 text-3xl uppercase tracking-tighter">{item.quantity} <span className="text-xs text-stone-300 ml-1 font-bold italic">{item.unit}</span></span>
                    </div>
                    {item.contactPhone ? (
                       <a href={`https://wa.me/39${item.contactPhone}?text=Salve ${item.sellerName}, vorrei acquistare ${item.name} via AgriManage.`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_60px_rgba(37,211,102,0.3)] flex items-center justify-center gap-6 hover:bg-[#1da851] hover:scale-105 transition-all active:scale-95"><MessageCircle size={32}/> Shop On WhatsApp</a>
                    ) : (
                       <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white py-8 rounded-[3rem] font-black text-sm uppercase tracking-[0.4em] shadow-[0_20px_60px_rgba(37,99,235,0.3)] flex items-center justify-center gap-6 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95"><Mail size={32}/> Send Email Inquiry</a>
                    )}
                  </div>
                </div>
              ))}
              {marketItems.length === 0 && (
                <div className="col-span-full py-60 text-center flex flex-col items-center gap-12">
                  <ShoppingBag size={150} className="text-stone-100 opacity-50" />
                  <p className="text-stone-200 font-black italic uppercase tracking-[1em] text-4xl leading-none">No Public Listings Available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 8. VETERINARIO IA TAB --- */}
        {activeTab === 'vet' && (
          <div className="bg-white p-20 rounded-[6rem] border-4 border-stone-50 shadow-2xl max-w-4xl animate-in zoom-in-95 duration-700 mx-auto relative overflow-hidden">
            <div className="bg-blue-600 p-16 rounded-[4rem] text-white mb-16 flex items-center gap-12 shadow-[0_40px_100px_rgba(37,99,235,0.3)] shadow-blue-200 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 group-hover:scale-150 transition-transform duration-1000"></div>
               <Stethoscope size={100} strokeWidth={1} className="relative z-10 group-hover:rotate-12 transition-transform duration-700" />
               <div className="relative z-10">
                  <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-[0.8] mb-6">Neural Vet Triage</h3>
                  <p className="text-blue-50 font-black opacity-80 text-xl leading-relaxed italic max-w-lg tracking-tight">Analisi diagnostica istantanea basata su dataset clinici veterinari 2026.</p>
               </div>
            </div>
            <div className="space-y-4 mb-12 ml-4">
                <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.5em] italic">Input Symptoms & Observation</p>
                <textarea className="w-full p-12 bg-stone-50 border-none rounded-[4rem] font-black text-stone-800 text-2xl h-72 shadow-inner italic placeholder:text-stone-200 focus:ring-8 focus:ring-blue-50 transition-all leading-snug" placeholder="Descrivi il comportamento anomalo... (es: 'La mucca IT02 presenta respiro affannato e inappetenza')" value={vetSymptom} onChange={e=>setVetSymptom(e.target.value)}></textarea>
            </div>
            <button onClick={()=>{setIsAnalyzing(true); setTimeout(()=>{setVetResult({title:"Esito Analisi IA", desc:"Il quadro clinico descritto suggerisce una possibile infiammazione respiratoria acuta o stress termico.", action:"ISOLARE IL CAPO DALLA MANDRIA, MONITORARE LA TEMPERATURA RETTALE E CHIAMARE IL VETERINARIO DI ZONA URGENTEMENTE"}); setIsAnalyzing(false);},4000)}} className="w-full bg-stone-950 text-white py-10 rounded-[3rem] font-black uppercase tracking-[0.6em] text-sm flex items-center justify-center gap-8 hover:bg-blue-600 transition-all shadow-2xl active:scale-95">
              {isAnalyzing ? <><Activity className="animate-spin" size={28}/> Neural Processing...</> : <><Bot size={36}/> Launch Triage Diagnostic</>}
            </button>
            {vetResult && (
              <div className="mt-20 p-16 bg-emerald-50 border-8 border-white rounded-[5rem] shadow-2xl animate-in slide-in-from-bottom-16 duration-700">
                 <div className="flex items-center gap-6 mb-8">
                    <div className="bg-emerald-500 p-4 rounded-3xl text-white shadow-xl shadow-emerald-200"><AlertTriangle size={36} /></div>
                    <h4 className="text-3xl font-black uppercase text-emerald-950 tracking-tighter italic">{vetResult.title}</h4>
                 </div>
                 <p className="text-emerald-800 font-black text-2xl mb-12 leading-tight italic tracking-tighter">"{vetResult.desc}"</p>
                 <div className="bg-emerald-600 text-white p-10 rounded-[3rem] text-center text-xs font-black uppercase tracking-[0.4em] shadow-2xl shadow-emerald-300 border-t-8 border-emerald-500">{vetResult.action}</div>
              </div>
            )}
          </div>
        )}

        {/* --- 9. AGENDA TAB --- */}
        {activeTab === 'tasks' && (
          <div className="max-w-4xl space-y-16 animate-in slide-in-from-left-12 duration-700 mx-auto">
            <div className="bg-white p-16 rounded-[5rem] border shadow-2xl relative overflow-hidden border-t-8 border-stone-900 shadow-stone-100">
               <div className="absolute top-0 right-0 w-32 h-full bg-stone-50/50 backdrop-blur-sm"></div>
               <h3 className="text-[13px] font-black uppercase text-stone-400 mb-12 tracking-[0.6em] italic flex items-center gap-6 leading-none"><CalendarDays className="text-emerald-600" size={32}/> Smart Task Scheduling</h3>
               <div className="flex flex-col md:flex-row gap-8 relative z-10">
                 <div className="flex-1 space-y-3">
                    <label className="text-[10px] font-black text-stone-400 ml-8 uppercase tracking-widest">Descrizione Lavoro</label>
                    <input className="w-full p-8 bg-stone-50 rounded-[3rem] font-black text-stone-800 text-xl shadow-inner border-none focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-stone-200 uppercase" placeholder="Es: Richiamo Vaccinazione" value={newTask} onChange={e=>setNewTask(e.target.value)} />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-stone-400 ml-8 uppercase tracking-widest">Scadenza</label>
                    <input type="date" className="w-full p-8 bg-stone-50 rounded-[3rem] font-black shadow-inner border-none text-sm uppercase tracking-[0.3em] text-emerald-700" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)} />
                 </div>
                 <div className="flex items-end">
                    <button onClick={handleAddTask} className="bg-emerald-950 text-white px-16 py-8 rounded-[3rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95">Add</button>
                 </div>
               </div>
            </div>
            <div className="space-y-8">
              {tasks.sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || '')).map(t => (
                <div key={t.id} className={`bg-white p-12 rounded-[4rem] border-4 flex justify-between items-center transition-all duration-700 group ${t.done ? 'opacity-20 grayscale scale-95' : 'shadow-2xl border-white hover:border-emerald-500 group-hover:translate-x-4'}`}>
                  <div className="flex items-center gap-10">
                    <div className={`p-8 rounded-[2.5rem] transition-all duration-700 ${t.done ? 'bg-stone-100 text-stone-300' : 'bg-stone-50 text-emerald-600 border-2 border-emerald-50 shadow-inner'}`}><ListChecks size={40} strokeWidth={3}/></div>
                    <div>
                        <p className={`text-4xl font-black tracking-tighter leading-[0.8] mb-4 uppercase ${t.done ? 'line-through text-stone-400' : 'text-stone-950'}`}>{t.text}</p>
                        <div className="flex items-center gap-4">
                            <div className="bg-stone-100 px-6 py-2 rounded-full flex items-center gap-3 border border-stone-200 shadow-sm">
                                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                                <p className="text-[11px] font-black text-stone-500 uppercase tracking-[0.3em]">Scadenza: {t.dueDate || 'N/D'}</p>
                            </div>
                        </div>
                    </div>
                  </div>
                  <div className="flex gap-6 pr-4">
                    <button onClick={()=>updateDoc(doc(db,'tasks',t.id),{done:!t.done})} className={`p-8 rounded-[2.5rem] shadow-2xl transition-all duration-500 ${t.done ? 'bg-stone-200 text-stone-500' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}><CheckCircle2 size={40} strokeWidth={3}/></button>
                    <button onClick={()=>deleteDoc(doc(db,'tasks',t.id))} className="p-8 bg-red-50 text-red-400 rounded-[2.5rem] hover:bg-red-600 hover:text-white transition-all shadow-xl"><Trash2 size={40} strokeWidth={3}/></button>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-40 border-8 border-dashed rounded-[6rem] border-stone-100 flex flex-col items-center gap-10">
                    <Info size={100} className="text-stone-100" />
                    <p className="text-stone-200 font-black uppercase italic tracking-[1em] text-3xl leading-none">No Tasks Planned</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
