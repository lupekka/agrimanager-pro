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
interface Task { id: string; text: string; done: boolean; dueDate?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }
interface MarketItem { id: string; name: string; price: number; quantity: number; unit: string; sellerId: string; sellerName: string; contactEmail: string; contactPhone: string; createdAt: string; }

// --- COMPONENTE DINASTIA ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const children = allAnimals.filter(a => a.dam === animal.name || a.sire === animal.name || a.dam === animal.id || a.sire === animal.id);
  return (
    <div className={level > 0 ? "ml-4 border-l border-stone-200 pl-4 mt-2" : "mt-2"}>
      <div className={`p-3 rounded-xl border bg-white shadow-sm ${level === 0 ? 'border-l-4 border-emerald-500' : ''}`}>
        <p className="font-bold text-stone-800 text-xs uppercase">{animal.name}</p>
        <p className="text-[9px] text-stone-400 font-bold uppercase tracking-tighter">{animal.species} • GEN {level}</p>
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
  const [births, setBirths] = useState<BirthRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  // --- STATI INPUT ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regRole, setRegRole] = useState<'farmer' | 'consumer'>('farmer');
  const [regName, setRegName] = useState('');
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', dam: '', sire: '', notes: '' });
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [vetResult, setVetResult] = useState<any>(null);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [sellPrice, setSellPrice] = useState(0);
  const [sellPhone, setSellPhone] = useState('');

  const speciesList: Species[] = ['Maiali', 'Cavalli', 'Mucche', 'Galline', 'Oche'];
  const validAnimals = animals.filter(a => a.name && a.name.trim().length > 0);

  // --- LOGICA DI ACCESSO (FIX CARICAMENTO INFINITO) ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userDocPromise = getDoc(doc(db, 'users', u.uid));
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
          
          const userDoc = await Promise.race([userDocPromise, timeoutPromise]) as any;

          if (userDoc && userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserName(data.name || 'Utente');
            setActiveTab(data.role === 'consumer' ? 'market' : 'dashboard');
          } else {
            setUserRole('farmer');
            setUserName('Azienda Agricola');
            setActiveTab('dashboard');
          }
        } catch (e) {
          setUserRole('farmer');
          setUserName('Azienda Agricola');
          setActiveTab('dashboard');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false); // SBLOCCA SEMPRE IL CARICAMENTO
    });
    return () => unsub();
  }, []);

  // --- SINCRONIZZAZIONE DATI ---
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

  // --- FUNZIONI CORE ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', uc.user.uid), { role: regRole, name: regName, email });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      alert("Credenziali non valide.");
      setLoading(false);
    }
  };

  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("Codice obbligatorio.");
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', dam: '', sire: '', notes: '' });
  };

  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("Codice madre richiesto.");
    await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    for (let i = 0; i < newBirth.count; i++) {
      await addDoc(collection(db, 'animals'), {
        name: `NATO_${newBirth.idCode}_${Math.floor(Math.random()*1000)}`,
        species: newBirth.species, birthDate: newBirth.birthDate, dam: newBirth.idCode,
        notes: 'Parto registrato', ownerId: user!.uid
      });
    }
    setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
    alert("Parto salvato!");
  };

  const handleSaveTransaction = async () => {
    if (newTrans.amount <= 0 || !newTrans.desc) return alert("Dati mancanti.");
    await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
  };

  const handleAICommand = async () => {
    if (!aiInput.trim()) return;
    setAiLogs(["Analisi..."]);
    const frasi = aiInput.toLowerCase().split(/ e |,|\./).filter(s => s.trim());
    let logs = [];
    for (let f of frasi) {
      const num = f.match(/(\d+)/)?.[1];
      if (f.includes('venduto') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `IA: ${f}`, amount: Number(num), type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Vendita: ${num}€`);
      } else if (f.includes('speso') || f.includes('comprato') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `IA: ${f}`, amount: Number(num), type: 'Uscita', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Spesa: ${num}€`);
      } else if (f.includes('ho') && num) {
        const prod = f.replace(/ho|(\d+)/g, '').trim().toUpperCase();
        await addDoc(collection(db, 'products'), { name: prod, quantity: Number(num), unit: 'unità', ownerId: user!.uid });
        logs.push(`✅ Scorta: ${num} ${prod}`);
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

  const exportASLReport = () => {
    const d = new jsPDF();
    const nomeAz = window.prompt("Azienda Agricola:") || "Azienda";
    d.text(nomeAz, 14, 20);
    const sorted = [...animals].sort((a,b) => a.species.localeCompare(b.species));
    autoTable(d, { 
      head: [['CODICE', 'SPECIE', 'NASCITA', 'NOTE']], 
      body: sorted.map(a => [a.name, a.species, a.birthDate || '', a.notes]),
      startY: 30 
    });
    d.save('Registro_Capi.pdf');
  };

  // --- UI CARICAMENTO ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
      <Activity className="animate-spin text-emerald-600 mb-4" size={40} />
      <h2 className="font-bold text-emerald-950 uppercase tracking-widest text-xs animate-pulse italic">AgriManage Pro 2026...</h2>
    </div>
  );

  // --- UI LOGIN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border">
          <h1 className="text-2xl font-black text-center mb-6 text-emerald-900 italic">AgriManage Pro</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'farmer' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-stone-400'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'consumer' ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-stone-400'}`}>CLIENTE</button>
                </div>
                <input placeholder="Nome o Azienda" className="w-full p-3 rounded-xl border text-sm" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full p-3 rounded-xl border text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-3 rounded-xl border text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold uppercase shadow-md active:scale-95">{isRegistering ? "Registrati" : "Entra"}</button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs font-bold text-stone-400 uppercase mt-4 underline decoration-2">{isRegistering ? "Torna al Login" : "Nuovo? Registrati Ora"}</button>
          </form>
        </div>
      </div>
    );
  }

  const menuItems = userRole === 'farmer' ? [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'inventory', label: 'Capi', icon: PawPrint },
    { id: 'births', label: 'Parti', icon: Baby },
    { id: 'finance', label: 'Soldi', icon: Wallet },
    { id: 'products', label: 'Scorte', icon: Package },
    { id: 'tasks', label: 'Lavori', icon: ListChecks },
    { id: 'dinastia', label: 'Albero', icon: Network },
    { id: 'vet', label: 'Vet IA', icon: Stethoscope },
    { id: 'market', label: 'Market', icon: Store }
  ] : [
    { id: 'market', label: 'Negozio', icon: ShoppingBag }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row relative text-stone-900 font-sans">
      
      {/* BOTTONE IA */}
      {userRole === 'farmer' && (
        <button onClick={() => setShowAssistant(!showAssistant)} className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg z-50 hover:scale-110 active:scale-90 transition-transform">
          <Bot size={24} />
        </button>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 fixed h-full shadow-sm z-40">
        <h1 className="text-xl font-black mb-8 text-emerald-900 italic tracking-tighter uppercase">AgriManage</h1>
        <nav className="space-y-1 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 w-full p-3 rounded-2xl font-bold text-xs uppercase tracking-tight transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-stone-400 hover:bg-stone-50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-4 flex items-center gap-2 text-red-500 font-bold p-3 text-xs uppercase hover:translate-x-1 transition-transform"><LogOut size={18} /> Esci</button>
      </aside>

      {/* MOBILE NAV BOTTOM */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-2 z-50 shadow-lg overflow-x-auto hide-scrollbar">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center min-w-[65px] p-2 transition-colors ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-300'}`}>
            <item.icon size={22} />
            <span className="text-[9px] font-bold uppercase mt-1">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* CONTENUTO MAIN */}
      <main className="flex-1 md:ml-64 p-4 md:p-10 pb-24">
        <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tight italic">{activeTab}</h2>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border shadow-sm">Profilo: {userName}</p>
        </div>

        {/* MODALE IA */}
        {showAssistant && (
          <div className="mb-8 bg-white p-6 rounded-3xl border-2 border-blue-100 shadow-xl animate-in slide-in-from-top-4">
            <h3 className="text-blue-900 font-black text-xs uppercase mb-4 flex items-center gap-2"><Bot size={18}/> Assistente Rapido IA</h3>
            <div className="flex gap-2">
              <input className="flex-1 p-3 bg-blue-50 border-none rounded-2xl font-bold text-sm shadow-inner placeholder:text-blue-200" placeholder="Es: 'Venduto maiale a 100€ e speso 50€ fieno'" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAICommand()} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-6 rounded-2xl font-black shadow-lg">OK</button>
            </div>
            {aiLogs.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{aiLogs.map((l, i) => <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-bold animate-in zoom-in border border-emerald-200 shadow-sm">{l}</span>)}</div>}
          </div>
        )}

        {/* --- 1. DASHBOARD --- */}
        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in duration-500">
            <div onClick={()=>setActiveTab('inventory')} className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group">
              <p className="text-[10px] font-black uppercase opacity-60 mb-1">Capi in Stalla</p>
              <h4 className="text-4xl font-black italic">{animals.length}</h4>
              <PawPrint size={80} className="absolute -bottom-4 -right-4 opacity-10 group-hover:scale-110 transition-transform"/>
            </div>
            <div onClick={()=>setActiveTab('finance')} className="bg-white p-6 rounded-3xl border shadow-sm cursor-pointer hover:border-emerald-300 transition-all">
               <p className="text-[10px] font-black text-stone-400 uppercase mb-1">Bilancio Netto</p>
               <h4 className="text-2xl font-black italic tracking-tighter">€{transactions.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount),0)}</h4>
            </div>
            <div onClick={()=>setActiveTab('tasks')} className="bg-stone-900 p-6 rounded-3xl text-white shadow-xl cursor-pointer hover:bg-black transition-all">
               <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Lavori</p>
               <h4 className="text-2xl font-black italic tracking-tighter">{tasks.filter(t=>!t.done).length}</h4>
            </div>
          </div>
        )}

        {/* --- 2. INVENTARIO (ORDINATO PER SPECIE) --- */}
        {activeTab === 'inventory' && userRole === 'farmer' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest italic flex items-center gap-2">Nuova Registrazione</h3>
                <button onClick={exportASLReport} className="text-[10px] font-black bg-stone-950 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-600 transition-all uppercase tracking-widest shadow-xl"><FileDown size={16}/> Scarica PDF</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder="Codice Capo (ID)" className="p-3 bg-stone-50 border-none rounded-xl font-bold text-sm shadow-inner uppercase focus:ring-4 focus:ring-emerald-50" value={newAnimal.name} onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} />
                <select className="p-3 bg-stone-50 border-none rounded-xl font-bold text-sm shadow-inner uppercase tracking-widest" value={newAnimal.species} onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                <input type="date" className="p-3 bg-stone-50 border-none rounded-xl font-bold text-sm shadow-inner text-emerald-700" value={newAnimal.birthDate} onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} />
                <button onClick={handleSaveAnimal} className="bg-emerald-600 text-white font-black rounded-xl p-4 uppercase text-[10px] tracking-widest shadow-lg hover:shadow-emerald-100 transition-all">Aggiungi Capo</button>
              </div>
            </div>

            {speciesList.map(specie => {
              const capi = animals.filter(a => a.species === specie);
              if (capi.length === 0) return null;
              return (
                <div key={specie} className="space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-3 px-2">
                    <h4 className="text-sm font-black text-emerald-900 uppercase italic tracking-widest leading-none">{specie}</h4>
                    <div className="h-[2px] flex-1 bg-stone-100"></div>
                    <span className="bg-stone-900 text-white px-3 py-0.5 rounded-full text-[9px] font-black">{capi.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {capi.map(a => (
                      <div key={a.id} className="bg-white p-5 rounded-[2rem] border border-stone-100 shadow-sm relative group hover:border-emerald-500 transition-all hover:shadow-lg">
                        <button onClick={()=>deleteDoc(doc(db,'animals',a.id))} className="absolute top-4 right-4 text-stone-100 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                        <div className="bg-stone-50 p-2 rounded-xl w-fit mb-4 text-emerald-600"><PawPrint size={18} strokeWidth={2.5}/></div>
                        <h4 className="text-lg font-black text-stone-900 tracking-tighter leading-none mb-1 uppercase">{a.name}</h4>
                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest italic">{a.birthDate || 'NASCITA IGNOTA'}</p>
                        {a.dam && <p className="mt-4 text-[8px] font-black text-stone-300 uppercase tracking-widest pt-4 border-t italic">Linea: {a.dam}</p>}
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
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-2xl max-w-lg mx-auto animate-in zoom-in-95 duration-700">
             <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 text-amber-700 mb-8 flex items-center gap-4 shadow-lg shadow-amber-50">
               <Baby size={48} strokeWidth={1.5} className="animate-pulse" />
               <p className="text-[10px] font-bold italic uppercase tracking-tighter leading-relaxed">Inserisci il codice della madre: i nati verranno aggiunti automaticamente all'anagrafica stalla collegati biologicamente.</p>
             </div>
             <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest">Codice ID Madre</label>
                  <input className="w-full p-4 bg-stone-50 border-none rounded-2xl font-black text-sm shadow-inner uppercase focus:ring-4 focus:ring-amber-100" placeholder="Es: MAIALA_01" value={newBirth.idCode} onChange={e=>setNewBirth({...newBirth, idCode:e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest italic">N. Nati</label>
                    <input type="number" className="w-full p-4 bg-stone-50 border-none rounded-2xl font-black text-xl shadow-inner text-center" value={newBirth.count} onChange={e=>setNewBirth({...newBirth, count:Number(e.target.value)})} />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest italic">Specie</label>
                    <select className="w-full p-4 bg-stone-50 border-none rounded-2xl font-black text-xs shadow-inner uppercase tracking-widest" value={newBirth.species} onChange={e=>setNewBirth({...newBirth, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-stone-400 ml-4 tracking-widest italic">Data del Parto</label>
                  <input type="date" className="w-full p-4 bg-stone-50 border-none rounded-2xl font-black text-sm shadow-inner text-emerald-700 uppercase" value={newBirth.birthDate} onChange={e=>setNewBirth({...newBirth, birthDate:e.target.value})} />
                </div>
                <button onClick={handleSaveBirth} className="w-full bg-emerald-950 text-white py-5 rounded-3xl font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 transition-transform active:scale-95 text-[11px]">Registra Parto Ora</button>
             </div>
          </div>
        )}

        {/* --- 4. BILANCIO (ORDINATO PER SPECIE) --- */}
        {activeTab === 'finance' && userRole === 'farmer' && (
          <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
            <div className="bg-stone-950 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col items-center border-t-8 border-emerald-500">
               <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
               <p className="text-[11px] font-black uppercase text-emerald-400 tracking-[0.4em] mb-4 italic leading-none text-center">Net Operating Balance</p>
               <h3 className="text-7xl font-black italic tracking-tighter leading-none mb-4">€ {transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(0)}</h3>
               <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.3em] italic">Capitale Netto Disponibile</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border grid grid-cols-1 md:grid-cols-4 gap-6 shadow-sm">
              <input placeholder="CAUSALE OPERAZIONE" className="p-4 bg-stone-50 rounded-2xl font-bold col-span-2 shadow-inner border-none uppercase text-xs tracking-widest" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc:e.target.value})} />
              <div className="flex items-center bg-stone-50 rounded-2xl px-4 shadow-inner transition-all focus-within:ring-2 focus-within:ring-emerald-50">
                <span className="text-emerald-600 font-black text-xl mr-2 italic">€</span>
                <input type="number" placeholder="0" className="w-full bg-transparent border-none font-black text-2xl tracking-tighter" value={newTrans.amount || ''} onChange={e=>setNewTrans({...newTrans, amount:Number(e.target.value)})} />
              </div>
              <button onClick={handleSaveTransaction} className="bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all">Salva</button>
            </div>

            {speciesList.map(specie => {
              const transSpecie = transactions.filter(t => t.species === specie);
              if (transSpecie.length === 0) return null;
              const bilancioSpecie = transSpecie.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount), 0);
              return (
                <div key={specie} className="space-y-4 animate-in fade-in">
                  <div className="flex justify-between items-center px-6 py-2 bg-stone-100 rounded-2xl border-l-8 border-emerald-500">
                    <h4 className="text-[11px] font-black text-stone-500 uppercase italic tracking-widest leading-none">{specie}</h4>
                    <span className={`text-[12px] font-black italic tracking-tighter ${bilancioSpecie >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>Saldo: €{bilancioSpecie}</span>
                  </div>
                  <div className="space-y-2">
                    {transSpecie.map(t => (
                      <div key={t.id} className="bg-white p-5 rounded-[1.5rem] border border-stone-50 flex justify-between items-center shadow-sm group">
                        <div className="flex items-center gap-6">
                           <div className={`p-3 rounded-2xl ${t.type==='Entrata' ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'bg-red-50 text-red-600 shadow-inner'}`}>{t.type==='Entrata' ? <ArrowUpRight size={20}/> : <ArrowDownLeft size={20}/>}</div>
                           <div><p className="font-black text-stone-900 uppercase text-xs tracking-tighter mb-1 leading-none">{t.desc}</p><p className="text-[9px] font-black text-stone-300 uppercase tracking-widest italic leading-none">{t.date}</p></div>
                        </div>
                        <div className="flex items-center gap-8">
                           <span className={`text-2xl font-black italic tracking-tighter ${t.type==='Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type==='Entrata' ? '+' : '-'}€{t.amount}</span>
                           <button onClick={()=>deleteDoc(doc(db,'transactions',t.id))} className="p-3 text-stone-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
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
        {activeTab === 'products' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {sellingProduct && (
              <div className="bg-amber-50 p-8 rounded-[3rem] border-2 border-amber-300 shadow-2xl animate-in zoom-in-95 relative overflow-hidden mx-auto max-w-lg">
                <h3 className="text-xl font-black text-amber-950 italic mb-6 uppercase tracking-tighter flex items-center gap-4 leading-none"><ShoppingBag size={24}/> Vetrina Km 0: {sellingProduct.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-600 ml-4 uppercase tracking-widest italic">Prezzo (€)</label>
                    <input type="number" className="w-full p-4 rounded-2xl border-none shadow-md font-black text-xl text-emerald-600 bg-white" placeholder="0.00" onChange={e=>setSellPrice(Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-amber-600 ml-4 uppercase tracking-widest italic">WhatsApp</label>
                    <input className="w-full p-4 rounded-2xl border-none shadow-md font-black text-sm bg-white uppercase" placeholder="340..." onChange={e=>setSellPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={handlePublishToMarket} className="flex-1 bg-amber-500 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl hover:bg-amber-600 transition-all active:scale-95">Pubblica</button>
                  <button onClick={()=>setSellingProduct(null)} className="px-10 bg-white text-amber-500 font-black rounded-2xl border-2 border-amber-200 text-[10px] uppercase">Annulla</button>
                </div>
              </div>
            )}
            <div className="bg-white p-8 rounded-3xl border shadow-sm relative overflow-hidden border-t-4 border-emerald-600">
              <h3 className="text-[10px] font-black uppercase text-stone-400 mb-8 tracking-widest flex items-center gap-3 italic"><Package size={16}/> Carico e Scarico Magazzino</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input placeholder="NOME PRODOTTO (ES: FIENO)" className="p-4 bg-stone-50 rounded-2xl font-black shadow-inner border-none uppercase text-xs tracking-widest" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} />
                <div className="flex gap-2">
                  <input type="number" placeholder="QTY" className="flex-1 p-4 bg-stone-50 rounded-2xl font-black shadow-inner border-none text-xl tracking-tighter" value={newProduct.quantity || ''} onChange={e=>setNewProduct({...newProduct, quantity:Number(e.target.value)})} />
                  <select className="p-4 bg-stone-50 rounded-2xl font-black border-none shadow-inner text-[10px] uppercase tracking-widest italic" value={newProduct.unit} onChange={e=>setNewProduct({...newProduct, unit:e.target.value})}><option>kg</option><option>balle</option><option>unità</option><option>litri</option></select>
                </div>
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">Add Stock</button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-sm text-center flex flex-col group hover:border-emerald-200 transition-all duration-500">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl w-fit mx-auto mb-6 group-hover:rotate-12 transition-transform shadow-inner"><Package size={32} strokeWidth={1.5}/></div>
                  <h4 className="font-black text-stone-900 uppercase text-[9px] mb-2 tracking-widest leading-none">{p.name}</h4>
                  <p className="text-4xl font-black text-emerald-600 italic tracking-tighter mb-6 leading-none">{p.quantity} <span className="text-[10px] uppercase not-italic opacity-30 tracking-[0.3em] block mt-1">Disp. {p.unit}</span></p>
                  <button onClick={()=>setSellingProduct(p)} className="w-full bg-amber-100 text-amber-700 font-black py-3 rounded-2xl text-[9px] uppercase tracking-widest mb-3 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2 italic"><Store size={14}/> Vendi Km 0</button>
                  <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-stone-100 hover:text-red-500 transition-colors mt-auto pt-6 border-t border-stone-50"><Trash2 size={18} className="mx-auto"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 6. AGENDA (CON RICERCA) --- */}
        {activeTab === 'tasks' && (
          <div className="max-w-3xl space-y-12 animate-in slide-in-from-left-8 duration-700 mx-auto">
            <div className="bg-white p-10 rounded-[3rem] border shadow-sm relative overflow-hidden border-t-8 border-stone-900">
               <h3 className="text-[11px] font-black uppercase text-stone-400 mb-8 tracking-[0.5em] italic flex items-center gap-6 leading-none"><CalendarDays className="text-emerald-600" size={24}/> Programmazione Lavori</h3>
               <div className="flex flex-col md:flex-row gap-6 mb-10">
                 <input className="flex-1 p-6 bg-stone-50 rounded-[2.5rem] font-black text-stone-800 text-sm shadow-inner border-none focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-stone-200 uppercase" placeholder="Descrizione attività..." value={newTask} onChange={e=>setNewTask(e.target.value)} />
                 <input type="date" className="p-6 bg-stone-50 rounded-[2.5rem] font-black shadow-inner border-none text-sm uppercase tracking-[0.3em] text-emerald-700" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)} />
                 <button onClick={handleAddTask} className="bg-emerald-950 text-white px-12 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.5em] shadow-2xl hover:bg-emerald-600 transition-all">Add</button>
               </div>
               {/* BARRA RICERCA ATTIVITÀ */}
               <div className="relative group">
                  <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-200 group-focus-within:text-emerald-500 transition-colors" />
                  <input className="w-full p-5 pl-14 bg-stone-50 border-none rounded-[2rem] font-black text-[11px] uppercase italic tracking-[0.2em] shadow-inner focus:ring-4 focus:ring-emerald-50 transition-all placeholder:text-stone-200" placeholder="Filtra lavori (es: vaccino, fieno)..." value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} />
               </div>
            </div>
            <div className="space-y-4">
              {tasks.filter(t => t.text.toLowerCase().includes(taskSearch.toLowerCase()))
                .sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                .map(t => (
                <div key={t.id} className={`bg-white p-8 rounded-[3rem] border-2 flex justify-between items-center transition-all duration-500 group ${t.done ? 'opacity-20 grayscale scale-95' : 'shadow-xl border-white hover:border-emerald-500 group-hover:translate-x-3 border-l-[12px] border-l-emerald-600'}`}>
                  <div>
                    <p className={`text-2xl font-black tracking-tighter leading-[0.8] mb-3 uppercase ${t.done ? 'line-through text-stone-400' : 'text-stone-950'}`}>{t.text}</p>
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.3em] italic leading-none">Termine: <span className="text-emerald-600 font-black">{t.dueDate || 'N/D'}</span></p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={()=>updateDoc(doc(db,'tasks',t.id),{done:!t.done})} className={`p-6 rounded-[2rem] shadow-2xl transition-all ${t.done ? 'bg-stone-200 text-stone-500' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}><CheckCircle2 size={32}/></button>
                    <button onClick={()=>deleteDoc(doc(db,'tasks',t.id))} className="p-6 bg-red-50 text-red-400 rounded-[2rem] hover:bg-red-600 hover:text-white transition-all shadow-xl"><Trash2 size={32}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 7. DINASTIA TAB --- */}
        {activeTab === 'dinastia' && (
          <div className="bg-white p-10 rounded-[3rem] border shadow-sm animate-in fade-in duration-1000 relative overflow-hidden overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-6 mb-12 border-b-4 border-stone-50 pb-8">
               <div className="bg-stone-900 p-4 rounded-2xl text-white shadow-xl shadow-stone-200"><Network size={28} strokeWidth={3}/></div>
               <div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-1 text-stone-900">Neural Bloodlines</h3>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em] italic leading-none">Mappa gerarchica genetica dell'allevamento</p>
               </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {animals.filter(a => !a.dam && !a.sire).map(root => (
                <div key={root.id} className="bg-stone-50/50 p-8 rounded-[3.5rem] border-2 border-white shadow-inner min-w-[300px]">
                  <DynastyBranch animal={root} allAnimals={animals} />
                </div>
              ))}
              {animals.length === 0 && <p className="text-stone-300 font-black italic uppercase tracking-[0.5em] text-center py-20 border-4 border-dashed rounded-[4rem] col-span-full">No Data Detected</p>}
            </div>
          </div>
        )}

        {/* --- 8. VETERINARIO IA TAB --- */}
        {activeTab === 'vet' && (
          <div className="bg-white p-12 rounded-[5rem] border shadow-2xl max-w-3xl animate-in zoom-in-95 duration-700 mx-auto relative overflow-hidden">
            <div className="bg-blue-600 p-12 rounded-[3.5rem] text-white mb-12 flex items-center gap-10 shadow-2xl shadow-blue-100 relative overflow-hidden group">
               <Stethoscope size={80} strokeWidth={1} className="relative z-10 transition-transform duration-700 group-hover:rotate-12" />
               <div className="relative z-10">
                  <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-3">Diagnosi IA</h3>
                  <p className="text-blue-50 font-bold opacity-80 text-lg leading-relaxed italic max-w-lg tracking-tighter uppercase">Triage clinico istantaneo basato su dati veterinari 2026.</p>
               </div>
            </div>
            <div className="space-y-3 mb-10 ml-4">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.5em] italic">Input Symptoms & Observation</p>
                <textarea className="w-full p-10 bg-stone-50 border-none rounded-[3.5rem] font-black text-stone-800 text-xl h-64 shadow-inner italic placeholder:text-stone-300 focus:ring-8 focus:ring-blue-50 transition-all leading-snug" placeholder="Descrivi il comportamento anomalo (es: vitello IT02 inappetente e respiro affannato)..." value={vetSymptom} onChange={e=>setVetSymptom(e.target.value)}></textarea>
            </div>
            <button onClick={()=>{setIsAnalyzing(true); setTimeout(()=>{setVetResult({title:"Esito Diagnostico", desc:"I sintomi indicati suggeriscono una possibile spossatezza da calore o fase iniziale di infezione respiratoria.", action:"ISOLARE IL CAPO, MONITORARE LA TEMPERATURA E CONTATTARE IL VETERINARIO DI ZONA URGENTEMENTE"}); setIsAnalyzing(false);},3000)}} className="w-full bg-stone-950 text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-xs flex items-center justify-center gap-8 hover:bg-blue-600 transition-all shadow-2xl">
              {isAnalyzing ? <><Activity className="animate-spin" size={24}/> Processing...</> : <><Bot size={32}/> Avvia Triage</>}
            </button>
            {vetResult && (
              <div className="mt-16 p-12 bg-emerald-50 border-4 border-emerald-100 rounded-[4rem] animate-in slide-in-from-bottom-12 duration-700">
                 <div className="flex items-center gap-6 mb-6">
                    <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-xl shadow-emerald-200"><AlertTriangle size={28} /></div>
                    <h4 className="text-2xl font-black uppercase text-emerald-950 tracking-tighter italic">{vetResult.title}</h4>
                 </div>
                 <p className="text-emerald-800 font-black text-xl mb-10 leading-tight italic tracking-tighter leading-relaxed">"{vetResult.desc}"</p>
                 <div className="bg-emerald-600 text-white p-8 rounded-3xl text-center text-xs font-black uppercase tracking-[0.3em] shadow-2xl border-t-8 border-emerald-500">{vetResult.action}</div>
              </div>
            )}
          </div>
        )}

        {/* --- 9. MERCATO KM 0 TAB --- */}
        {activeTab === 'market' && (
          <div className="space-y-20 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-16 md:p-24 rounded-[5rem] text-white shadow-[0_50px_100px_rgba(245,158,11,0.2)] relative overflow-hidden">
               <ShoppingBag size={350} className="absolute -bottom-24 -right-24 opacity-10 rotate-12" />
               <div className="relative z-10 max-w-3xl text-center md:text-left mx-auto md:mx-0">
                 <div className="bg-white/20 w-fit px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.5em] mb-10 backdrop-blur-3xl border border-white/20 shadow-2xl italic tracking-widest">Marketplace Km 0</div>
                 <h3 className="text-6xl font-black italic tracking-tighter uppercase mb-6 leading-[0.85] uppercase">Neural Food Source</h3>
                 <p className="text-amber-50 font-black text-xl leading-relaxed opacity-95 italic tracking-tighter max-w-xl">Sostieni l'agricoltura locale. Filiera corta digitale, trasparente, sicura.</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {marketItems.map(item => (
                <div key={item.id} className="bg-white rounded-[4rem] border-2 border-stone-50 shadow-[0_30px_80px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col group hover:shadow-2xl hover:translate-y-[-10px] transition-all duration-700">
                  <div className="h-64 bg-stone-50 flex items-center justify-center relative overflow-hidden group-hover:bg-amber-50 transition-colors duration-1000 shadow-inner">
                     <div className="absolute top-8 right-8 bg-white/95 backdrop-blur-3xl px-6 py-3 rounded-3xl font-black text-2xl text-emerald-600 shadow-2xl border-4 border-emerald-50 italic tracking-tighter group-hover:scale-110 transition-transform z-20 leading-none shadow-emerald-50">€{item.price.toFixed(0)}</div>
                     <ShoppingBag size={100} className="text-stone-100 opacity-50 transition-all duration-1000 group-hover:scale-[1.8]" />
                  </div>
                  <div className="p-12 flex flex-col flex-1 relative">
                    <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em] mb-3 italic leading-none">{item.sellerName}</p>
                    <h4 className="text-3xl font-black text-stone-950 tracking-tighter mb-10 leading-[0.9] uppercase group-hover:text-amber-600 transition-colors duration-500">{item.name}</h4>
                    <div className="flex justify-between items-center mb-12 bg-stone-50 p-8 rounded-[2.5rem] border-4 border-white shadow-2xl shadow-stone-100">
                       <span className="text-[11px] font-black text-stone-400 uppercase italic tracking-widest leading-none">Stock</span>
                       <span className="font-black text-stone-900 text-2xl uppercase tracking-tighter leading-none">{item.quantity} <span className="text-xs text-stone-300 ml-1 italic">{item.unit}</span></span>
                    </div>
                    {item.contactPhone ? (
                       <a href={`https://wa.me/39${item.contactPhone}?text=Salve ${item.sellerName}, vorrei ordinare ${item.name} via AgriManage.`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-[0_15px_40px_rgba(37,211,102,0.3)] flex items-center justify-center gap-5 hover:bg-[#1da851] hover:scale-105 transition-all active:scale-95 shadow-xl"><MessageCircle size={28}/> Shop On WhatsApp</a>
                    ) : (
                       <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-blue-200 flex items-center justify-center gap-5 hover:scale-105 transition-all active:scale-95"><Mail size={28}/> Email Inquiry</a>
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
