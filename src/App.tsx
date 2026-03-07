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
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dueDate?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }
interface MarketItem { id: string; name: string; price: number; quantity: number; unit: string; sellerId: string; sellerName: string; contactEmail: string; contactPhone: string; createdAt: string; }

// --- COMPONENTE DINASTIA ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const children = allAnimals.filter(a => a.dam === animal.name || a.sire === animal.name || a.dam === animal.id || a.sire === animal.id);
  return (
    <div className={level > 0 ? "ml-4 border-l border-stone-200 pl-4 mt-2" : ""}>
      <div className={`p-3 rounded-xl border bg-white mb-2 shadow-sm ${level === 0 ? 'border-l-4 border-l-emerald-500' : ''}`}>
        <p className="font-bold text-stone-800 text-sm uppercase">{animal.name}</p>
        <p className="text-[10px] text-stone-400 font-bold uppercase">{animal.species} • LIVELLO {level}</p>
      </div>
      {children.map(child => <DynastyBranch key={child.id} animal={child} allAnimals={allAnimals} level={level + 1} />)}
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
  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as any, species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  const [newTask, setNewTask] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  // --- IA & VET & MARKET ---
  const [showAssistant, setShowAssistant] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const [vetSymptom, setVetSymptom] = useState('');
  const [vetImage, setVetImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vetResult, setVetResult] = useState<any>(null);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sellPrice, setSellPrice] = useState(0);
  const [sellPhone, setSellPhone] = useState('');

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];

  // --- LOGICA ACCESSO (FIX CARICAMENTO) ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userDocPromise = getDoc(doc(db, 'users', u.uid));
          const timeout = new Promise((_, reject) => setTimeout(() => reject('timeout'), 3500));
          const userDoc = await Promise.race([userDocPromise, timeout]) as any;
          if (userDoc && userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserName(data.name || 'Utente');
            setActiveTab(data.role === 'consumer' ? 'market' : 'dashboard');
          } else { setUserRole('farmer'); setUserName('Azienda Agricola'); }
        } catch (e) { setUserRole('farmer'); setUserName('Azienda Agricola'); }
      } else { setUser(null); setUserRole(null); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- SYNC DATI ---
  useEffect(() => {
    if (!user?.uid || !userRole) return;
    const unsubs: any[] = [];
    unsubs.push(onSnapshot(collection(db, 'market_items'), s => setMarketItems(s.docs.map(d => ({ id: d.id, ...d.data() } as MarketItem)))));
    if (userRole === 'farmer') {
      const q = (coll: string) => query(collection(db, coll), where("ownerId", "==", user.uid));
      unsubs.push(onSnapshot(q('animals'), s => setAnimals(s.docs.map(d => ({ id: d.id, ...d.data() } as Animal)))));
      unsubs.push(onSnapshot(q('transactions'), s => setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)))));
      unsubs.push(onSnapshot(q('tasks'), s => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() } as Task)))));
      unsubs.push(onSnapshot(q('products'), s => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() } as Product)))));
    }
    return () => unsubs.forEach(u => u());
  }, [user?.uid, userRole]);

  // --- FUNZIONI ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', uc.user.uid), { role: regRole, name: regName, email });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (e) { alert("Credenziali non corrette."); }
  };

  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("Codice richiesto.");
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', dam: '', notes: '' });
  };

  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("Codice madre richiesto.");
    await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    for (let i = 0; i < newBirth.count; i++) {
      await addDoc(collection(db, 'animals'), { name: `NATO_${newBirth.idCode}_${Math.floor(Math.random()*1000)}`, species: newBirth.species, birthDate: newBirth.birthDate, dam: newBirth.idCode, notes: 'Nascita registrata', ownerId: user!.uid });
    }
    setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
  };

  // --- FIX BILANCIO: SALVA CON SPECIE CORRETTA ---
  const handleSaveTransaction = async () => {
    if (newTrans.amount <= 0 || !newTrans.desc) return alert("Compila tutti i campi.");
    await addDoc(collection(db, 'transactions'), { 
        ...newTrans, 
        date: new Date().toLocaleDateString('it-IT'), 
        ownerId: user!.uid 
    });
    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVetImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAICommand = async () => {
    const frasi = aiInput.toLowerCase().split(/ e |,|\./).filter(s => s.trim());
    let logs = [];
    for (let f of frasi) {
      const num = f.match(/(\d+)/)?.[1];
      if (f.includes('venduto') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `IA: ${f}`, amount: Number(num), type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Registrata Entrata: ${num}€`);
      } else if (f.includes('speso') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `IA: ${f}`, amount: Number(num), type: 'Uscita', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Registrata Uscita: ${num}€`);
      }
    }
    setAiLogs(logs); setAiInput('');
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || newProduct.quantity <= 0) return;
    const existing = products.find(p => p.name.toLowerCase() === newProduct.name.toLowerCase());
    if (existing) { await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity }); }
    else { await addDoc(collection(db, 'products'), { ...newProduct, ownerId: user!.uid }); }
    setNewProduct({ name: '', quantity: 0, unit: 'kg' });
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'tasks'), { text: newTask, done: false, dueDate: newTaskDate, ownerId: user!.uid });
    setNewTask('');
  };

  const handlePublishToMarket = async () => {
    if (!sellingProduct || sellPrice <= 0) return alert("Inserisci un prezzo.");
    await addDoc(collection(db, 'market_items'), { name: sellingProduct.name, price: sellPrice, quantity: sellingProduct.quantity, unit: sellingProduct.unit, sellerId: user!.uid, sellerName: userName, contactEmail: user!.email, contactPhone: sellPhone, createdAt: new Date().toISOString() });
    setSellingProduct(null); alert("Prodotto in vetrina!");
  };

  const exportASLReport = () => {
    const d = new jsPDF(); const n = window.prompt("Nome Azienda:") || "Azienda";
    d.text(n, 14, 20);
    const sorted = [...animals].sort((a,b) => a.species.localeCompare(b.species));
    autoTable(d, { head: [['ID', 'Specie', 'Data', 'Madre']], body: sorted.map(a => [a.name, a.species, a.birthDate || '', a.dam || '']), startY: 30 });
    d.save('Registro_Capi.pdf');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-800 bg-stone-50">Sincronizzazione...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm border">
          <h1 className="text-2xl font-black text-center mb-6 text-emerald-900 italic">AgriManage Pro</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'farmer' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-400'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'consumer' ? 'bg-amber-500 text-white' : 'bg-white text-stone-400'}`}>CLIENTE</button>
                </div>
                <input placeholder="Tuo Nome o Azienda" className="w-full p-3 rounded-xl border text-sm" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full p-3 rounded-xl border text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-3 rounded-xl border text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold uppercase shadow-md">{isRegistering ? "Crea Account" : "Entra"}</button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs font-bold text-stone-400 uppercase mt-4 text-center">{isRegistering ? "Torna al Login" : "Nuovo Utente? Registrati"}</button>
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
    { id: 'market', label: 'Mercato', icon: Store }
  ] : [
    { id: 'market', label: 'Acquista', icon: ShoppingBag }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row relative text-stone-900 overflow-x-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 fixed h-full shadow-sm z-40">
        <h1 className="text-xl font-black mb-8 text-emerald-900 italic">AgriPro</h1>
        <nav className="space-y-1 flex-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-4 flex items-center gap-2 text-red-500 font-bold p-2 text-xs uppercase"><LogOut size={18} /> Esci</button>
      </aside>

      {/* NAV MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-2 z-50 shadow-lg overflow-x-auto">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center min-w-[65px] p-2 transition-colors ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-300'}`}>
            <item.icon size={22} />
            <span className="text-[9px] font-bold uppercase mt-1">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* MAIN */}
      <main className="flex-1 md:ml-64 p-4 md:p-10 pb-24">
        <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-black text-stone-900 uppercase italic tracking-tight">{activeTab}</h2>
            {userRole === 'farmer' && (
                <button onClick={() => setShowAssistant(!showAssistant)} className="bg-blue-600 text-white p-2 rounded-full shadow-md">
                    <Bot size={20} />
                </button>
            )}
        </div>

        {/* MODALE IA */}
        {showAssistant && (
          <div className="mb-6 bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-xl animate-in slide-in-from-top-4">
            <h3 className="text-blue-900 font-bold text-xs uppercase mb-3 flex items-center gap-2"><Bot size={16}/> Assistente Vocale</h3>
            <div className="flex gap-2">
              <input className="flex-1 p-3 bg-blue-50 border-none rounded-xl text-sm font-bold placeholder:text-blue-200 shadow-inner" placeholder="Es: 'Venduto maiale a 100€'" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAICommand()} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-5 rounded-xl font-bold text-xs shadow-md">OK</button>
            </div>
            {aiLogs.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{aiLogs.map((l, i) => <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-bold">{l}</span>)}</div>}
          </div>
        )}

        {/* --- 1. DASHBOARD --- */}
        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div onClick={()=>setActiveTab('inventory')} className="bg-emerald-600 p-5 rounded-3xl text-white shadow-lg cursor-pointer">
              <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Capi Attivi</p>
              <h4 className="text-4xl font-black italic">{animals.length}</h4>
            </div>
            <div onClick={()=>setActiveTab('finance')} className="bg-white p-5 rounded-3xl border shadow-sm cursor-pointer">
               <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Netto Azienda</p>
               <h4 className="text-2xl font-black italic">€{transactions.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount),0)}</h4>
            </div>
          </div>
        )}

        {/* --- 2. INVENTARIO (SPECIE) --- */}
        {activeTab === 'inventory' && userRole === 'farmer' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-bold uppercase text-stone-400 italic">Nuovo Capo</h3>
                <button onClick={exportASLReport} className="text-[10px] font-bold bg-stone-100 px-3 py-1 rounded-lg flex items-center gap-1 uppercase hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><FileDown size={14}/> PDF</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input placeholder="Codice Capo" className="p-3 bg-stone-50 rounded-xl text-sm border-none shadow-inner" value={newAnimal.name} onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} />
                <select className="p-3 bg-stone-50 rounded-xl text-sm border-none shadow-inner" value={newAnimal.species} onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                <input type="date" className="p-3 bg-stone-50 rounded-xl text-sm border-none shadow-inner" value={newAnimal.birthDate} onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} />
                <button onClick={handleSaveAnimal} className="bg-emerald-600 text-white font-bold rounded-xl p-3 uppercase text-xs shadow-md">Aggiungi</button>
              </div>
            </div>

            {speciesList.map(specie => {
              const capi = animals.filter(a => a.species === specie);
              if (capi.length === 0) return null;
              return (
                <div key={specie} className="space-y-3">
                  <h4 className="text-sm font-black text-emerald-800 uppercase px-2 italic tracking-widest">{specie} ({capi.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {capi.map(a => (
                      <div key={a.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm relative group hover:border-emerald-500 transition-all">
                        <button onClick={()=>deleteDoc(doc(db,'animals',a.id))} className="absolute top-3 right-3 text-stone-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        <h4 className="font-bold text-stone-800 uppercase text-sm">{a.name}</h4>
                        <p className="text-[10px] text-stone-400 font-bold">{a.birthDate || 'N/D'}</p>
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
          <div className="bg-white p-6 rounded-3xl border shadow-sm max-w-lg mx-auto animate-in zoom-in-95">
             <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-700 mb-6 flex items-center gap-3">
               <Baby size={32} />
               <p className="text-[11px] font-bold italic uppercase tracking-tighter">Registra il parto: i nuovi capi verranno aggiunti automaticamente all'anagrafica stalla.</p>
             </div>
             <div className="space-y-4">
                <input className="w-full p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner border-none" placeholder="Codice ID Madre" value={newBirth.idCode} onChange={e=>setNewBirth({...newBirth, idCode:e.target.value})} />
                <div className="flex gap-2">
                  <input type="number" className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner border-none" placeholder="N. Nati" value={newBirth.count} onChange={e=>setNewBirth({...newBirth, count:Number(e.target.value)})} />
                  <select className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner border-none" value={newBirth.species} onChange={e=>setNewBirth({...newBirth, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                </div>
                <input type="date" className="w-full p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner border-none text-emerald-700" value={newBirth.birthDate} onChange={e=>setNewBirth({...newBirth, birthDate:e.target.value})} />
                <button onClick={handleSaveBirth} className="w-full bg-emerald-700 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg">Registra Parto</button>
             </div>
          </div>
        )}

        {/* --- 4. BILANCIO (ORDINATO PER SPECIE) --- */}
        {activeTab === 'finance' && userRole === 'farmer' && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div className="bg-stone-900 p-8 rounded-3xl text-white shadow-xl text-center">
               <p className="text-[10px] font-bold text-emerald-400 uppercase mb-2">Totale Netto Liquidità</p>
               <h3 className="text-4xl font-black italic">€ {transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(0)}</h3>
            </div>

            <div className="bg-white p-5 rounded-2xl border grid grid-cols-1 md:grid-cols-5 gap-3 shadow-sm">
              <input placeholder="Causale" className="p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner border-none col-span-1 md:col-span-2 uppercase" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc:e.target.value})} />
              <div className="flex items-center bg-stone-50 rounded-xl px-4 shadow-inner">
                <span className="text-emerald-600 font-bold mr-1">€</span>
                <input type="number" placeholder="0" className="w-full bg-transparent border-none font-black text-sm" value={newTrans.amount || ''} onChange={e=>setNewTrans({...newTrans, amount:Number(e.target.value)})} />
              </div>
              <select className="p-3 bg-stone-50 rounded-xl font-bold text-xs shadow-inner border-none" value={newTrans.species} onChange={e=>setNewTrans({...newTrans, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
              <button onClick={handleSaveTransaction} className="bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase shadow-md active:scale-95">Salva</button>
            </div>

            {speciesList.map(specie => {
              const transSpecie = transactions.filter(t => t.species === specie);
              if (transSpecie.length === 0) return null;
              const bilancioSpecie = transSpecie.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount), 0);
              return (
                <div key={specie} className="space-y-2">
                  <div className="flex justify-between items-center px-4 py-1 bg-stone-50 rounded-lg">
                    <h4 className="text-xs font-black text-stone-500 uppercase italic">{specie}</h4>
                    <span className={`text-[12px] font-black italic ${bilancioSpecie >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>Saldo Parziale: €{bilancioSpecie}</span>
                  </div>
                  <div className="space-y-2">
                    {transSpecie.map(t => (
                      <div key={t.id} className="bg-white p-4 rounded-xl border border-stone-100 flex justify-between items-center shadow-sm">
                        <div><p className="font-bold text-xs text-stone-800 uppercase">{t.desc}</p><p className="text-[9px] text-stone-400 font-bold">{t.date}</p></div>
                        <div className="flex items-center gap-4">
                            <span className={`font-black text-sm italic ${t.type==='Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type==='Entrata' ? '+' : '-'}€{t.amount}</span>
                            <button onClick={()=>deleteDoc(doc(db,'transactions',t.id))} className="text-stone-100 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- 5. SCORTE MAGAZZINO --- */}
        {activeTab === 'products' && userRole === 'farmer' && (
          <div className="space-y-6">
            {sellingProduct && (
              <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-300 shadow-xl animate-in zoom-in-95 max-w-lg mx-auto">
                <h3 className="text-lg font-black text-amber-950 italic mb-4 uppercase leading-none">Vendi Km 0: {sellingProduct.name}</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <input type="number" className="p-3 rounded-xl border-none shadow-md font-bold text-sm" placeholder="Prezzo (€)" onChange={e=>setSellPrice(Number(e.target.value))} />
                  <input className="p-3 rounded-xl border-none shadow-md font-bold text-sm" placeholder="WhatsApp" onChange={e=>setSellPhone(e.target.value)} />
                </div>
                <div className="flex gap-4">
                  <button onClick={handlePublishToMarket} className="flex-1 bg-amber-500 text-white font-bold py-3 rounded-xl uppercase text-[10px] tracking-widest shadow-xl">Pubblica</button>
                  <button onClick={()=>setSellingProduct(null)} className="px-10 bg-white text-amber-500 font-black rounded-xl border-2 border-amber-200 text-xs">Annulla</button>
                </div>
              </div>
            )}
            <div className="bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden">
              <h3 className="text-[10px] font-black uppercase text-stone-400 mb-6 tracking-widest flex items-center gap-2 italic"><Package size={16}/> Gestione Scorte Fisiche</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input placeholder="Articolo (Fieno, Mais...)" className="p-3 bg-stone-50 rounded-xl font-bold text-sm border-none shadow-inner uppercase" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} />
                <div className="flex gap-2">
                  <input type="number" placeholder="QTY" className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-sm border-none shadow-inner" value={newProduct.quantity || ''} onChange={e=>setNewProduct({...newProduct, quantity:Number(e.target.value)})} />
                  <select className="p-3 bg-stone-50 rounded-xl font-bold border-none shadow-inner text-xs uppercase" value={newProduct.unit} onChange={e=>setNewProduct({...newProduct, unit:e.target.value})}><option>kg</option><option>balle</option><option>unità</option></select>
                </div>
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white rounded-xl font-bold uppercase text-xs shadow-md">Aggiorna</button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-3xl border border-stone-100 shadow-sm text-center flex flex-col group hover:border-emerald-200 transition-all duration-500">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform shadow-inner"><Package size={32}/></div>
                  <h4 className="font-bold text-stone-800 uppercase text-[10px] mb-2 tracking-widest">{p.name}</h4>
                  <p className="text-4xl font-black text-emerald-600 italic tracking-tighter mb-6 leading-none">{p.quantity} <span className="text-[10px] uppercase not-italic opacity-30 tracking-[0.3em] block mt-1">{p.unit}</span></p>
                  <button onClick={()=>setSellingProduct(p)} className="w-full bg-amber-100 text-amber-700 font-bold py-3 rounded-2xl text-[9px] uppercase tracking-widest mb-3 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2 italic"><Store size={14}/> Vendi Km 0</button>
                  <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-stone-200 hover:text-red-500 transition-colors mt-auto pt-4 border-t border-stone-50"><Trash2 size={18} className="mx-auto"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 6. AGENDA (RICERCA) --- */}
        {activeTab === 'tasks' && userRole === 'farmer' && (
          <div className="max-w-xl space-y-6 animate-in slide-in-from-left-6 mx-auto">
            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-5">
               <h3 className="text-[11px] font-black uppercase text-stone-400 mb-2 tracking-widest italic flex items-center gap-3"><CalendarDays size={18}/> Programmazione Lavori</h3>
               <div className="flex flex-col md:flex-row gap-2">
                 <input className="flex-1 p-3 bg-stone-50 border-none rounded-xl font-bold text-sm shadow-inner" placeholder="Cosa devi segnare?" value={newTask} onChange={e=>setNewTask(e.target.value)} />
                 <input type="date" className="p-3 bg-stone-50 border-none rounded-xl font-bold text-xs uppercase text-emerald-700 shadow-inner" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)} />
                 <button onClick={handleAddTask} className="bg-emerald-600 text-white px-8 rounded-xl font-bold text-xs uppercase shadow-md">OK</button>
               </div>
               <div className="relative group">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
                  <input className="w-full p-3 pl-10 bg-stone-100 border-none rounded-xl font-bold text-xs uppercase italic shadow-inner" placeholder="Cerca tra i lavori salvati..." value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} />
               </div>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => t.text.toLowerCase().includes(taskSearch.toLowerCase()))
                .sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                .map(t => (
                <div key={t.id} className={`bg-white p-5 rounded-3xl border-2 flex justify-between items-center transition-all ${t.done ? 'opacity-30 grayscale' : 'shadow-sm border-white hover:border-emerald-500 group border-l-8 border-l-emerald-600'}`}>
                  <div>
                    <p className={`text-base font-black tracking-tight leading-none mb-2 uppercase ${t.done ? 'line-through text-stone-400' : 'text-stone-900'}`}>{t.text}</p>
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest italic">Scadenza: {t.dueDate || 'N/D'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>updateDoc(doc(db,'tasks',t.id),{done:!t.done})} className={`p-3 rounded-2xl shadow-sm transition-all ${t.done ? 'bg-stone-200 text-stone-500' : 'bg-emerald-50 text-emerald-600'}`}><CheckCircle2 size={24}/></button>
                    <button onClick={()=>deleteDoc(doc(db,'tasks',t.id))} className="p-3 bg-red-50 text-red-400 rounded-[2rem] hover:bg-red-600 hover:text-white transition-all shadow-xl"><Trash2 size={24}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 7. DINASTIA TAB --- */}
        {activeTab === 'dinastia' && (
          <div className="bg-white p-8 rounded-3xl border shadow-sm animate-in fade-in overflow-x-auto">
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-8 flex items-center gap-2"><Network className="text-emerald-500"/> Albero Genealogico</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {animals.filter(a => !a.dam && !a.sire).map(root => (
                <div key={root.id} className="bg-stone-50 p-6 rounded-3xl border-2 border-white shadow-inner min-w-[300px]">
                  <DynastyBranch animal={root} allAnimals={animals} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 8. VETERINARIO IA TAB (CON FOTO) --- */}
        {activeTab === 'vet' && userRole === 'farmer' && (
          <div className="bg-white p-10 rounded-[4rem] border shadow-2xl max-w-3xl animate-in zoom-in-95 mx-auto relative overflow-hidden">
            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white mb-10 flex items-center gap-8 shadow-2xl relative group">
               <Stethoscope size={64} strokeWidth={1} className="relative z-10" />
               <div className="relative z-10">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-2">Diagnosi IA</h3>
                  <p className="text-blue-50 font-bold opacity-80 text-xs leading-relaxed italic max-w-lg tracking-tight">Triage clinico istantaneo basato su intelligenza artificiale 2026.</p>
               </div>
            </div>

            <div className="space-y-6 mb-10">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic ml-4">1. Documentazione Fotografica (Opzionale)</p>
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-stone-200 rounded-[2rem] cursor-pointer hover:bg-stone-50 hover:border-blue-400 transition-all relative overflow-hidden bg-stone-50 shadow-inner">
                        {vetImage ? (
                            <img src={vetImage} alt="Sintomo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                                <UploadCloud size={40} className="text-stone-300 mb-2" />
                                <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tocca per caricare o scattare</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                    {vetImage && <button onClick={()=>setVetImage(null)} className="text-[9px] font-black text-red-500 uppercase ml-4">Rimuovi Foto</button>}
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest italic ml-4">2. Descrizione Sintomi & Comportamento</p>
                    <textarea className="w-full p-8 bg-stone-50 border-none rounded-[2.5rem] font-bold text-stone-800 text-lg h-56 shadow-inner italic placeholder:text-stone-300 focus:ring-4 focus:ring-blue-100 transition-all leading-snug" placeholder="Descrivi il capo anomalo (es: vitello IT02 naso asciutto e respiro affannato)..." value={vetSymptom} onChange={e=>setVetSymptom(e.target.value)}></textarea>
                </div>
            </div>

            <button onClick={()=>{setIsAnalyzing(true); setTimeout(()=>{setVetResult({title:"Esito Diagnostico IA", desc:"Il quadro clinico e visivo analizzato suggerisce una possibile infiammazione respiratoria o stress termico acuto.", action:"ISOLARE IL CAPO DALLA MANDRIA, MONITORARE LA TEMPERATURA E CONTATTARE IL VETERINARIO DI ZONA URGENTEMENTE"}); setIsAnalyzing(false);},3000)}} className="w-full bg-stone-950 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-6 hover:bg-blue-600 transition-all shadow-2xl active:scale-95">
              {isAnalyzing ? <><Activity className="animate-spin" size={24}/> Analisi Neurale...</> : <><Bot size={28}/> Avvia Analisi Triage</>}
            </button>

            {vetResult && (
              <div className="mt-16 p-10 bg-emerald-50 border-4 border-emerald-100 rounded-[3.5rem] animate-in slide-in-from-bottom-12">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="bg-emerald-500 p-2 rounded-2xl text-white shadow-xl shadow-emerald-200"><AlertTriangle size={24} /></div>
                    <h4 className="text-xl font-black uppercase text-emerald-950 tracking-tighter italic">{vetResult.title}</h4>
                 </div>
                 <p className="text-emerald-800 font-bold text-lg mb-8 leading-relaxed italic tracking-tighter">"{vetResult.desc}"</p>
                 <div className="bg-emerald-600 text-white p-6 rounded-2xl text-center text-xs font-black uppercase tracking-[0.3em] shadow-2xl border-b-8 border-emerald-700">{vetResult.action}</div>
              </div>
            )}
          </div>
        )}

        {/* --- 9. MERCATO KM 0 TAB --- */}
        {activeTab === 'market' && (
          <div className="space-y-16 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-amber-500 p-12 md:p-20 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
               <ShoppingBag size={300} className="absolute -bottom-16 -right-16 opacity-10 rotate-12" />
               <div className="relative z-10 max-w-2xl text-center md:text-left mx-auto md:mx-0">
                 <h3 className="text-5xl font-black italic tracking-tighter uppercase mb-4 leading-none">Piazza del Mercato</h3>
                 <p className="text-amber-50 font-black text-xl leading-relaxed opacity-95 italic tracking-tighter uppercase tracking-widest">Prodotti genuini direttamente dal campo, filiera corta 2026.</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {marketItems.map(item => (
                <div key={item.id} className="bg-white rounded-[3.5rem] border-2 border-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col group hover:shadow-2xl hover:translate-y-[-10px] transition-all duration-700">
                  <div className="h-60 bg-stone-50 flex items-center justify-center relative overflow-hidden group-hover:bg-amber-50 transition-colors duration-1000 shadow-inner">
                     <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-3xl px-5 py-2.5 rounded-[1.5rem] font-black text-2xl text-emerald-600 shadow-2xl border-2 border-emerald-50 italic tracking-tighter group-hover:scale-110 transition-transform z-20 leading-none">€{item.price.toFixed(0)}</div>
                     <ShoppingBag size={80} className="text-stone-100 opacity-50 transition-all duration-1000 group-hover:scale-[1.8]" />
                  </div>
                  <div className="p-10 flex flex-col flex-1 relative">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-3 italic leading-none">{item.sellerName}</p>
                    <h4 className="text-3xl font-black text-stone-950 tracking-tighter mb-8 leading-[0.85] uppercase group-hover:text-amber-600 transition-colors duration-500">{item.name}</h4>
                    <div className="flex justify-between items-center mb-10 bg-stone-50 p-6 rounded-3xl border-2 border-white shadow-inner">
                       <span className="text-[11px] font-black text-stone-400 uppercase italic tracking-widest leading-none">Disponibile</span>
                       <span className="font-black text-stone-900 text-xl uppercase tracking-tighter leading-none">{item.quantity} <span className="text-xs text-stone-300 font-bold">{item.unit}</span></span>
                    </div>
                    {item.contactPhone ? (
                       <a href={`https://wa.me/39${item.contactPhone}?text=Salve ${item.sellerName}, vorrei ordinare ${item.name} visto su AgriManage.`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-[0_15px_40px_rgba(37,211,102,0.3)] flex items-center justify-center gap-4 hover:scale-105 transition-all active:scale-95 shadow-xl"><MessageCircle size={24}/> Shop On WhatsApp</a>
                    ) : (
                       <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 hover:scale-105 transition-all active:scale-95"><Mail size={24}/> Email Order</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
