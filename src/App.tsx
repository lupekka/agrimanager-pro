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

// --- INTERFACCE ---
type Species = 'Maiali' | 'Cavalli' | 'Mucche' | 'Galline' | 'Oche';
interface Animal { id: string; name: string; species: Species; notes: string; sire?: string; dam?: string; birthDate?: string; ownerId: string; }
interface BirthRecord { id: string; animalName: string; species: Species; date: string; offspringCount: number; birthDate: string; ownerId: string; }
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dateCompleted?: string; dueDate?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }
interface MarketItem { id: string; name: string; price: number; quantity: number; unit: string; sellerId: string; sellerName: string; contactEmail: string; contactPhone: string; createdAt: string; }

// --- COMPONENTE DINASTIA ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const children = allAnimals.filter(a => a.dam === animal.name || a.sire === animal.name || a.dam === animal.id || a.sire === animal.id);
  return (
    <div className={level > 0 ? "ml-4 border-l border-stone-200 pl-4 mt-2" : ""}>
      <div className={`p-3 rounded-xl border mb-2 bg-white shadow-sm ${level === 0 ? 'border-l-4 border-l-emerald-500' : ''}`}>
        <p className="font-bold text-stone-800 text-sm">{animal.name}</p>
        <p className="text-[10px] text-stone-400 uppercase font-bold">{animal.species} • GENERAZIONE {level}</p>
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

  // DATI
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  // INPUT
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

  // IA & MARKET
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

  // --- LOGICA ACCESSO ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          const d = userDoc.data();
          setUserRole(d.role);
          setUserName(d.name || 'Utente');
          setActiveTab(d.role === 'consumer' ? 'market' : 'dashboard');
        } else {
          setUserRole('farmer'); setUserName('Azienda Agricola'); setActiveTab('dashboard');
        }
      } else { setUser(null); setUserRole(null); }
      setLoading(false);
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

  // --- FUNZIONI AZIONI ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', uc.user.uid), { role: regRole, name: regName, email });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (e) { alert("Errore credenziali o connessione."); }
  };

  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("Nome o ID obbligatorio.");
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', dam: '', sire: '', notes: '' });
  };

  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("Indica l'ID della madre.");
    await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    for (let i = 0; i < newBirth.count; i++) {
      await addDoc(collection(db, 'animals'), {
        name: `FIGLIO_${newBirth.idCode}_${Math.floor(Math.random()*1000)}`,
        species: newBirth.species, birthDate: newBirth.birthDate, dam: newBirth.idCode,
        notes: 'Nascita registrata', ownerId: user!.uid
      });
    }
    setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
    alert("Parto salvato e capi generati!");
  };

  const handleAICommand = async () => {
    const frasi = aiInput.toLowerCase().split(/ e |,|\./).filter(s => s.trim());
    let logs = [];
    for (let f of frasi) {
      const num = f.match(/(\d+)/)?.[1];
      if (f.includes('venduto') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `IA: ${f}`, amount: Number(num), type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Vendita: ${num}€`);
      } else if ((f.includes('speso') || f.includes('comprato')) && num) {
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

  const exportASLReport = () => {
    const d = new jsPDF();
    const nomeAz = window.prompt("Nome Azienda Agricola:") || "Azienda";
    d.text(nomeAz, 14, 20);
    const capiOrdinati = [...animals].sort((a,b) => a.species.localeCompare(b.species));
    autoTable(d, { 
      head: [['ID', 'Specie', 'Data Nascita', 'Madre']], 
      body: capiOrdinati.map(a => [a.name, a.species, a.birthDate || '', a.dam || '']),
      startY: 30 
    });
    d.save('Registro_Capi.pdf');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-800 bg-stone-50">Caricamento in corso...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm border">
          <h1 className="text-2xl font-black text-center mb-6 text-emerald-950 italic">AgriManage Pro</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'farmer' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-400'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'consumer' ? 'bg-amber-500 text-white' : 'bg-white text-stone-400'}`}>CLIENTE</button>
                </div>
                <input placeholder="Nome Azienda o Tuo Nome" className="w-full p-3 rounded-xl border text-sm" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full p-3 rounded-xl border text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-3 rounded-xl border text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold uppercase shadow-md">{isRegistering ? "Crea Account" : "Entra"}</button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs font-bold text-stone-400 uppercase mt-2">{isRegistering ? "Torna al Login" : "Nuovo Utente? Registrati"}</button>
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
    { id: 'market', label: 'Negozio', icon: ShoppingBag }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row relative">
      
      {/* BOTTONE IA */}
      {userRole === 'farmer' && (
        <button onClick={() => setShowAssistant(!showAssistant)} className="fixed bottom-20 right-4 md:bottom-8 md:right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg z-50 animate-bounce">
          <Bot size={24} />
        </button>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 fixed h-full shadow-sm z-40">
        <h1 className="text-xl font-black mb-8 text-emerald-900 italic">AgriPro</h1>
        <nav className="space-y-1 flex-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-4 flex items-center gap-2 text-red-500 font-bold p-2 text-sm"><LogOut size={18} /> Esci</button>
      </aside>

      {/* MOBILE NAV BOTTOM */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-2 z-50 shadow-lg">
        {menuItems.slice(0, 5).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center p-2 ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-300'}`}>
            <item.icon size={20} />
            <span className="text-[9px] font-bold uppercase mt-1">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* CONTENUTO */}
      <main className="flex-1 md:ml-64 p-4 md:p-10 pb-24">
        <h2 className="text-2xl font-black mb-6 text-stone-900 uppercase tracking-tight italic">{activeTab}</h2>

        {/* MODALE ASSISTENTE */}
        {showAssistant && (
          <div className="mb-6 bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-lg animate-in slide-in-from-top-4">
            <h3 className="text-blue-900 font-bold text-xs uppercase mb-3 flex items-center gap-2"><Bot size={16}/> Assistente Rapido</h3>
            <div className="flex gap-2">
              <input className="flex-1 p-3 bg-blue-50 border-none rounded-xl text-sm font-bold" placeholder="Es: Venduto maiale a 100€" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAICommand()} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-5 rounded-xl font-bold text-xs">OK</button>
            </div>
            {aiLogs.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{aiLogs.map((l, i) => <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-bold">{l}</span>)}</div>}
          </div>
        )}

        {/* --- DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div onClick={()=>setActiveTab('inventory')} className="bg-emerald-600 p-5 rounded-3xl text-white shadow-lg cursor-pointer">
              <p className="text-[10px] font-bold uppercase opacity-60">Capi Attivi</p>
              <h4 className="text-4xl font-black">{animals.length}</h4>
            </div>
            <div onClick={()=>setActiveTab('finance')} className="bg-white p-5 rounded-3xl border shadow-sm cursor-pointer">
               <p className="text-[10px] font-bold text-stone-400 uppercase">Bilancio Netto</p>
               <h4 className="text-2xl font-black">€{transactions.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount),0)}</h4>
            </div>
            <div onClick={()=>setActiveTab('tasks')} className="bg-stone-900 p-5 rounded-3xl text-white shadow-lg cursor-pointer">
               <p className="text-[10px] font-bold text-emerald-400 uppercase">Impegni</p>
               <h4 className="text-2xl font-black">{tasks.filter(t=>!t.done).length}</h4>
            </div>
          </div>
        )}

        {/* --- INVENTARIO CAPI DIVISO PER SPECIE --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <div className="flex justify-between mb-4">
                <h3 className="text-xs font-bold uppercase text-stone-400 italic">Nuovo Capo</h3>
                <button onClick={exportASLReport} className="text-[10px] font-bold bg-stone-100 px-3 py-1 rounded-lg flex items-center gap-1 uppercase"><FileDown size={14}/> PDF</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input placeholder="Codice Capo" className="p-3 bg-stone-50 rounded-xl text-sm border-none shadow-inner" value={newAnimal.name} onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} />
                <select className="p-3 bg-stone-50 rounded-xl text-sm border-none shadow-inner" value={newAnimal.species} onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                <input type="date" className="p-3 bg-stone-50 rounded-xl text-sm border-none shadow-inner" value={newAnimal.birthDate} onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} />
                <button onClick={handleSaveAnimal} className="bg-emerald-600 text-white font-bold rounded-xl p-3 uppercase text-xs">Aggiungi</button>
              </div>
            </div>

            {speciesList.map(specie => {
              const capi = animals.filter(a => a.species === specie);
              if (capi.length === 0) return null;
              return (
                <div key={specie} className="space-y-3">
                  <h4 className="text-sm font-black text-emerald-800 uppercase px-2">{specie} ({capi.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {capi.map(a => (
                      <div key={a.id} className="bg-white p-4 rounded-2xl border shadow-sm relative group">
                        <button onClick={()=>deleteDoc(doc(db,'animals',a.id))} className="absolute top-2 right-2 text-stone-200 hover:text-red-500"><Trash2 size={16}/></button>
                        <h4 className="font-bold text-stone-800">{a.name}</h4>
                        <p className="text-[10px] text-stone-400 font-bold">{a.birthDate || 'DATA MANCANTE'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- REGISTRO PARTI --- */}
        {activeTab === 'births' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm max-w-lg mx-auto">
             <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-amber-700 mb-6 flex items-center gap-3">
               <Baby size={32} />
               <p className="text-[11px] font-bold italic">Registra un parto: i nuovi nati verranno inseriti automaticamente in anagrafica.</p>
             </div>
             <div className="space-y-4">
                <input className="w-full p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner" placeholder="Codice ID Madre" value={newBirth.idCode} onChange={e=>setNewBirth({...newBirth, idCode:e.target.value})} />
                <div className="flex gap-2">
                  <input type="number" className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner" placeholder="N. Nati" value={newBirth.count} onChange={e=>setNewBirth({...newBirth, count:Number(e.target.value)})} />
                  <select className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner" value={newBirth.species} onChange={e=>setNewBirth({...newBirth, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                </div>
                <input type="date" className="w-full p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner" value={newBirth.birthDate} onChange={e=>setNewBirth({...newBirth, birthDate:e.target.value})} />
                <button onClick={handleSaveBirth} className="w-full bg-emerald-700 text-white py-4 rounded-xl font-bold uppercase text-xs">Registra Parto</button>
             </div>
          </div>
        )}

        {/* --- BILANCIO DIVISO PER SPECIE --- */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="bg-stone-900 p-8 rounded-3xl text-white shadow-lg text-center">
               <p className="text-xs font-bold text-emerald-400 uppercase mb-2">Totale Netto</p>
               <h3 className="text-4xl font-black">€ {transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(0)}</h3>
            </div>

            <div className="bg-white p-5 rounded-2xl border grid grid-cols-1 md:grid-cols-4 gap-3">
              <input placeholder="Descrizione" className="p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner col-span-1 md:col-span-2" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc:e.target.value})} />
              <input type="number" placeholder="€" className="p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner" value={newTrans.amount || ''} onChange={e=>setNewTrans({...newTrans, amount:Number(e.target.value)})} />
              <button onClick={handleSaveTransaction} className="bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase">Salva</button>
            </div>

            {speciesList.map(specie => {
              const transSpecie = transactions.filter(t => t.species === specie);
              if (transSpecie.length === 0) return null;
              const bilancioSpecie = transSpecie.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount), 0);
              return (
                <div key={specie} className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <h4 className="text-sm font-black text-stone-500 uppercase">{specie}</h4>
                    <span className={`text-sm font-black ${bilancioSpecie >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>€{bilancioSpecie}</span>
                  </div>
                  <div className="space-y-2">
                    {transSpecie.map(t => (
                      <div key={t.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                        <div>
                          <p className="font-bold text-xs text-stone-800 uppercase">{t.desc}</p>
                          <p className="text-[9px] text-stone-400 font-bold">{t.date}</p>
                        </div>
                        <span className={`font-black text-sm ${t.type==='Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type==='Entrata' ? '+' : '-'}€{t.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* --- SCORTE --- */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
              <h3 className="text-xs font-bold uppercase text-stone-400 mb-4 italic">Aggiorna Magazzino</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input placeholder="Articolo" className="p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner uppercase" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} />
                <input type="number" placeholder="Quantità" className="p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner" value={newProduct.quantity || ''} onChange={e=>setNewProduct({...newProduct, quantity:Number(e.target.value)})} />
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase">Carica</button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border shadow-sm text-center flex flex-col items-center">
                  <Package size={24} className="text-emerald-600 mb-2" />
                  <h4 className="font-bold text-stone-800 text-xs mb-1 uppercase">{p.name}</h4>
                  <p className="text-2xl font-black text-emerald-600 italic leading-none">{p.quantity}</p>
                  <button onClick={()=>setSellingProduct(p)} className="mt-3 w-full bg-amber-100 text-amber-700 font-bold py-2 rounded-lg text-[9px] uppercase hover:bg-amber-500 hover:text-white transition-all">Metti in Vetrina</button>
                  <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="mt-3 text-stone-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- AGENDA CON RICERCA --- */}
        {activeTab === 'tasks' && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
               <div className="flex gap-2 mb-4">
                  <input className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner" placeholder="Nuovo Lavoro..." value={newTask} onChange={e=>setNewTask(e.target.value)} />
                  <button onClick={handleAddTask} className="bg-emerald-600 text-white px-5 rounded-xl font-bold text-xs">OK</button>
               </div>
               {/* BARRA DI RICERCA ATTIVITÀ */}
               <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input className="w-full p-2 pl-10 bg-stone-100 border-none rounded-lg text-xs font-bold" placeholder="Cerca un'attività specifica..." value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} />
               </div>
            </div>
            <div className="space-y-2">
              {tasks.filter(t => t.text.toLowerCase().includes(taskSearch.toLowerCase()))
                .sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                .map(t => (
                <div key={t.id} className={`bg-white p-4 rounded-xl border flex justify-between items-center ${t.done ? 'opacity-30' : 'shadow-sm border-l-4 border-l-emerald-500'}`}>
                  <div>
                    <p className={`font-bold text-sm ${t.done ? 'line-through text-stone-400' : 'text-stone-800'}`}>{t.text}</p>
                    <p className="text-[9px] font-bold text-stone-400 uppercase mt-1">📅 {t.dueDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>updateDoc(doc(db,'tasks',t.id),{done:!t.done})} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={18}/></button>
                    <button onClick={()=>deleteDoc(doc(db,'tasks',t.id))} className="p-2 bg-red-50 text-red-400 rounded-lg"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- DINASTIA --- */}
        {activeTab === 'dinastia' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm overflow-x-auto">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-6 italic">Albero Genealogico</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {animals.filter(a => !a.dam && !a.sire).map(root => (
                <div key={root.id} className="bg-stone-50 p-4 rounded-2xl">
                  <DynastyBranch animal={root} allAnimals={animals} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- VETERINARIO IA --- */}
        {activeTab === 'vet' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm max-w-lg mx-auto">
            <div className="bg-blue-600 p-6 rounded-2xl text-white mb-6 flex items-center gap-4">
               <Stethoscope size={40} />
               <div><h3 className="font-black uppercase text-sm italic">Diagnosi IA</h3><p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Supporto decisionale rapido</p></div>
            </div>
            <textarea className="w-full p-4 bg-stone-50 border-none rounded-2xl font-bold text-sm h-32 mb-4 shadow-inner" placeholder="Descrivi il comportamento dell'animale..." value={vetSymptom} onChange={e=>setVetSymptom(e.target.value)}></textarea>
            <button onClick={()=>{setIsAnalyzing(true); setTimeout(()=>{setVetResult({title:"Esito Preliminare", desc:"Sintomi compatibili con spossatezza o infezione lieve.", action:"ISOLA IL CAPO E CHIAMA VETERINARIO"}); setIsAnalyzing(false);},2000)}} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold uppercase text-xs">
              {isAnalyzing ? "Analisi..." : "Analizza con IA"}
            </button>
            {vetResult && (
              <div className="mt-6 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                 <h4 className="text-emerald-900 font-bold uppercase text-xs mb-1">{vetResult.title}</h4>
                 <p className="text-emerald-800 text-xs mb-3 italic">"{vetResult.desc}"</p>
                 <div className="bg-emerald-600 text-white p-3 rounded-lg text-center text-[9px] font-bold uppercase">{vetResult.action}</div>
              </div>
            )}
          </div>
        )}

        {/* --- MERCATO --- */}
        {activeTab === 'market' && (
          <div className="space-y-6">
            <div className="bg-amber-500 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
               <h3 className="text-3xl font-black italic mb-2 uppercase">Mercato Locale</h3>
               <p className="text-amber-100 font-bold text-sm">Prodotti genuini direttamente dal campo.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketItems.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
                  <div className="h-40 bg-stone-100 flex items-center justify-center relative">
                     <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full font-black text-emerald-600 text-sm italic shadow-sm">€{item.price}</div>
                     <ShoppingBag size={40} className="text-stone-300" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">{item.sellerName}</p>
                    <h4 className="text-lg font-black text-stone-900 uppercase leading-none mb-4">{item.name}</h4>
                    <div className="flex justify-between items-center mb-4 bg-stone-50 p-3 rounded-xl">
                       <span className="text-[10px] font-bold text-stone-400 uppercase">Disp.</span>
                       <span className="font-bold text-stone-700 text-xs">{item.quantity} {item.unit}</span>
                    </div>
                    {item.contactPhone ? (
                       <a href={`https://wa.me/39${item.contactPhone}`} target="_blank" className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2"><MessageCircle size={18}/> WhatsApp</a>
                    ) : (
                       <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-2"><Mail size={18}/> Email</a>
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
