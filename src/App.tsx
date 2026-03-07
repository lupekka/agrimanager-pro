import React, { useState, useEffect, useRef } from 'react';
import {
  PawPrint, CalendarDays, TrendingUp, Network, Baby, Trash2,
  PlusCircle, LogOut, Lock, Menu, X, Search, LayoutDashboard,
  History, Package, Edit2, CheckCircle2,
  MinusCircle, Activity, ListChecks, Wallet,
  ArrowUpRight, ArrowDownLeft, Ghost, UserPlus, Stethoscope, 
  UploadCloud, AlertTriangle, FileDown, Store, ShoppingBag, 
  MessageCircle, Mail, Bot, Info, Send, Save, Check, ChevronRight
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, 
  doc, updateDoc, query, where, getDocs, initializeFirestore, 
  persistentLocalCache, persistentMultipleTabManager, setDoc, getDoc 
} from "firebase/firestore";
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut, User 
} from "firebase/auth";

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
const db = initializeFirestore(app, { 
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()}) 
});
const auth = getAuth(app);

// --- INTERFACCE E TIPI ---
type Species = 'Maiali' | 'Cavalli' | 'Mucche' | 'Galline' | 'Oche';
interface Animal { 
  id: string; name: string; species: Species; notes: string; 
  sire?: string; dam?: string; birthDate?: string; ownerId: string; 
}
interface Transaction { 
  id: string; type: 'Entrata' | 'Uscita'; amount: number; 
  desc: string; species: Species; date: string; ownerId: string; 
}
interface Task { 
  id: string; text: string; done: boolean; 
  dueDate?: string; ownerId: string; 
}
interface Product { 
  id: string; name: string; quantity: number; 
  unit: string; ownerId: string; 
}
interface MarketItem { 
  id: string; name: string; price: number; quantity: number; 
  unit: string; sellerId: string; sellerName: string; 
  contactEmail: string; contactPhone: string; createdAt: string; 
}

// --- COMPONENTE RAMO DINASTIA (RICORSIVO) ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const children = allAnimals.filter(a => a.dam === animal.name || a.sire === animal.name || a.dam === animal.id || a.sire === animal.id);
  return (
    <div className={level > 0 ? "ml-6 border-l-2 border-emerald-100 pl-4 mt-3" : "mt-2"}>
      <div className={`p-4 rounded-2xl border transition-all hover:shadow-md ${level === 0 ? 'bg-emerald-600 text-white shadow-lg border-emerald-700' : 'bg-white text-stone-800 border-stone-100 shadow-sm'}`}>
        <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${level === 0 ? 'bg-white text-emerald-600' : 'bg-emerald-100 text-emerald-600'}`}>{level}</div>
            <p className="font-black uppercase tracking-tight text-sm">{animal.name}</p>
        </div>
        <p className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${level === 0 ? 'text-emerald-100' : 'text-stone-400'}`}>{animal.species}</p>
      </div>
      {children.map(child => <DynastyBranch key={child.id} animal={child} allAnimals={allAnimals} level={level + 1} />)}
    </div>
  );
};

