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
    <div className={level > 0 ? "ml-6 border-l-2 border-emerald-200 pl-4 mt-2" : "mt-2"}>
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col bg-white ${level === 0 ? 'border-l-4 border-l-emerald-500' : 'border-stone-100'}`}>
        <span className="font-black text-stone-800 tracking-tight">{animal.name}</span>
        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">{animal.species} • GEN {level}</span>
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

  // FORM INPUTS
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

  // --- LOGICA AUTENTICAZIONE ---
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
          setUserRole('farmer');
          setUserName('Azienda Agricola');
          setActiveTab('dashboard');
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

  // --- FUNZIONI DI GESTIONE ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', uc.user.uid), { role: regRole, name: regName, email });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (e) { alert("Errore accesso!"); }
  };

  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return;
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', dam: '', sire: '', notes: '' });
  };

  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("Specifica la madre!");
    await addDoc(collection(db, 'births'), { ...newBirth, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    for (let i = 0; i < newBirth.count; i++) {
      await addDoc(collection(db, 'animals'), {
        name: `Figlio di ${newBirth.idCode} #${i + 1}`,
        species: newBirth.species,
        birthDate: newBirth.birthDate,
        dam: newBirth.idCode,
        notes: 'Parto registrato',
        ownerId: user!.uid
      });
    }
    setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
    alert("Parto e figli registrati!");
  };

  const handleSaveTransaction = async () => {
    if (!newTrans.desc || newTrans.amount <= 0) return;
    await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
  };

  const handleAddProduct = async () => {
    if (!newProduct.name) return;
    const existing = products.find(p => p.name.toLowerCase() === newProduct.name.toLowerCase());
    if (existing) {
      await updateDoc(doc(db, 'products', existing.id), { quantity: existing.quantity + newProduct.quantity });
    } else {
      await addDoc(collection(db, 'products'), { ...newProduct, ownerId: user!.uid });
    }
    setNewProduct({ name: '', quantity: 0, unit: 'kg' });
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await addDoc(collection(db, 'tasks'), { text: newTask, done: false, dueDate: newTaskDate, ownerId: user!.uid });
    setNewTask('');
  };

  const handlePublishToMarket = async () => {
    if (!sellingProduct || sellPrice <= 0) return;
    await addDoc(collection(db, 'market_items'), {
      name: sellingProduct.name, price: sellPrice, quantity: sellingProduct.quantity, unit: sellingProduct.unit,
      sellerId: user!.uid, sellerName: userName, contactEmail: user!.email, contactPhone: sellPhone
    });
    setSellingProduct(null);
    alert("Prodotto pubblicato!");
  };

  const exportASLReport = () => {
    const doc = new jsPDF();
    const nomeAz = window.prompt("Nome Azienda:") || "Azienda";
    doc.setFontSize(20); doc.text(nomeAz, 14, 20);
    const rows = animals.sort((a,b) => a.species.localeCompare(b.species)).map(a => [a.name, a.species, a.birthDate || 'N/D', a.dam || '-']);
    autoTable(doc, { head: [['ID', 'Specie', 'Nascita', 'Madre']], body: rows, startY: 30 });
    doc.save(`Registro_${nomeAz}.pdf`);
  };

  const handleAICommand = async () => {
    const frasi = aiInput.toLowerCase().split(/ e |,|\./).filter(s => s.trim());
    let logs = [];
    for (let f of frasi) {
      const num = f.match(/(\d+)/)?.[1];
      if (f.includes('venduto') && num) {
        await addDoc(collection(db, 'transactions'), { desc: `Vendita: ${f}`, amount: Number(num), type: 'Entrata', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Entrata: ${num}€`);
      } else if ((f.includes('comprato') || f.includes('speso')) && num) {
        await addDoc(collection(db, 'transactions'), { desc: `Spesa: ${f}`, amount: Number(num), type: 'Uscita', species: 'Maiali', date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
        logs.push(`✅ Uscita: ${num}€`);
      } else if (f.includes('ho') && num) {
        const prod = f.replace(/ho|(\d+)/g, '').trim();
        await addDoc(collection(db, 'products'), { name: prod, quantity: Number(num), unit: 'unità', ownerId: user!.uid });
        logs.push(`✅ Scorta: ${num} ${prod}`);
      }
    }
    setAiLogs(logs); setAiInput('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-emerald-800 bg-stone-50 animate-pulse italic">Caricamento AgriManage Pro...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm border">
          <div className="flex justify-center mb-6"><div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg"><TrendingUp size={32}/></div></div>
          <h1 className="text-3xl font-black text-center mb-2 text-emerald-950 italic">AgriManage Pro</h1>
          <form onSubmit={handleAuth} className="space-y-4 mt-8">
            {isRegistering && (
              <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border mb-4">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 p-2 rounded-xl text-[10px] font-black border ${regRole === 'farmer' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-400'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 p-2 rounded-xl text-[10px] font-black border ${regRole === 'consumer' ? 'bg-amber-500 text-white' : 'bg-white text-stone-400'}`}>CLIENTE</button>
                </div>
                <input placeholder="Nome o Azienda" className="w-full p-3 rounded-xl border" value={regName} onChange={e => setRegName(e.target.value)} required />
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full p-3 rounded-xl border" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-3 rounded-xl border" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase shadow-lg">{isRegistering ? "Crea Account" : "Accedi"}</button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs font-bold text-stone-400 uppercase mt-4 underline">{isRegistering ? "Vai al Login" : "Nuovo Utente? Registrati"}</button>
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
    { id: 'dinastia', label: 'Dinastia', icon: Network },
    { id: 'vet', label: 'Vet IA', icon: Stethoscope },
    { id: 'market', label: 'Mercato', icon: Store }
  ] : [
    { id: 'market', label: 'Mercato Km 0', icon: ShoppingBag }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col md:flex-row relative">
      {/* ASSISTENTE IA FLOATING (Solo per agricoltori) */}
      {userRole === 'farmer' && (
        <button onClick={() => setShowAssistant(!showAssistant)} className="fixed bottom-24 right-4 md:bottom-8 md:right-8 bg-blue-600 text-white p-4 rounded-full shadow-2xl z-50 hover:scale-110 transition-transform animate-bounce">
          <Bot size={28} />
        </button>
      )}

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 fixed h-full shadow-sm z-40">
        <h1 className="text-2xl font-black mb-10 text-emerald-900 italic tracking-tighter uppercase">AgriManage</h1>
        <nav className="space-y-1 flex-1 overflow-y-auto">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 w-full p-4 rounded-2xl font-black text-xs uppercase tracking-tight transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="text-red-500 font-black flex items-center gap-3 p-4 mt-auto text-xs uppercase"><LogOut size={18}/> Esci</button>
      </aside>

      {/* CONTENUTO */}
      <main className="flex-1 md:ml-64 p-6 md:p-12 pb-32">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-black text-stone-900 italic tracking-tighter uppercase">{activeTab}</h2>
          <span className="bg-white px-4 py-2 rounded-full border text-[10px] font-black uppercase text-stone-400">Utente: {userName}</span>
        </div>

        {/* MODALE ASSISTENTE */}
        {showAssistant && (
          <div className="mb-10 bg-white p-6 rounded-[2rem] border-2 border-blue-100 shadow-xl animate-in fade-in">
            <h3 className="text-blue-900 font-black text-xs uppercase mb-4 flex items-center gap-2"><Bot size={16}/> Comandi Vocali Rapidi</h3>
            <div className="flex gap-2">
              <input className="flex-1 p-4 bg-blue-50 border-none rounded-2xl font-bold" placeholder="Esempio: 'Venduto maiale a 100 e speso 50 mangime'" value={aiInput} onChange={e => setAiInput(e.target.value)} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-8 rounded-2xl font-black">OK</button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{aiLogs.map((l, i) => <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black">{l}</span>)}</div>
          </div>
        )}

        {/* --- DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in">
            <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <PawPrint size={140} className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-2">Totale Capi</p>
              <h4 className="text-7xl font-black italic tracking-tighter">{animals.length}</h4>
              <button onClick={() => setActiveTab('inventory')} className="mt-6 bg-white/20 px-4 py-2 rounded-full text-[10px] font-black uppercase">Vedi Tutti</button>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm relative group overflow-hidden">
               <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Bilancio Netto</p>
               <h4 className="text-5xl font-black text-stone-900 italic tracking-tighter">€{transactions.reduce((acc,t)=>acc+(t.type==='Entrata'?t.amount:-t.amount),0)}</h4>
               <div className="flex gap-4 mt-6">
                 <div className="bg-emerald-50 px-4 py-2 rounded-xl text-emerald-600 font-black text-[10px]">+€{transactions.filter(t=>t.type==='Entrata').reduce((acc,t)=>acc+t.amount,0)}</div>
                 <div className="bg-red-50 px-4 py-2 rounded-xl text-red-600 font-black text-[10px]">-€{transactions.filter(t=>t.type==='Uscita').reduce((acc,t)=>acc+t.amount,0)}</div>
               </div>
            </div>
            <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Agenda</p>
               <h4 className="text-5xl font-black italic tracking-tighter">{tasks.filter(t=>!t.done).length}</h4>
               <p className="text-stone-500 text-[9px] font-black uppercase mt-2 tracking-widest italic">Attività in sospeso</p>
               <button onClick={()=>setActiveTab('tasks')} className="mt-4 bg-emerald-600 text-[10px] font-black px-4 py-2 rounded-full">APRI</button>
            </div>
          </div>
        )}

        {/* --- INVENTARIO CAPI --- */}
        {activeTab === 'inventory' && (
          <div className="space-y-10">
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
              <div className="flex justify-between mb-8">
                <h3 className="text-xs font-black uppercase text-stone-400 tracking-widest italic">Nuovo Inserimento</h3>
                <button onClick={exportASLReport} className="text-[10px] font-black bg-stone-100 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all uppercase"><FileDown size={14}/> Registro PDF</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input placeholder="Codice Capo" className="p-4 bg-stone-50 border-none rounded-2xl font-bold" value={newAnimal.name} onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} />
                <select className="p-4 bg-stone-50 border-none rounded-2xl font-bold" value={newAnimal.species} onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                <input type="date" className="p-4 bg-stone-50 border-none rounded-2xl font-bold" value={newAnimal.birthDate} onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} />
                <input placeholder="ID Madre (Opz)" className="p-4 bg-stone-50 border-none rounded-2xl font-bold" value={newAnimal.dam} onChange={e=>setNewAnimal({...newAnimal, dam:e.target.value})} />
                <button onClick={handleSaveAnimal} className="bg-emerald-600 text-white font-black rounded-2xl p-4 uppercase text-[10px] shadow-lg">Registra</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {animals.map(a => (
                <div key={a.id} className="bg-white p-6 rounded-[2rem] border shadow-sm relative hover:border-emerald-500 transition-all">
                  <button onClick={()=>deleteDoc(doc(db,'animals',a.id))} className="absolute top-4 right-4 text-stone-200 hover:text-red-500"><Trash2 size={16}/></button>
                  <h4 className="text-lg font-black text-stone-800 tracking-tight leading-tight">{a.name}</h4>
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mt-1">{a.species} • {a.birthDate || 'N/D'}</p>
                  <p className="text-[10px] text-stone-500 mt-4 italic">{a.notes || 'Nessuna nota'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- REGISTRO PARTI --- */}
        {activeTab === 'births' && (
          <div className="bg-white p-10 rounded-[3rem] border shadow-sm max-w-2xl animate-in zoom-in-95">
             <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 text-amber-700 mb-8 flex items-center gap-4">
               <Baby size={32} />
               <p className="text-xs font-bold italic uppercase tracking-tighter">Il registro genera automaticamente i nuovi nati e li collega alla madre.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <input className="p-4 bg-stone-50 border-none rounded-2xl font-bold" placeholder="ID Madre" value={newBirth.idCode} onChange={e=>setNewBirth({...newBirth, idCode:e.target.value})} />
                <input type="number" className="p-4 bg-stone-50 border-none rounded-2xl font-bold" placeholder="N. Nati" value={newBirth.count} onChange={e=>setNewBirth({...newBirth, count:Number(e.target.value)})} />
                <input type="date" className="p-4 bg-stone-50 border-none rounded-2xl font-bold" value={newBirth.birthDate} onChange={e=>setNewBirth({...newBirth, birthDate:e.target.value})} />
                <select className="p-4 bg-stone-50 border-none rounded-2xl font-bold" value={newBirth.species} onChange={e=>setNewBirth({...newBirth, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
             </div>
             <button onClick={handleSaveBirth} className="w-full bg-emerald-700 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl">Registra Parto</button>
          </div>
        )}

        {/* --- DINASTIA --- */}
        {activeTab === 'dinastia' && (
          <div className="bg-white p-10 rounded-[3rem] border shadow-sm animate-in fade-in">
            <h3 className="text-xl font-black italic uppercase tracking-tighter mb-10 border-b pb-4 flex items-center gap-3"><Network className="text-emerald-500"/> Albero Genealogico</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {animals.filter(a => !a.dam && !a.sire).map(root => (
                <div key={root.id} className="bg-stone-50/50 p-6 rounded-[2.5rem] border border-stone-100">
                  <DynastyBranch animal={root} allAnimals={animals} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- BILANCIO --- */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="bg-stone-900 p-10 rounded-[3rem] text-white shadow-2xl">
               <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-2">Netto Aziendale</p>
               <h3 className="text-6xl font-black italic tracking-tighter">€ {transactions.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0).toFixed(2)}</h3>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] border grid grid-cols-1 md:grid-cols-4 gap-4">
              <input placeholder="Causale" className="p-4 bg-stone-50 rounded-2xl font-bold col-span-2" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc:e.target.value})} />
              <input type="number" placeholder="€" className="p-4 bg-stone-50 rounded-2xl font-bold" value={newTrans.amount || ''} onChange={e=>setNewTrans({...newTrans, amount:Number(e.target.value)})} />
              <button onClick={handleSaveTransaction} className="bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px]">Salva</button>
            </div>
            <div className="space-y-3">
              {transactions.sort((a,b)=>b.date.localeCompare(a.date)).map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl border shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-black text-stone-800 tracking-tight">{t.desc}</p>
                    <p className="text-[8px] font-black text-stone-400 uppercase mt-1">{t.date}</p>
                  </div>
                  <span className={`font-black text-lg italic ${t.type==='Entrata' ? 'text-emerald-600' : 'text-red-500'}`}>{t.type==='Entrata' ? '+' : '-'}€{t.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SCORTE MAGAZZINO --- */}
        {activeTab === 'products' && (
          <div className="space-y-10">
            {sellingProduct && (
              <div className="bg-amber-50 p-8 rounded-[3rem] border-2 border-amber-300 shadow-xl animate-in zoom-in-95">
                <h3 className="text-xl font-black text-amber-950 italic mb-4 uppercase tracking-tighter">Pubblica in Vetrina: {sellingProduct.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <input type="number" placeholder="Prezzo Unitario (€)" className="p-4 rounded-2xl border-amber-200 font-bold" onChange={e=>setSellPrice(Number(e.target.value))} />
                  <input placeholder="Cell. WhatsApp (Opz)" className="p-4 rounded-2xl border-amber-200 font-bold" onChange={e=>setSellPhone(e.target.value)} />
                </div>
                <div className="flex gap-4">
                  <button onClick={handlePublishToMarket} className="flex-1 bg-amber-500 text-white font-black py-4 rounded-2xl uppercase text-[10px]">Metti in Vendita</button>
                  <button onClick={()=>setSellingProduct(null)} className="px-8 bg-white text-amber-500 font-black rounded-2xl uppercase text-[10px]">Annulla</button>
                </div>
              </div>
            )}
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
              <h3 className="text-[10px] font-black uppercase text-stone-400 mb-6 tracking-widest">Aggiungi Magazzino</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input placeholder="Nome Oggetto" className="p-4 bg-stone-50 rounded-2xl font-bold" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} />
                <input type="number" placeholder="Q.tà" className="p-4 bg-stone-50 rounded-2xl font-bold" value={newProduct.quantity || ''} onChange={e=>setNewProduct({...newProduct, quantity:Number(e.target.value)})} />
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white font-black rounded-2xl uppercase text-[10px]">Carica</button>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm text-center flex flex-col">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl w-fit mx-auto mb-4"><Package size={24}/></div>
                  <h4 className="font-black text-stone-800 uppercase text-xs mb-1">{p.name}</h4>
                  <p className="text-3xl font-black text-emerald-600 italic tracking-tighter mb-4">{p.quantity} <span className="text-[10px] uppercase">{p.unit}</span></p>
                  <button onClick={()=>setSellingProduct(p)} className="bg-amber-100 text-amber-700 font-black py-2 rounded-xl text-[9px] uppercase mb-2">Vendi al Mercato</button>
                  <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-stone-300 hover:text-red-500 mt-auto"><Trash2 size={16} className="mx-auto"/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- AGENDA LAVORI --- */}
        {activeTab === 'tasks' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
               <h3 className="text-[10px] font-black uppercase text-stone-400 mb-6 tracking-widest italic">Pianifica Lavoro</h3>
               <div className="flex flex-col md:flex-row gap-2">
                 <input className="flex-1 p-4 bg-stone-50 rounded-2xl font-bold" placeholder="Cosa devi fare?" value={newTask} onChange={e=>setNewTask(e.target.value)} />
                 <input type="date" className="p-4 bg-stone-50 rounded-2xl font-bold text-xs" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)} />
                 <button onClick={handleAddTask} className="bg-emerald-600 text-white px-8 rounded-2xl font-black uppercase text-[10px]">Ok</button>
               </div>
            </div>
            <div className="space-y-2">
              {tasks.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).map(t => (
                <div key={t.id} className={`bg-white p-6 rounded-3xl border flex justify-between items-center ${t.done ? 'opacity-40 grayscale' : 'shadow-sm border-l-8 border-l-emerald-500'}`}>
                  <div>
                    <p className={`font-black tracking-tight ${t.done ? 'line-through' : 'text-stone-800'}`}>{t.text}</p>
                    <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest mt-1">📅 {t.dueDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>updateDoc(doc(db,'tasks',t.id),{done:!t.done})} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={18}/></button>
                    <button onClick={()=>deleteDoc(doc(db,'tasks',t.id))} className="p-3 bg-red-50 text-red-400 rounded-xl"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- VETERINARIO IA --- */}
        {activeTab === 'vet' && (
          <div className="bg-white p-10 rounded-[3rem] border shadow-sm max-w-2xl animate-in slide-in-from-bottom-6">
            <div className="bg-blue-600 p-8 rounded-[2rem] text-white mb-8 flex items-center gap-6 shadow-xl shadow-blue-100">
               <Stethoscope size={48} />
               <div><h3 className="text-xl font-black uppercase italic tracking-tighter">Diagnosi Rapida IA</h3><p className="text-blue-100 text-xs font-bold">Consulenza preliminare intelligente.</p></div>
            </div>
            <textarea className="w-full p-6 bg-stone-50 border-none rounded-3xl font-bold h-40 mb-6 shadow-inner" placeholder="Descrivi il sintomo dell'animale..." value={vetSymptom} onChange={e=>setVetSymptom(e.target.value)}></textarea>
            <button onClick={()=>{setIsAnalyzing(true); setTimeout(()=>{setVetResult({title:"Triage IA", desc:"Sintomi compatibili con spossatezza o infezione lieve.", action:"Isolare il capo e chiamare il veterinario."}); setIsAnalyzing(false);},2000)}} className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest">
              {isAnalyzing ? "Analisi in corso..." : "Analizza con IA"}
            </button>
            {vetResult && (
              <div className="mt-8 p-8 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem]">
                 <h4 className="text-emerald-900 font-black uppercase text-sm mb-2">{vetResult.title}</h4>
                 <p className="text-emerald-800 text-sm mb-4 font-bold">{vetResult.desc}</p>
                 <div className="bg-emerald-600 text-white p-4 rounded-xl text-center text-[10px] font-black uppercase tracking-widest">{vetResult.action}</div>
              </div>
            )}
          </div>
        )}

        {/* --- MERCATO KM 0 --- */}
        {activeTab === 'market' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in">
            {marketItems.map(item => (
              <div key={item.id} className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all">
                <div className="h-40 bg-amber-100 flex items-center justify-center relative">
                   <h4 className="text-2xl font-black text-amber-950 italic tracking-tighter">{item.name}</h4>
                   <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full font-black text-emerald-600 shadow-sm text-xs">€{item.price}</div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-4">Venduto da: {item.sellerName}</p>
                  <div className="flex justify-between items-center mb-6 bg-stone-50 p-4 rounded-2xl">
                     <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Q.tà</span>
                     <span className="font-bold text-stone-700">{item.quantity} {item.unit}</span>
                  </div>
                  {item.contactPhone ? (
                    <a href={`https://wa.me/39${item.contactPhone}`} target="_blank" className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-md"><MessageCircle size={18}/> WhatsApp</a>
                  ) : (
                    <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 shadow-md"><Mail size={18}/> Invia Email</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* NAV MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t flex justify-around p-3 z-50 overflow-x-auto hide-scrollbar">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center min-w-[60px] ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-300'}`}>
            <item.icon size={20} />
            <span className="text-[7px] font-black uppercase mt-1">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