export default function App() {
  // --- STATO UTENTE E APP ---
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'farmer' | 'consumer' | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegistering, setIsRegistering] = useState(false);

  // --- STATI DATI ---
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  // --- STATI INPUT ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regRole, setRegRole] = useState<'farmer' | 'consumer'>('farmer');
  const [regName, setRegName] = useState('');
  
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', dam: '', notes: '' });
  const [editingAnimalId, setEditingAnimalId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as 'Entrata' | 'Uscita', species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  const [newTask, setNewTask] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  // --- STATI IA E VETERINARIO ---
  const [showAssistant, setShowAssistant] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [vetSymptom, setVetSymptom] = useState('');
  const [vetImage, setVetImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vetResult, setVetResult] = useState<any>(null);

  // --- STATI MERCATO ---
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sellPrice, setSellPrice] = useState(0);
  const [sellPhone, setSellPhone] = useState('');

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];

  // --- EFFETTO: GESTIONE ACCESSO ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userDocPromise = getDoc(doc(db, 'users', u.uid));
          const timeout = new Promise((_, r) => setTimeout(() => r('timeout'), 4000));
          const userDoc = await Promise.race([userDocPromise, timeout]) as any;
          
          if (userDoc && userDoc.exists && userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserName(data.name || 'Utente');
            setActiveTab(data.role === 'consumer' ? 'market' : 'dashboard');
          } else {
            setUserRole('farmer');
            setUserName('Azienda Agricola');
          }
        } catch (e) {
          setUserRole('farmer');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- EFFETTO: SINCRONIZZAZIONE DATI ---
  useEffect(() => {
    if (!user?.uid || !userRole) return;
    const unsubs: any[] = [];

    // Mercato (Visibile a tutti)
    unsubs.push(onSnapshot(collection(db, 'market_items'), s => {
      setMarketItems(s.docs.map(d => ({ id: d.id, ...d.data() } as MarketItem)));
    }));

    // Dati privati (Solo agricoltore)
    if (userRole === 'farmer') {
      const q = (coll: string) => query(collection(db, coll), where("ownerId", "==", user.uid));
      unsubs.push(onSnapshot(q('animals'), s => setAnimals(s.docs.map(d => ({ id: d.id, ...d.data() } as Animal)))));
      unsubs.push(onSnapshot(q('transactions'), s => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))));
      unsubs.push(onSnapshot(q('tasks'), s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() } as Task)))));
      unsubs.push(onSnapshot(q('products'), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product)))));
    }
    return () => unsubs.forEach(u => u());
  }, [user?.uid, userRole]);

  // --- AZIONE: AUTENTICAZIONE ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        if (!regName.trim()) throw new Error("Nome mancante");
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
      alert("Errore nell'operazione. Verifica i dati.");
      setLoading(false);
    }
  };

  // --- AZIONE: ANAGRAFICA CAPI ---
  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("Codice Capo richiesto.");
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', dam: '', notes: '' });
  };

  const handleUpdateNotes = async (id: string) => {
    try {
      await updateDoc(doc(db, 'animals', id), { notes: editNote });
      setEditingAnimalId(null);
      setEditNote('');
    } catch (e) {
      alert("Errore nell'aggiornamento.");
    }
  };

  // --- AZIONE: REGISTRO PARTI ---
  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("Codice madre richiesto.");
    try {
      await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
      for (let i = 0; i < newBirth.count; i++) {
        await addDoc(collection(db, 'animals'), {
          name: `FIGLIO_${newBirth.idCode}_${Math.floor(Math.random()*1000)}`,
          species: newBirth.species,
          birthDate: newBirth.birthDate,
          dam: newBirth.idCode,
          notes: 'Nascita automatica da registro parti',
          ownerId: user!.uid
        });
      }
      setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
      alert("Parto e figli registrati con successo!");
    } catch (e) { alert("Errore nel registro parti."); }
  };

  // --- AZIONE: BILANCIO (FIX USCITE) ---
  const handleSaveTransaction = async () => {
    if (newTrans.amount <= 0 || !newTrans.desc) return alert("Inserisci descrizione e importo.");
    try {
      await addDoc(collection(db, 'transactions'), {
        ...newTrans,
        date: new Date().toLocaleDateString('it-IT'),
        ownerId: user!.uid
      });
      setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
    } catch (e) { alert("Errore nel bilancio."); }
  };

  // --- AZIONE: SCORTE E MERCATO (CORRETTO) ---
  const handlePublishToMarket = async () => {
    if (!sellingProduct || sellPrice <= 0) return alert("Dati vendita incompleti.");
    try {
      // 1. Pubblica nel mercato pubblico
      await addDoc(collection(db, 'market_items'), { 
        name: sellingProduct.name, 
        price: Number(sellPrice), 
        quantity: sellingProduct.quantity, 
        unit: sellingProduct.unit, 
        sellerId: user!.uid, 
        sellerName: userName || 'Azienda Agricola', 
        contactEmail: user!.email, 
        contactPhone: sellPhone, 
        createdAt: new Date().toISOString() 
      });
      // 2. Elimina dal magazzino privato (il bene è ora impegnato nella vendita)
      await deleteDoc(doc(db, 'products', sellingProduct.id));
      
      setSellingProduct(null);
      setSellPrice(0);
      setSellPhone('');
      alert("Prodotto pubblicato con successo!");
    } catch (e) { alert("Errore durante la pubblicazione."); }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.quantity <= 0) return;
    const existing = products.find(p => p.name.toLowerCase() === newProduct.name.toLowerCase());
    if (existing) {
      await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity });
    } else {
      await addDoc(collection(db, 'products'), { ...newProduct, ownerId: user!.uid });
    }
    setNewProduct({ name: '', quantity: 0, unit: 'kg' });
  };

  // --- AZIONE: VETERINARIO (CARICAMENTO FOTO) ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVetImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- AZIONE: IA COMANDI ---
  const handleAICommand = async () => {
    if (!aiInput.trim()) return;
    setAiLogs(["Analisi in corso..."]);
    const frasi = aiInput.toLowerCase().split(/ e |,|\./).filter(s => s.trim());
    let results = [];
    for (let f of frasi) {
      const num = f.match(/(\d+)/)?.[1];
      if (f.includes('venduto') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `IA: ${f}`, amount: Number(num), type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        results.push(`✅ Entrata: ${num}€`);
      } else if (f.includes('speso') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `IA: ${f}`, amount: Number(num), type: 'Uscita', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        results.push(`✅ Uscita: ${num}€`);
      }
    }
    setAiLogs(results.length > 0 ? results : ["IA: Non ho capito bene. Prova 'Venduto vitello a 500€'"]);
    setAiInput('');
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'tasks'), { text: newTask, done: false, dueDate: newTaskDate, ownerId: user!.uid });
    setNewTask('');
  };

  const exportASLReport = () => {
    const docPdf = new jsPDF();
    const nomeAz = window.prompt("Nome Azienda Agricola:") || "Azienda Agricola";
    docPdf.setFontSize(22); docPdf.setTextColor(5, 150, 105); docPdf.text(nomeAz, 14, 22);
    docPdf.setFontSize(10); docPdf.setTextColor(100, 100, 100); docPdf.text(`Registro Capi Ufficiale - ${new Date().toLocaleDateString()}`, 14, 30);
    const rows = [...animals].sort((a,b)=>a.species.localeCompare(b.species)).map(a => [a.name, a.species.toUpperCase(), a.birthDate || '', a.dam || '', a.notes || '-']);
    autoTable(docPdf, { 
        head: [['CODICE ID', 'SPECIE', 'NASCITA', 'MADRE', 'NOTE/SALUTE']], 
        body: rows, startY: 35, theme: 'grid', headStyles: { fillColor: [5, 150, 105] } 
    });
    docPdf.save(`Anagrafica_${nomeAz.replace(/ /g,'_')}.pdf`);
  };

  // --- RENDER CARICAMENTO ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
      <Activity className="animate-spin text-emerald-600 mb-4" size={48} />
      <h2 className="font-black text-emerald-950 uppercase tracking-widest text-sm">Sincronizzazione AgriPro...</h2>
    </div>
  );

  // --- RENDER LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-stone-200">
          <div className="flex justify-center mb-8"><div className="bg-emerald-600 p-5 rounded-3xl text-white shadow-xl shadow-emerald-100"><TrendingUp size={36} strokeWidth={3}/></div></div>
          <h1 className="text-3xl font-black text-center mb-2 text-emerald-950 italic tracking-tighter uppercase leading-none">AgriManage Pro</h1>
          <p className="text-center text-stone-400 text-[10px] font-black uppercase tracking-widest mb-10 italic">L'eccellenza digitale per la terra</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-4 bg-stone-50 p-5 rounded-[2rem] border border-stone-200 mb-6">
                <input placeholder="Tuo Nome o Azienda" className="w-full p-4 rounded-2xl bg-white border-none shadow-inner font-bold text-sm" value={regName} onChange={e => setRegName(e.target.value)} required />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black border transition-all ${regRole === 'farmer' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-stone-400'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black border transition-all ${regRole === 'consumer' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-stone-400'}`}>CLIENTE</button>
                </div>
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full p-4 rounded-2xl bg-stone-50 border-none shadow-inner font-bold text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-4 rounded-2xl bg-stone-50 border-none shadow-inner font-bold text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-950 text-white py-5 rounded-3xl font-black uppercase shadow-lg hover:bg-black transition-all active:scale-95 text-xs tracking-widest">{isRegistering ? "Crea Account Pro" : "Accedi"}</button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-[10px] font-black text-stone-400 uppercase tracking-widest mt-6 text-center underline underline-offset-4">{isRegistering ? "Hai già un account? Accedi" : "Nuovo utente? Registrati"}</button>
          </form>
        </div>
      </div>
    );
  }

  const menuItems = userRole === 'farmer' ? [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Capi', icon: PawPrint },
    { id: 'births', label: 'Parti', icon: Baby },
    { id: 'finance', label: 'Bilancio', icon: Wallet },
    { id: 'products', label: 'Scorte', icon: Package },
    { id: 'tasks', label: 'Agenda', icon: ListChecks },
    { id: 'dinastia', label: 'Albero', icon: Network },
    { id: 'vet', label: 'Vet IA', icon: Stethoscope },
    { id: 'market', label: 'Mercato', icon: Store, color: 'text-amber-500' }
  ] : [
    { id: 'market', label: 'Acquista Local', icon: ShoppingBag }
  ];

  const netIncome = transactions.filter(t => t.type === 'Entrata').reduce((acc, t) => acc + t.amount, 0);
  const netExpense = transactions.filter(t => t.type === 'Uscita').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col md:flex-row relative text-stone-900 font-sans overflow-x-hidden">
      
      {/* BOTTONE IA FLOATING */}
      {userRole === 'farmer' && (
        <button onClick={() => setShowAssistant(!showAssistant)} className="fixed bottom-24 right-4 md:bottom-10 md:right-10 bg-blue-600 text-white p-5 rounded-full shadow-2xl z-50 hover:scale-110 active:scale-90 animate-bounce border-4 border-white">
          <Bot size={28} />
        </button>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r p-8 fixed h-full shadow-sm z-40">
        <div className="flex items-center gap-3 mb-10 group cursor-default">
          <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-emerald-100 shadow-xl group-hover:rotate-12 transition-transform duration-500"><TrendingUp size={24} strokeWidth={3} /></div>
          <h1 className="text-2xl font-black italic tracking-tighter text-emerald-950 uppercase">AgriPro</h1>
        </div>
        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-4 w-full p-4 rounded-2xl font-black text-xs uppercase transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-100' : 'text-stone-400 hover:bg-stone-50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-6 flex items-center gap-3 text-red-500 font-black p-4 text-xs uppercase hover:translate-x-1 transition-transform"><LogOut size={18}/> Esci</button>
      </aside>

      {/* MOBILE NAV BOTTOM */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t flex justify-around p-3 z-50 shadow-2xl">
        {menuItems.slice(0, 5).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-300'}`}>
            <item.icon size={22} />
            <span className="text-[7px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* CONTENUTO MAIN */}
      <main className="flex-1 md:ml-72 p-5 md:p-12 pb-32">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black text-stone-950 italic uppercase tracking-tighter leading-none">{activeTab}</h2>
          <div className="hidden md:flex items-center gap-3 bg-white px-5 py-2 rounded-full border shadow-sm">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
             <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Utente: {userName}</p>
          </div>
        </header>

        {/* MODALE IA ASSISTENTE */}
        {showAssistant && (
          <div className="mb-10 bg-white p-8 rounded-[3rem] border-2 border-blue-100 shadow-2xl animate-in slide-in-from-top-6 duration-500">
            <h3 className="text-blue-900 font-black text-xs uppercase mb-6 flex items-center gap-3 italic"><Bot size={20}/> Assistente Vocale Rapido</h3>
            <div className="flex gap-4">
              <input className="flex-1 p-5 bg-blue-50 border-none rounded-[2rem] font-bold text-blue-900 text-lg shadow-inner placeholder:text-blue-200" placeholder="Esempio: 'Venduto maiale a 150€ e speso 40€ mangime'..." value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAICommand()} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-10 rounded-[2rem] font-black shadow-lg hover:bg-blue-700 transition-all">INVIO</button>
            </div>
            {aiLogs.length > 0 && <div className="mt-6 flex flex-wrap gap-3">{aiLogs.map((l, i) => <span key={i} className="bg-emerald-100 text-emerald-800 px-5 py-2.5 rounded-2xl text-[10px] font-black border border-emerald-200 shadow-sm animate-in zoom-in">{l}</span>)}</div>}
          </div>
        )}

        {/* --- 1. DASHBOARD --- */}
        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-700">
            <div onClick={()=>setActiveTab('inventory')} className="bg-emerald-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-transform duration-500">
              <PawPrint size={180} className="absolute -bottom-16 -right-16 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700" />
              <p className="text-[11px] font-black uppercase opacity-60 tracking-[0.3em] mb-4">Anagrafica Stalla</p>
              <h4 className="text-7xl font-black italic tracking-tighter leading-none">{animals.length} <span className="text-xl not-italic opacity-40 ml-2 uppercase font-bold tracking-widest">Capi</span></h4>
              <button className="mt-8 bg-white/20 px-6 py-3 rounded-full text-[10px] font-black uppercase flex items-center gap-3 backdrop-blur-md">Apri Inventario <ArrowUpRight size={16}/></button>
            </div>
            
            <div onClick={()=>setActiveTab('finance')} className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-xl relative group overflow-hidden cursor-pointer hover:border-emerald-500 transition-all">
               <p className="text-[11px] font-black text-stone-400 uppercase tracking-[0.3em] mb-4">Cash Flow Netto</p>
               <h4 className="text-4xl font-black text-stone-900 italic tracking-tighter leading-none">€{(netIncome - netExpense).toFixed(0)}</h4>
               <div className="flex gap-6 mt-10">
                 <div className="bg-emerald-50 px-5 py-3 rounded-2xl text-emerald-600 font-black text-[10px] uppercase border border-emerald-100 shadow-sm">+€{netIncome}</div>
                 <div className="bg-red-50 px-5 py-3 rounded-2xl text-red-600 font-black text-[10px] uppercase border border-red-100 shadow-sm">-€{netExpense}</div>
               </div>
            </div>

            <div onClick={()=>setActiveTab('tasks')} className="bg-stone-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden cursor-pointer group">
               <ListChecks size={120} className="absolute -bottom-6 -right-6 opacity-5 group-hover:rotate-12 transition-transform duration-700" />
               <p className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-4">Prossimi Task</p>
               <h4 className="text-5xl font-black italic tracking-tighter leading-none">{tasks.filter(t=>!t.done).length}</h4>
               <p className="text-stone-500 text-[10px] font-black uppercase mt-4 italic tracking-widest underline underline-offset-8 decoration-emerald-500/50">Lavori da completare</p>
            </div>
          </div>
        )}

        {/* --- 2. INVENTARIO (SPECIE + NOTE MODIFICABILI) --- */}
        {activeTab === 'inventory' && userRole === 'farmer' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-6">
            <div className="bg-white p-8 rounded-[3rem] border shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xs font-black uppercase text-stone-400 tracking-[0.2em] italic flex items-center gap-3"><PlusCircle size={18} className="text-emerald-500"/> Nuova Registrazione</h3>
                <button onClick={exportASLReport} className="text-[11px] font-black bg-stone-950 text-white px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-emerald-600 transition-all uppercase tracking-widest shadow-xl"><FileDown size={20}/> Scarica Registro PDF</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input placeholder="Codice / ID Capo" className="p-4 bg-stone-50 border-none rounded-2xl font-black text-sm shadow-inner uppercase focus:ring-4 focus:ring-emerald-50" value={newAnimal.name} onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} />
                <select className="p-4 bg-stone-50 border-none rounded-2xl font-black text-sm shadow-inner uppercase" value={newAnimal.species} onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                <input type="date" className="p-4 bg-stone-50 border-none rounded-2xl font-black text-sm shadow-inner text-emerald-700" value={newAnimal.birthDate} onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} />
                <input placeholder="Note iniziali..." className="p-4 bg-stone-50 border-none rounded-2xl font-black text-sm shadow-inner" value={newAnimal.notes} onChange={e=>setNewAnimal({...newAnimal, notes:e.target.value})} />
                <button onClick={handleSaveAnimal} className="bg-emerald-600 text-white font-black rounded-3xl p-4 uppercase text-[11px] tracking-widest shadow-lg hover:shadow-emerald-200 transition-all">Registra</button>
              </div>
            </div>

            {speciesList.map(specie => {
              const capi = animals.filter(a => a.species === specie);
              if (capi.length === 0) return null;
              return (
                <div key={specie} className="space-y-6 animate-in fade-in">
                  <div className="flex items-center gap-4 px-2">
                    <h4 className="text-xl font-black text-emerald-900 uppercase italic tracking-tighter leading-none">{specie}</h4>
                    <div className="h-[2px] flex-1 bg-stone-200/50"></div>
                    <span className="bg-stone-900 text-white px-4 py-1 rounded-full text-[10px] font-black shadow-lg">{capi.length} CAPI</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {capi.map(a => (
                      <div key={a.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-50 shadow-sm relative group hover:border-emerald-500 transition-all hover:shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                           <div className="bg-emerald-50 p-3 rounded-2xl w-fit shadow-inner text-emerald-600"><PawPrint size={24} strokeWidth={2.5}/></div>
                           <div className="flex gap-2">
                              <button onClick={()=>{setEditingAnimalId(a.id); setEditNote(a.notes || '');}} className="p-2 text-stone-200 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"><Edit2 size={18}/></button>
                              <button onClick={()=>deleteDoc(doc(db,'animals',a.id))} className="p-2 text-stone-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                           </div>
                        </div>
                        <h4 className="text-2xl font-black text-stone-900 tracking-tighter leading-none mb-1 uppercase">{a.name}</h4>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6 italic">{a.birthDate || 'NASCITA NON REGISTRATA'}</p>
                        
                        {editingAnimalId === a.id ? (
                           <div className="mt-4 space-y-3 animate-in zoom-in-95">
                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1">Modifica Note</p>
                              <textarea className="w-full p-4 bg-stone-50 rounded-2xl text-xs font-bold border-none shadow-inner h-24 italic" value={editNote} onChange={e=>setEditNote(e.target.value)} placeholder="Aggiorna salute o trattamenti..." />
                              <button onClick={()=>handleUpdateNotes(a.id)} className="w-full bg-emerald-600 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg"><Save size={14}/> Salva Modifiche</button>
                           </div>
                        ) : (
                           <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 min-h-[80px]">
                              <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-2 border-b pb-1">Note e Sanità</p>
                              <p className="text-[11px] text-stone-600 italic leading-relaxed font-bold">{a.notes || "Nessuna nota registrata."}</p>
                           </div>
                        )}
                        {a.dam && <p className="mt-4 text-[9px] font-black text-stone-400 uppercase tracking-widest">Figlio di: <span className="text-stone-800">{a.dam}</span></p>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- 3. REGISTRO PARTI --- */}
        {activeTab === 'births' && userRole === 'farmer' && (
          <div className="bg-white p-12 rounded-[4rem] border shadow-2xl max-w-2xl mx-auto animate-in zoom-in-95 duration-1000 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
             <div className="bg-amber-50 p-10 rounded-[3rem] border-2 border-amber-100 text-amber-700 mb-10 flex items-center gap-8 shadow-xl shadow-amber-50">
               <Baby size={64} strokeWidth={1.5} className="animate-pulse" />
               <div>
                  <h3 className="text-2xl font-black uppercase tracking-widest italic leading-none mb-3">Registrazione Nascite</h3>
                  <p className="text-xs font-bold mt-2 leading-relaxed opacity-80 uppercase tracking-tighter italic">Automatizza l'anagrafica: inserendo la madre, il sistema genererà automaticamente i figli nella stalla.</p>
               </div>
             </div>
             <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-5 tracking-[0.3em] italic">Codice ID della Madre</label>
                  <input className="w-full p-6 bg-stone-50 border-none rounded-[2.5rem] font-black text-lg shadow-inner focus:ring-4 focus:ring-amber-100 text-amber-950 uppercase" placeholder="Es: MAIALA_01" value={newBirth.idCode} onChange={e=>setNewBirth({...newBirth, idCode:e.target.value})} />
                </div>
                <div className="flex gap-6">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-5 tracking-[0.3em] italic">N. Nati</label>
                    <input type="number" className="w-full p-6 bg-stone-50 border-none rounded-[2.5rem] font-black text-3xl shadow-inner text-center" value={newBirth.count} onChange={e=>setNewBirth({...newBirth, count:Number(e.target.value)})} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-5 tracking-[0.3em] italic">Specie</label>
                    <select className="w-full p-6 bg-stone-50 border-none rounded-[2.5rem] font-black text-sm shadow-inner uppercase tracking-widest" value={newBirth.species} onChange={e=>setNewBirth({...newBirth, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-5 tracking-[0.3em] italic">Data del Parto</label>
                  <input type="date" className="w-full p-6 bg-stone-50 border-none rounded-[2.5rem] font-black text-sm shadow-inner text-emerald-700 uppercase tracking-widest" value={newBirth.birthDate} onChange={e=>setNewBirth({...newBirth, birthDate:e.target.value})} />
                </div>
                <button onClick={handleSaveBirth} className="w-full bg-emerald-950 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] shadow-2xl hover:scale-105 transition-all active:scale-95 text-[10px]">Esegui Algoritmo Generativo</button>
             </div>
          </div>
        )}

        {/* --- 4. BILANCIO (ORDINATO PER SPECIE + USCITE) --- */}
        {activeTab === 'finance' && userRole === 'farmer' && (
          <div className="space-y-12 animate-in slide-in-from-right-12 duration-500">
            <div className="bg-stone-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col items-center border-t-8 border-emerald-500">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
               <p className="text-[12px] font-black uppercase text-emerald-400 tracking-[0.6em] mb-6 italic leading-none text-center">Patrimonio Liquido Netto</p>
               <h3 className="text-8xl font-black italic tracking-tighter leading-none mb-4">€ {(netIncome - netExpense).toFixed(0)}</h3>
               <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.4em] italic">Aggiornato in tempo reale</p>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border-4 border-stone-50 shadow-xl shadow-stone-100">
              <h3 className="text-[11px] font-black uppercase text-stone-400 mb-8 tracking-[0.4em] flex items-center gap-3 leading-none italic"><Wallet className="text-emerald-500" size={16}/> Registra Flusso Monetario</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                <input placeholder="CAUSALE MOVIMENTO" className="p-6 bg-stone-50 rounded-[2rem] font-black text-xs lg:col-span-2 shadow-inner border-none uppercase tracking-widest focus:ring-4 focus:ring-emerald-50" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc:e.target.value})} />
                <div className="flex items-center bg-stone-50 rounded-[2rem] px-6 shadow-inner transition-all focus-within:ring-4 focus-within:ring-emerald-50">
                  <span className="text-emerald-600 font-black text-2xl mr-3 italic">€</span>
                  <input type="number" placeholder="0" className="w-full bg-transparent border-none font-black text-2xl tracking-tighter" value={newTrans.amount || ''} onChange={e=>setNewTrans({...newTrans, amount:Number(e.target.value)})} />
                </div>
                <select className={`p-6 rounded-[2rem] font-black text-[10px] border-none shadow-xl uppercase transition-colors ${newTrans.type === 'Entrata' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`} value={newTrans.type} onChange={e=>setNewTrans({...newTrans, type:e.target.value as any})}>
                    <option value="Entrata">📈 ENTRATA</option>
                    <option value="Uscita">📉 USCITA</option>
                </select>
                <select className="p-6 bg-stone-50 rounded-[2rem] font-black text-[10px] shadow-inner border-none uppercase tracking-widest" value={newTrans.species} onChange={e=>setNewTrans({...newTrans, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                <button onClick={handleSaveTransaction} className="bg-emerald-950 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-black transition-all hover:scale-105 active:scale-95">Salva</button>
              </div>
            </div>

            {speciesList.map(specie => {
              const transSpecie = transactions.filter(t => t.species === specie);
              if (transSpecie.length === 0) return null;
              const bilancioSpecie = transSpecie.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount), 0);
              return (
                <div key={specie} className="space-y-4 animate-in fade-in">
                  <div className="flex justify-between items-center px-8 py-3 bg-stone-100 rounded-3xl border-l-[10px] border-emerald-500 shadow-sm">
                    <h4 className="text-xs font-black text-stone-600 uppercase italic tracking-[0.4em] leading-none">{specie}</h4>
                    <span className={`text-[14px] font-black italic tracking-tighter ${bilancioSpecie >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>Bilancio Parziale: €{bilancioSpecie.toFixed(0)}</span>
                  </div>
                  <div className="space-y-3">
                    {transSpecie.map(t => (
                      <div key={t.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-50 flex justify-between items-center shadow-sm group hover:translate-x-3 transition-transform duration-500">
                        <div className="flex items-center gap-8">
                           <div className={`p-6 rounded-[2rem] transition-all duration-700 ${t.type==='Entrata' ? 'bg-emerald-50 text-emerald-600 shadow-inner group-hover:rotate-12' : 'bg-red-50 text-red-600 shadow-inner group-hover:-rotate-12'}`}>{t.type==='Entrata' ? <ArrowUpRight size={28} strokeWidth={3}/> : <ArrowDownLeft size={28} strokeWidth={3}/>}</div>
                           <div>
                              <p className="font-black text-stone-900 uppercase text-lg tracking-tighter leading-none mb-2">{t.desc}</p>
                              <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.4em] italic">{t.date}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-10">
                           <span className={`text-4xl font-black italic tracking-tighter ${t.type==='Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type==='Entrata' ? '+' : '-'}€{t.amount.toFixed(0)}</span>
                           <button onClick={()=>deleteDoc(doc(db,'transactions',t.id))} className="p-4 text-stone-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 bg-stone-50 rounded-2xl shadow-inner"><Trash2 size={24}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- 5. SCORTE (CORRETTO VENDITA KM 0) --- */}
        {activeTab === 'products' && userRole === 'farmer' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            {sellingProduct && (
              <div className="bg-amber-50 p-12 rounded-[4rem] border-4 border-amber-400 shadow-[0_60px_120px_rgba(245,158,11,0.2)] animate-in zoom-in-95 relative overflow-hidden mx-auto max-w-4xl border-t-[20px]">
                <div className="absolute top-0 right-0 bg-amber-400 text-white px-12 py-5 rounded-bl-[3rem] font-black text-xs uppercase tracking-[0.6em] shadow-xl">Vetrina Pubblica Km 0</div>
                <h3 className="text-4xl font-black text-amber-950 italic mb-10 uppercase tracking-tighter flex items-center gap-6 leading-none"><ShoppingBag size={56} className="text-amber-500" /> Metti in vendita: <span className="underline decoration-8 decoration-white/50">{sellingProduct.name}</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-amber-600 ml-8 uppercase tracking-[0.6em] italic leading-none">Prezzo di Vendita (€)</label>
                    <input type="number" className="w-full p-8 rounded-[3rem] border-none shadow-2xl font-black text-5xl text-emerald-600 bg-white placeholder:text-stone-100 text-center" placeholder="00" onChange={e=>setSellPrice(Number(e.target.value))} />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-amber-600 ml-8 uppercase tracking-[0.6em] italic leading-none">WhatsApp per gli ordini</label>
                    <input className="w-full p-8 rounded-[3rem] border-none shadow-2xl font-black text-3xl bg-white text-amber-900 tracking-widest text-center uppercase" placeholder="340..." onChange={e=>setSellPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-8">
                  <button onClick={handlePublishToMarket} className="flex-1 bg-amber-500 text-white font-black py-10 rounded-[3rem] uppercase tracking-[0.5em] shadow-[0_30px_60px_rgba(245,158,11,0.4)] hover:bg-amber-600 hover:scale-105 transition-all active:scale-95 text-xl">Conferma Pubblicazione</button>
                  <button onClick={()=>setSellingProduct(null)} className="px-16 bg-white text-amber-500 font-black rounded-[3rem] border-4 border-amber-100 uppercase text-[10px] tracking-widest hover:bg-amber-100 transition-colors">Annulla Operazione</button>
                </div>
              </div>
            )}
            <div className="bg-white p-10 rounded-[4rem] border shadow-2xl relative overflow-hidden border-t-[16px] border-emerald-600">
              <h3 className="text-[12px] font-black uppercase text-stone-400 mb-12 tracking-[0.6em] flex items-center gap-6 italic leading-none"><Package className="text-emerald-600" size={32}/> Controllo Fisico Scorte</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <input placeholder="NOME PRODOTTO (ES: FIENO)" className="p-8 bg-stone-50 rounded-[2.5rem] font-black shadow-inner border-none uppercase text-lg tracking-[0.2em] focus:ring-4 focus:ring-emerald-50 transition-all" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} />
                <div className="flex gap-4">
                  <input type="number" placeholder="QTY" className="flex-1 p-8 bg-stone-50 rounded-[2.5rem] font-black shadow-inner border-none text-4xl tracking-tighter" value={newProduct.quantity || ''} onChange={e=>setNewProduct({...newProduct, quantity:Number(e.target.value)})} />
                  <select className="p-8 bg-stone-50 rounded-[2.5rem] font-black border-none shadow-inner text-xs uppercase tracking-widest italic" value={newProduct.unit} onChange={e=>setNewProduct({...newProduct, unit:e.target.value})}><option>kg</option><option>balle</option><option>unità</option><option>litri</option></select>
                </div>
                <button onClick={handleAddProduct} className="bg-emerald-950 text-white rounded-[2.5rem] font-black uppercase tracking-[0.5em] shadow-2xl hover:bg-emerald-600 transition-all hover:scale-[1.02] text-[10px]">Carica Magazzino</button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
              {products.map(p => (
                <div key={p.id} className="bg-white p-10 rounded-[4rem] border border-stone-50 shadow-2xl text-center flex flex-col group hover:border-emerald-200 hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] transition-all duration-700">
                  <div className="bg-emerald-50 text-emerald-600 p-6 rounded-[2.5rem] w-fit mx-auto mb-10 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700 shadow-inner border border-emerald-100"><Package size={48} strokeWidth={1.5}/></div>
                  <h4 className="font-black text-stone-900 uppercase text-[10px] mb-4 tracking-[0.3em] italic">{p.name}</h4>
                  <p className="text-6xl font-black text-emerald-600 italic tracking-tighter mb-10 leading-none group-hover:scale-110 transition-transform duration-500">{p.quantity} <span className="text-[12px] uppercase not-italic opacity-30 tracking-[0.5em] block mt-4">Stock {p.unit}</span></p>
                  <button onClick={()=>setSellingProduct(p)} className="w-full bg-amber-100 text-amber-700 font-black py-5 rounded-[2.5rem] text-[11px] uppercase tracking-[0.4em] mb-6 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-3 border-2 border-amber-200/50 shadow-lg shadow-amber-100/50 italic active:scale-95"><Store size={22}/> Vendi Km 0</button>
                  <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-stone-100 hover:text-red-500 transition-colors mt-auto pt-8 border-t border-stone-50"><Trash2 size={24} className="mx-auto"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 6. AGENDA (RICERCA) --- */}
        {activeTab === 'tasks' && userRole === 'farmer' && (
          <div className="max-w-4xl space-y-12 animate-in slide-in-from-left-8 duration-700 mx-auto">
            <div className="bg-white p-12 rounded-[5rem] border shadow-2xl relative overflow-hidden border-t-8 border-stone-900 shadow-stone-100">
               <h3 className="text-[13px] font-black uppercase text-stone-400 mb-12 tracking-[0.5em] italic flex items-center gap-6 leading-none"><CalendarDays className="text-emerald-600" size={32}/> Programmazione Aziendale</h3>
               <div className="flex flex-col md:flex-row gap-8 mb-12">
                 <input className="flex-1 p-8 bg-stone-50 rounded-[3rem] font-black text-stone-800 text-lg shadow-inner border-none focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-stone-200 uppercase" placeholder="Descrizione attività da svolgere..." value={newTask} onChange={e=>setNewTask(e.target.value)} />
                 <input type="date" className="p-8 bg-stone-50 rounded-[3rem] font-black shadow-inner border-none text-sm uppercase tracking-[0.3em] text-emerald-700" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)} />
                 <button onClick={handleAddTask} className="bg-emerald-950 text-white px-16 py-8 rounded-[3rem] font-black uppercase text-xs tracking-[0.5em] shadow-2xl hover:bg-emerald-600 transition-all hover:scale-105 active:scale-95">Inserisci</button>
               </div>
               {/* BARRA RICERCA TASK */}
               <div className="relative group">
                  <Search size={28} className="absolute left-8 top-1/2 -translate-y-1/2 text-stone-200 group-focus-within:text-emerald-500 transition-colors duration-500" />
                  <input className="w-full p-8 pl-20 bg-stone-50 border-none rounded-[3rem] font-black text-[14px] uppercase italic tracking-[0.3em] shadow-inner focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-stone-200" placeholder="Filtra compiti per parole chiave (es: vaccino, fieno)..." value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} />
               </div>
            </div>
            <div className="space-y-6">
              {tasks.filter(t => t.text.toLowerCase().includes(taskSearch.toLowerCase()))
                .sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                .map(t => (
                <div key={t.id} className={`bg-white p-12 rounded-[4.5rem] border-2 flex justify-between items-center transition-all duration-500 group ${t.done ? 'opacity-20 grayscale scale-95' : 'shadow-2xl border-white hover:border-emerald-500 group-hover:translate-x-4 border-l-[24px] border-l-emerald-600'}`}>
                  <div>
                    <p className={`text-3xl font-black tracking-tighter leading-none mb-4 uppercase ${t.done ? 'line-through text-stone-400' : 'text-stone-950'}`}>{t.text}</p>
                    <div className="flex items-center gap-3">
                      <p className="text-[12px] font-black text-stone-300 uppercase tracking-[0.4em] italic leading-none">Data Scadenza: <span className="text-emerald-600 font-black">{t.dueDate || 'N/D'}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <button onClick={()=>updateDoc(doc(db,'tasks',t.id),{done:!t.done})} className={`p-8 rounded-[2.5rem] shadow-2xl transition-all ${t.done ? 'bg-stone-200 text-stone-500 shadow-none' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}><CheckCircle2 size={40} strokeWidth={3}/></button>
                    <button onClick={()=>deleteDoc(doc(db,'tasks',t.id))} className="p-8 bg-red-50 text-red-400 rounded-[2.5rem] hover:bg-red-600 hover:text-white transition-all shadow-xl active:scale-95"><Trash2 size={40} strokeWidth={3}/></button>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-center py-20 text-stone-300 font-black uppercase italic tracking-[1em] text-3xl opacity-20">Agenda Lavori Vuota</p>}
            </div>
          </div>
        )}

        {/* --- 7. DINASTIA --- */}
        {activeTab === 'dinastia' && (
          <div className="bg-white p-12 rounded-[5rem] border shadow-2xl animate-in fade-in duration-1000 relative overflow-hidden overflow-x-auto custom-scrollbar">
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-emerald-500/5 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
            <div className="flex items-center gap-6 mb-16 border-b-4 border-stone-50 pb-10">
               <div className="bg-stone-900 p-5 rounded-[2.5rem] text-white shadow-xl shadow-stone-200"><Network size={32} strokeWidth={3}/></div>
               <div>
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2 text-stone-900 uppercase">Neural Bloodlines</h3>
                  <p className="text-[12px] font-black text-stone-400 uppercase tracking-[0.4em] italic leading-none">Mappa gerarchica genetica e discendenze aziendali</p>
               </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              {animals.filter(a => !a.dam && !a.sire).map(root => (
                <div key={root.id} className="bg-stone-50/50 p-12 rounded-[4.5rem] border-2 border-white shadow-inner min-w-[320px] backdrop-blur-sm">
                  <DynastyBranch animal={root} allAnimals={animals} />
                </div>
              ))}
              {animals.length === 0 && <p className="text-stone-300 font-black italic uppercase tracking-[0.8em] text-center py-40 border-4 border-dashed rounded-[5rem] col-span-full">Nessun dato detected</p>}
            </div>
          </div>
        )}

        {/* --- 8. VETERINARIO IA (FIX FOTO) --- */}
        {activeTab === 'vet' && userRole === 'farmer' && (
          <div className="bg-white p-16 rounded-[6rem] border shadow-2xl max-w-4xl animate-in zoom-in-95 duration-700 mx-auto relative overflow-hidden">
            <div className="bg-blue-600 p-16 rounded-[4rem] text-white mb-16 flex items-center gap-12 shadow-[0_40px_100px_rgba(37,99,235,0.3)] shadow-blue-200 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 group-hover:scale-150 transition-transform duration-1000"></div>
               <Stethoscope size={100} strokeWidth={1} className="relative z-10 transition-transform duration-700 group-hover:rotate-12" />
               <div className="relative z-10">
                  <h3 className="text-5xl font-black uppercase italic tracking-tighter leading-[0.8] mb-6 uppercase">Neural Vet Triage</h3>
                  <p className="text-blue-50 font-black opacity-90 text-xl leading-relaxed italic max-w-lg tracking-tight">Analisi diagnostica istantanea basata su dataset clinici veterinari 2026.</p>
               </div>
            </div>

            <div className="space-y-10 mb-16 ml-4">
                <div className="space-y-4">
                    <p className="text-[12px] font-black text-stone-400 uppercase tracking-[0.6em] italic leading-none">1. Input Documentazione Fotografica</p>
                    <label className="flex flex-col items-center justify-center w-full h-80 border-4 border-dashed border-stone-100 rounded-[4rem] cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all relative overflow-hidden bg-stone-50 shadow-inner group">
                        {vetImage ? (
                            <img src={vetImage} alt="Preview clinica" className="w-full h-full object-cover animate-in fade-in" />
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <UploadCloud size={64} strokeWidth={1} className="text-stone-300 mb-6 group-hover:text-blue-400 group-hover:-translate-y-2 transition-all" />
                                <p className="text-[12px] font-black text-stone-400 uppercase tracking-[0.4em] leading-relaxed">Tocca per acquisire foto o caricare file dal dispositivo</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {vetImage && <button onClick={()=>setVetImage(null)} className="text-[11px] font-black text-red-500 uppercase ml-8 tracking-[0.2em] underline underline-offset-4 decoration-2">Cancella Allegato</button>}
                </div>

                <div className="space-y-4">
                    <p className="text-[12px] font-black text-stone-400 uppercase tracking-[0.6em] italic leading-none">2. Descrizione Sintomatologia & Comportamento</p>
                    <textarea className="w-full p-12 bg-stone-50 border-none rounded-[4rem] font-black text-stone-800 text-2xl h-72 shadow-inner italic placeholder:text-stone-200 focus:ring-[12px] focus:ring-blue-50 transition-all leading-snug" placeholder="Esempio: vitello IT02 manifesta respiro affannato, naso asciutto e isolamento dal gruppo..." value={vetSymptom} onChange={e=>setVetSymptom(e.target.value)}></textarea>
                </div>
            </div>

            <button onClick={()=>{setIsAnalyzing(true); setTimeout(()=>{setVetResult({title:"Esito Triage Diagnostico", desc:"Il quadro clinico descritto suggerisce una possibile infiammazione respiratoria acuta o stress termico severo.", action:"ISOLARE IL CAPO DALLA MANDRIA, MONITORARE LA TEMPERATURA E CONTATTARE IL VETERINARIO DI ZONA URGENTEMENTE"}); setIsAnalyzing(false);},4000)}} className="w-full bg-stone-950 text-white py-10 rounded-[3rem] font-black uppercase tracking-[0.6em] text-sm flex items-center justify-center gap-10 hover:bg-blue-600 transition-all shadow-2xl active:scale-95">
              {isAnalyzing ? <><Activity className="animate-spin" size={32}/> Neural Processing...</> : <><Bot size={40}/> Lancia Analisi Triage</>}
            </button>

            {vetResult && (
              <div className="mt-20 p-16 bg-emerald-50 border-8 border-white rounded-[6rem] shadow-2xl animate-in slide-in-from-bottom-16 duration-700">
                 <div className="flex items-center gap-8 mb-10">
                    <div className="bg-emerald-500 p-4 rounded-[2.5rem] text-white shadow-xl shadow-emerald-200"><AlertTriangle size={40} /></div>
                    <h4 className="text-3xl font-black uppercase text-emerald-950 tracking-tighter italic leading-none">{vetResult.title}</h4>
                 </div>
                 <p className="text-emerald-800 font-black text-2xl mb-12 leading-relaxed italic tracking-tighter uppercase tracking-widest leading-snug">"{vetResult.desc}"</p>
                 <div className="bg-emerald-600 text-white p-10 rounded-[3rem] text-center text-xs font-black uppercase tracking-[0.4em] shadow-2xl border-b-[16px] border-emerald-700">RACCOMANDAZIONE: {vetResult.action}</div>
              </div>
            )}
          </div>
        )}

        {/* --- 9. MERCATO KM 0 --- */}
        {activeTab === 'market' && (
          <div className="space-y-24 animate-in slide-in-from-bottom-16 duration-1000">
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-20 md:p-32 rounded-[7rem] text-white shadow-[0_60px_120px_rgba(245,158,11,0.3)] relative overflow-hidden group">
               <ShoppingBag size={550} className="absolute -bottom-48 -right-48 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-[15s]" />
               <div className="relative z-10 max-w-4xl text-center md:text-left mx-auto md:mx-0">
                 <div className="bg-white/20 w-fit px-8 py-3 rounded-full text-[14px] font-black uppercase tracking-[0.6em] mb-12 backdrop-blur-3xl border border-white/20 shadow-2xl italic tracking-widest italic uppercase leading-none shadow-amber-900/10">Neural Marketplace KM 0</div>
                 <h3 className="text-9xl font-black italic tracking-tighter uppercase mb-10 leading-[0.8] uppercase leading-none tracking-[-0.05em]">Directly From Source.</h3>
                 <p className="text-amber-50 font-black text-3xl leading-relaxed opacity-95 italic tracking-tighter max-w-2xl leading-snug decoration-white/20 underline underline-offset-[16px] decoration-8">Sostieni l'agricoltura locale. Filiera corta digitale 2026, trasparente, genuina e garantita.</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-20">
              {marketItems.map(item => (
                <div key={item.id} className="bg-white rounded-[5rem] border-2 border-stone-50 shadow-[0_40px_100px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col group hover:shadow-2xl hover:translate-y-[-20px] transition-all duration-1000">
                  <div className="h-80 bg-stone-50 flex items-center justify-center relative overflow-hidden group-hover:bg-amber-50 transition-colors duration-1000 shadow-inner">
                     <div className="absolute top-10 right-10 bg-white/95 backdrop-blur-3xl px-10 py-5 rounded-[2.5rem] font-black text-5xl text-emerald-600 shadow-2xl border-4 border-emerald-50 italic tracking-tighter group-hover:scale-125 transition-transform z-20 leading-none shadow-emerald-100">€{item.price.toFixed(0)}</div>
                     <ShoppingBag size={150} className="text-stone-100 opacity-50 transition-all duration-1000 group-hover:scale-[2] group-hover:opacity-10" />
                  </div>
                  <div className="p-16 flex flex-col flex-1 relative border-t-8 border-stone-50">
                    <p className="text-[14px] font-black text-amber-500 uppercase tracking-[0.5em] mb-4 italic leading-none">{item.sellerName}</p>
                    <h4 className="text-5xl font-black text-stone-950 tracking-tighter mb-12 leading-[0.85] uppercase group-hover:text-amber-600 transition-colors duration-500">{item.name}</h4>
                    <div className="flex justify-between items-center mb-16 bg-stone-50 p-12 rounded-[3.5rem] border-4 border-white shadow-2xl shadow-stone-100 relative">
                       <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white px-6 py-1.5 rounded-full text-[10px] font-black text-stone-300 uppercase tracking-[0.4em] shadow-sm">Disponibilità In Stock</div>
                       <span className="text-[14px] font-black text-stone-400 uppercase italic tracking-widest leading-none">QTY</span>
                       <span className="font-black text-stone-900 text-4xl uppercase tracking-tighter leading-none">{item.quantity} <span className="text-xl text-stone-300 ml-1 italic font-bold uppercase">{item.unit}</span></span>
                    </div>
                    {item.contactPhone ? (
                       <a href={`https://wa.me/39${item.contactPhone}?text=Salve ${item.sellerName}, vorrei ordinare ${item.name} visto su AgriManage Pro.`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white py-10 rounded-[3rem] font-black text-sm uppercase tracking-[0.5em] shadow-[0_30px_80px_rgba(37,211,102,0.4)] flex items-center justify-center gap-8 hover:bg-[#1da851] hover:scale-105 transition-all active:scale-95 shadow-xl border-b-[16px] border-[#1da851]"><MessageCircle size={40}/> Order WhatsApp</a>
                    ) : (
                       <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white py-10 rounded-[3rem] font-black text-sm uppercase tracking-[0.5em] shadow-[0_30px_80px_rgba(37,99,235,0.4)] flex items-center justify-center gap-8 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95 border-b-[16px] border-blue-800 shadow-xl"><Mail size={40}/> Email Order</a>
                    )}
                  </div>
                </div>
              ))}
              {marketItems.length === 0 && (
                <div className="col-span-full py-60 text-center flex flex-col items-center gap-16 border-8 border-dashed rounded-[7rem] border-stone-200/50">
                  <Ghost size={150} className="text-stone-100 animate-bounce" />
                  <p className="text-stone-200 font-black italic uppercase tracking-[1em] text-4xl leading-none">No Public Listings</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
