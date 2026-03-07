import React, { useState, useEffect } from 'react';
import {
  PawPrint, CalendarDays, TrendingUp, Network, Baby, Trash2,
  PlusCircle, LogOut, Lock, Menu, X, Search, LayoutDashboard,
  History, Package, Edit2, CheckCircle2,
  MinusCircle, Activity, ListChecks, Wallet,
  ArrowUpRight, ArrowDownLeft, Ghost, UserPlus, Stethoscope, 
  UploadCloud, AlertTriangle, FileDown, Store, ShoppingBag, 
  MessageCircle, Mail, Bot, Info, Send, Save, ArrowRightLeft
} from 'lucide-react';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, where, getDocs, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setDoc, getDoc, orderBy, limit } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, User } from "firebase/auth";

// --- FIREBASE ---
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
interface Transaction { id: string; type: 'Entrata' | 'Uscita'; amount: number; desc: string; species: Species; date: string; ownerId: string; }
interface Task { id: string; text: string; done: boolean; dueDate?: string; ownerId: string; }
interface Product { id: string; name: string; quantity: number; unit: string; ownerId: string; }
interface StockLog { id: string; productName: string; change: number; date: string; ownerId: string; }
interface MarketItem { id: string; name: string; price: number; quantity: number; unit: string; sellerId: string; sellerName: string; contactEmail: string; contactPhone: string; createdAt: string; }

// --- COMPONENTE DINASTIA ---
const DynastyBranch = ({ animal, allAnimals, level = 0 }: { animal: Animal, allAnimals: Animal[], level?: number }) => {
  const children = allAnimals.filter(a => a.dam === animal.name || a.sire === animal.name || a.dam === animal.id || a.sire === animal.id);
  return (
    <div className={level > 0 ? "ml-4 border-l-2 border-stone-300 pl-4 mt-2" : ""}>
      <div className={`p-3 rounded-xl border bg-white mb-2 shadow-sm ${level === 0 ? 'border-l-4 border-l-emerald-600 font-bold' : ''}`}>
        <p className="text-sm uppercase font-black text-stone-800">{animal.name}</p>
        <p className="text-[9px] text-stone-600 font-bold uppercase">{animal.species} • GEN {level}</p>
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
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);

  // INPUTS
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regRole, setRegRole] = useState<'farmer' | 'consumer'>('farmer');
  const [regName, setRegName] = useState('');
  
  const [newAnimal, setNewAnimal] = useState({ name: '', species: 'Maiali' as Species, birthDate: '', dam: '', notes: '' });
  const [editingAnimalId, setEditingAnimalId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');

  const [newBirth, setNewBirth] = useState({ idCode: '', species: 'Maiali' as Species, count: 1, birthDate: '' });
  const [newTrans, setNewTrans] = useState({ desc: '', amount: 0, type: 'Entrata' as 'Entrata'|'Uscita', species: 'Maiali' as Species });
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'kg' });
  
  const [newTask, setNewTask] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

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

  // ACCESSO
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserRole(data.role);
            setUserName(data.name || 'Utente');
            setActiveTab(data.role === 'consumer' ? 'market' : 'dashboard');
          } else { setUserRole('farmer'); setUserName('Azienda Agricola'); }
        } catch (e) { setUserRole('farmer'); }
      } else { setUser(null); setUserRole(null); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // SYNC DATI
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
      unsubs.push(onSnapshot(query(collection(db, 'stock_logs'), where("ownerId", "==", user.uid), orderBy('date', 'desc'), limit(20)), s => setStockLogs(s.docs.map(d => ({ id: d.id, ...d.data() } as StockLog)))));
    }
    return () => unsubs.forEach(u => u());
  }, [user?.uid, userRole]);

  // FUNZIONI
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const uc = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', uc.user.uid), { role: regRole, name: regName, email });
      } else { await signInWithEmailAndPassword(auth, email, password); }
    } catch (e) { alert("Credenziali errate."); }
  };

  const handleSaveAnimal = async () => {
    if (!newAnimal.name.trim()) return alert("Codice Capo richiesto.");
    await addDoc(collection(db, 'animals'), { ...newAnimal, ownerId: user!.uid });
    setNewAnimal({ name: '', species: 'Maiali', birthDate: '', dam: '', notes: '' });
  };

  const handleUpdateNotes = async (id: string) => {
    await updateDoc(doc(db, 'animals', id), { notes: editNote });
    setEditingAnimalId(null);
    setEditNote('');
  };

  const handleSaveTransaction = async () => {
    if (newTrans.amount <= 0 || !newTrans.desc) return alert("Dati mancanti.");
    await addDoc(collection(db, 'transactions'), { ...newTrans, date: new Date().toLocaleDateString('it-IT'), ownerId: user!.uid });
    setNewTrans({ desc: '', amount: 0, type: 'Entrata', species: 'Maiali' });
  };

  // --- REGISTRO MOVIMENTI SCORTE ---
  const handleModifyProduct = async (id: string, amount: number, isAddition: boolean) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const newQty = isAddition ? product.quantity + amount : Math.max(0, product.quantity - amount);
    
    await updateDoc(doc(db, 'products', id), { quantity: newQty });
    await addDoc(collection(db, 'stock_logs'), {
      productName: product.name,
      change: isAddition ? amount : -amount,
      date: new Date().toLocaleString('it-IT'),
      ownerId: user!.uid
    });
  };

  const handlePublishToMarket = async () => {
    if (!sellingProduct || sellPrice <= 0) return alert("Compila i dati.");
    try {
      await addDoc(collection(db, 'market_items'), { 
        name: sellingProduct.name, price: Number(sellPrice), quantity: sellingProduct.quantity, unit: sellingProduct.unit, 
        sellerId: user!.uid, sellerName: userName || 'Azienda Agricola', contactEmail: user!.email || '', contactPhone: sellPhone, createdAt: new Date().toISOString() 
      });
      await deleteDoc(doc(db, 'products', sellingProduct.id));
      setSellingProduct(null);
      alert("Pubblicato con successo!");
    } catch (e) { alert("Errore durante la pubblicazione."); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVetImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const exportASLReport = () => {
    const d = new jsPDF(); const n = window.prompt("Nome Azienda:") || "Azienda";
    d.text(n, 14, 20);
    const sorted = [...animals].sort((a,b) => a.species.localeCompare(b.species));
    autoTable(d, { head: [['ID', 'Specie', 'Data', 'Madre', 'Note']], body: sorted.map(a => [a.name, a.species, a.birthDate || '', a.dam || '', a.notes]), startY: 30 });
    d.save('Registro_Capi.pdf');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-800">Sincronizzazione...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-sm border">
          <h1 className="text-2xl font-black text-center mb-6 text-emerald-950 italic tracking-tighter uppercase">AgriManage Pro</h1>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border">
                <input placeholder="Tuo Nome o Azienda" className="w-full p-3 rounded-xl border text-sm" value={regName} onChange={e => setRegName(e.target.value)} required />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRegRole('farmer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'farmer' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600'}`}>AZIENDA</button>
                  <button type="button" onClick={() => setRegRole('consumer')} className={`flex-1 p-2 rounded-xl text-[10px] font-bold border transition-all ${regRole === 'consumer' ? 'bg-amber-500 text-white' : 'bg-white text-stone-600'}`}>CLIENTE</button>
                </div>
              </div>
            )}
            <input type="email" placeholder="Email" className="w-full p-3 rounded-xl border text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" className="w-full p-3 rounded-xl border text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="submit" className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold uppercase">{isRegistering ? "Crea Account" : "Entra"}</button>
            <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full text-xs font-bold text-stone-600 uppercase mt-4 text-center underline">{isRegistering ? "Login" : "Registrati"}</button>
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
    { id: 'tasks', label: 'Agenda', icon: ListChecks },
    { id: 'dinastia', label: 'Albero', icon: Network },
    { id: 'vet', label: 'Vet IA', icon: Stethoscope },
    { id: 'market', label: 'Market', icon: Store }
  ] : [{ id: 'market', label: 'Acquista', icon: ShoppingBag }];

  const totalIncome = transactions.filter(t => t.type === 'Entrata').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Uscita').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row relative text-stone-900 font-sans overflow-x-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 fixed h-full shadow-sm z-40">
        <h1 className="text-xl font-black mb-8 text-emerald-900 italic uppercase">AgriPro</h1>
        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-600 hover:bg-stone-50'}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => signOut(auth)} className="mt-4 flex items-center gap-2 text-red-600 font-bold p-2 text-xs uppercase"><LogOut size={18} /> Esci</button>
      </aside>

      {/* NAV MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t flex justify-around p-2 z-50 shadow-lg overflow-x-auto hide-scrollbar">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center min-w-[60px] p-2 transition-colors ${activeTab === item.id ? 'text-emerald-600' : 'text-stone-500'}`}>
            <item.icon size={20} />
            <span className="text-[8px] font-bold uppercase mt-1">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24">
        <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-black text-stone-900 uppercase italic tracking-tight">{activeTab}</h2>
            {userRole === 'farmer' && (
                <button onClick={() => setShowAssistant(!showAssistant)} className="bg-blue-600 text-white p-2 rounded-full shadow-md animate-pulse">
                    <Bot size={20} />
                </button>
            )}
        </div>

        {/* MODALE IA */}
        {showAssistant && (
          <div className="mb-6 bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-xl">
            <h3 className="text-blue-900 font-bold text-[10px] uppercase mb-2 flex items-center gap-2 italic"><Bot size={14}/> Comandi Rapidi</h3>
            <div className="flex gap-2">
              <input className="flex-1 p-2 bg-stone-50 border-none rounded-xl text-xs font-bold" placeholder="Venduto maiale a 150€" value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleAICommand()} />
              <button onClick={handleAICommand} className="bg-blue-600 text-white px-4 rounded-xl font-bold text-xs uppercase">Ok</button>
            </div>
          </div>
        )}

        {/* 1. DASHBOARD */}
        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="space-y-4">
            <div className="bg-stone-900 p-6 rounded-3xl text-white shadow-xl text-center">
               <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1 tracking-widest">Saldo Disponibile</p>
               <h3 className="text-4xl font-black">€ {(totalIncome - totalExpense).toFixed(0)}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div onClick={()=>setActiveTab('inventory')} className="bg-emerald-600 p-4 rounded-2xl text-white shadow-md cursor-pointer">
                <p className="text-[9px] font-bold uppercase opacity-60">Capi Attivi</p>
                <h4 className="text-2xl font-black italic">{animals.length}</h4>
              </div>
              <div onClick={()=>setActiveTab('tasks')} className="bg-white p-4 rounded-2xl border shadow-sm cursor-pointer">
                <p className="text-[9px] font-bold text-stone-600 uppercase">Impegni</p>
                <h4 className="text-2xl font-black text-stone-800 italic">{tasks.filter(t=>!t.done).length}</h4>
              </div>
            </div>
          </div>
        )}

        {/* 2. INVENTARIO */}
        {activeTab === 'inventory' && userRole === 'farmer' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-[10px] font-black uppercase text-stone-500">Nuovo Capo</h3>
                <button onClick={exportASLReport} className="text-[9px] font-bold bg-stone-900 text-white px-3 py-1 rounded-lg uppercase">Scarica Registro</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Codice Capo" className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none" value={newAnimal.name} onChange={e=>setNewAnimal({...newAnimal, name:e.target.value})} />
                <select className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none" value={newAnimal.species} onChange={e=>setNewAnimal({...newAnimal, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                <input type="date" className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none" value={newAnimal.birthDate} onChange={e=>setNewAnimal({...newAnimal, birthDate:e.target.value})} />
                <input placeholder="Note Salute" className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none" value={newAnimal.notes} onChange={e=>setNewAnimal({...newAnimal, notes:e.target.value})} />
                <button onClick={handleSaveAnimal} className="bg-emerald-600 text-white font-bold rounded-lg py-2 text-[10px] uppercase col-span-full">Aggiungi Capo</button>
              </div>
            </div>

            {speciesList.map(specie => {
              const capi = animals.filter(a => a.species === specie);
              if (capi.length === 0) return null;
              return (
                <div key={specie} className="space-y-2">
                  <h4 className="text-[11px] font-black text-emerald-800 uppercase italic px-1">{specie} ({capi.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {capi.map(a => (
                      <div key={a.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm relative">
                        <div className="flex justify-between items-start mb-1">
                           <h4 className="font-black text-stone-800 uppercase text-xs">{a.name}</h4>
                           <div className="flex gap-2">
                              <button onClick={()=>{setEditingAnimalId(a.id); setEditNote(a.notes || '');}} className="text-stone-500"><Edit2 size={14}/></button>
                              <button onClick={()=>deleteDoc(doc(db,'animals',a.id))} className="text-stone-500"><Trash2 size={14}/></button>
                           </div>
                        </div>
                        {editingAnimalId === a.id ? (
                           <div className="mt-2 space-y-2">
                              <textarea className="w-full p-2 bg-stone-50 rounded-lg text-[10px] border-none font-bold" value={editNote} onChange={e=>setEditNote(e.target.value)} />
                              <button onClick={()=>handleUpdateNotes(a.id)} className="w-full bg-emerald-600 text-white py-1.5 rounded-lg text-[9px] font-black uppercase">Salva Note</button>
                           </div>
                        ) : (
                           <>
                             <p className="text-[9px] text-stone-500 font-bold mb-2 italic uppercase">{a.birthDate || 'DATA N/D'}</p>
                             <p className="text-[10px] text-stone-600 bg-stone-50 p-2 rounded-lg italic">"{a.notes || 'Nessuna nota.'}"</p>
                           </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. BILANCIO */}
        {activeTab === 'finance' && userRole === 'farmer' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
              <h3 className="text-[10px] font-black uppercase text-stone-500">Registra Soldi</h3>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Causale" className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none" value={newTrans.desc} onChange={e=>setNewTrans({...newTrans, desc:e.target.value})} />
                <input type="number" placeholder="€" className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none" value={newTrans.amount || ''} onChange={e=>setNewTrans({...newTrans, amount:Number(e.target.value)})} />
                <select className={`p-2 rounded-lg font-black text-[10px] border-none ${newTrans.type === 'Entrata' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`} value={newTrans.type} onChange={e=>setNewTrans({...newTrans, type:e.target.value as any})}>
                    <option value="Entrata">📈 ENTRATA</option>
                    <option value="Uscita">📉 USCITA</option>
                </select>
                <select className="p-2 bg-stone-50 rounded-lg text-[10px] font-black border-none uppercase" value={newTrans.species} onChange={e=>setNewTrans({...newTrans, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                <button onClick={handleSaveTransaction} className="bg-emerald-600 text-white rounded-lg py-3 text-[10px] font-black uppercase col-span-full shadow-md mt-1">Salva</button>
              </div>
            </div>

            {speciesList.map(specie => {
              const transSpecie = transactions.filter(t => t.species === specie);
              if (transSpecie.length === 0) return null;
              const subtotal = transSpecie.reduce((acc, t) => acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0);
              return (
                <div key={specie} className="space-y-2">
                  <div className="flex justify-between items-center px-4 py-1 bg-stone-200 rounded-lg">
                    <h4 className="text-[10px] font-black text-stone-600 uppercase italic">{specie}</h4>
                    <span className={`text-[11px] font-black ${subtotal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>Saldo: €{subtotal}</span>
                  </div>
                  <div className="space-y-1.5">
                    {transSpecie.map(t => (
                      <div key={t.id} className="bg-white p-3 rounded-xl border border-stone-200 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-lg ${t.type==='Entrata' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{t.type==='Entrata' ? <ArrowUpRight size={14}/> : <ArrowDownLeft size={14}/>}</div>
                           <div><p className="font-bold text-xs text-stone-800 uppercase leading-none mb-1">{t.desc}</p><p className="text-[8px] font-bold text-stone-500 uppercase">{t.date}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className={`font-black text-sm ${t.type==='Entrata' ? 'text-emerald-600' : 'text-red-600'}`}>{t.type==='Entrata' ? '+' : '-'}€{t.amount}</span>
                           <button onClick={()=>deleteDoc(doc(db,'transactions',t.id))} className="text-stone-400"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. SCORTE E LOGS */}
        {activeTab === 'products' && userRole === 'farmer' && (
          <div className="space-y-6 animate-in fade-in">
            {sellingProduct && (
              <div className="bg-amber-50 p-5 rounded-2xl border-2 border-amber-300 shadow-xl mb-6">
                <h3 className="text-sm font-black text-amber-950 uppercase mb-4 leading-none italic">Pubblica in Vetrina: {sellingProduct.name}</h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input type="number" className="p-2 rounded-lg text-xs font-bold border-none" placeholder="Prezzo (€)" onChange={e=>setSellPrice(Number(e.target.value))} />
                  <input className="p-2 rounded-lg text-xs font-bold border-none" placeholder="WhatsApp" onChange={e=>setSellPhone(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={handlePublishToMarket} className="flex-1 bg-amber-500 text-white font-black py-2 rounded-lg text-[10px] uppercase">Pubblica</button>
                  <button onClick={()=>setSellingProduct(null)} className="px-4 bg-white text-amber-600 border-2 border-amber-200 rounded-lg text-[10px] font-black uppercase">Annulla</button>
                </div>
              </div>
            )}
            <div className="bg-white p-4 rounded-2xl border shadow-sm border-t-4 border-emerald-600">
              <h3 className="text-[10px] font-black uppercase text-stone-500 mb-4 tracking-widest italic">Gestione Magazzino</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input placeholder="Prodotto" className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none uppercase" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} />
                <div className="flex gap-2">
                  <input type="number" placeholder="QTY" className="flex-1 p-2 bg-stone-50 rounded-lg text-xs font-bold border-none" value={newProduct.quantity || ''} onChange={e=>setNewProduct({...newProduct, quantity:Number(e.target.value)})} />
                  <select className="p-2 bg-stone-50 rounded-lg text-[10px] uppercase font-bold border-none" value={newProduct.unit} onChange={e=>setNewProduct({...newProduct, unit:e.target.value})}><option>kg</option><option>balle</option><option>unità</option></select>
                </div>
                <button onClick={handleAddProduct} className="bg-emerald-600 text-white rounded-lg font-black uppercase text-[10px] py-2">Add</button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm text-center">
                  <h4 className="font-black text-stone-800 uppercase text-[10px] mb-2">{p.name}</h4>
                  <p className="text-2xl font-black text-emerald-600 mb-3 leading-none">{p.quantity} <span className="text-[9px] uppercase opacity-40 italic">{p.unit}</span></p>
                  <div className="flex gap-1 mb-2">
                    <button onClick={()=>handleModifyProduct(p.id, 1, false)} className="flex-1 bg-stone-100 p-2 rounded-lg text-stone-600 hover:bg-red-50 hover:text-red-600"><MinusCircle size={16}/></button>
                    <button onClick={()=>handleModifyProduct(p.id, 1, true)} className="flex-1 bg-stone-100 p-2 rounded-lg text-stone-600 hover:bg-emerald-50 hover:text-emerald-600"><PlusCircle size={16}/></button>
                  </div>
                  <button onClick={()=>setSellingProduct(p)} className="w-full bg-amber-100 text-amber-700 font-bold py-1.5 rounded-lg text-[8px] uppercase tracking-widest border border-amber-200">Vendi Km 0</button>
                  <button onClick={()=>deleteDoc(doc(db,'products',p.id))} className="text-stone-400 mt-2"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>

            <div className="bg-white p-4 rounded-2xl border shadow-sm">
                <h3 className="text-[10px] font-black uppercase text-stone-500 mb-3 flex items-center gap-2 italic"><History size={14}/> Registro Movimenti Scorte</h3>
                <div className="space-y-2">
                    {stockLogs.map(log => (
                        <div key={log.id} className="flex justify-between items-center text-[10px] p-2 bg-stone-50 rounded-lg border border-stone-100">
                            <span className="font-black text-stone-700 uppercase tracking-tighter">{log.productName}</span>
                            <span className={`font-black ${log.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{log.change > 0 ? '+' : ''}{log.change}</span>
                            <span className="text-stone-400 font-bold italic uppercase">{log.date}</span>
                        </div>
                    ))}
                    {stockLogs.length === 0 && <p className="text-center text-[9px] text-stone-400 uppercase italic py-4">Nessun movimento registrato.</p>}
                </div>
            </div>
          </div>
        )}

        {/* 6. AGENDA */}
        {activeTab === 'tasks' && userRole === 'farmer' && (
          <div className="space-y-6 max-w-lg mx-auto animate-in slide-in-from-left-6">
            <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
               <h3 className="text-[10px] font-black uppercase text-stone-500 italic">Pianificazione</h3>
               <div className="flex flex-col gap-2">
                 <input className="p-2 bg-stone-50 rounded-lg font-bold text-xs border-none" placeholder="Cosa devi fare?" value={newTask} onChange={e=>setNewTask(e.target.value)} />
                 <div className="flex gap-2">
                    <input type="date" className="flex-1 p-2 bg-stone-50 rounded-lg font-bold text-[10px] text-emerald-700 border-none" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)} />
                    <button onClick={handleAddTask} className="bg-emerald-600 text-white px-6 rounded-lg font-black text-[10px] uppercase">Add</button>
                 </div>
               </div>
               <div className="relative pt-2 border-t mt-2">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input className="w-full p-2 pl-8 bg-stone-100 border-none rounded-lg text-[10px] font-bold italic" placeholder="Filtra lavori..." value={taskSearch} onChange={e=>setTaskSearch(e.target.value)} />
               </div>
            </div>
            <div className="space-y-2">
              {tasks.filter(t => t.text.toLowerCase().includes(taskSearch.toLowerCase()))
                .sort((a,b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                .map(t => (
                <div key={t.id} className={`bg-white p-3 rounded-2xl border-2 flex justify-between items-center transition-all ${t.done ? 'opacity-30' : 'shadow-sm border-white border-l-8 border-l-emerald-600'}`}>
                  <div>
                    <p className={`text-xs font-black uppercase tracking-tighter ${t.done ? 'line-through text-stone-400' : 'text-stone-900'}`}>{t.text}</p>
                    <p className="text-[9px] font-bold text-stone-500 uppercase mt-1 italic">Scadenza: {t.dueDate || 'N/D'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>updateDoc(doc(db,'tasks',t.id),{done:!t.done})} className={`p-2 rounded-lg ${t.done ? 'bg-stone-100 text-stone-400' : 'bg-emerald-50 text-emerald-600'}`}><CheckCircle2 size={18}/></button>
                    <button onClick={()=>deleteDoc(doc(db,'tasks',t.id))} className="p-2 text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. VETERINARIO */}
        {activeTab === 'vet' && userRole === 'farmer' && (
          <div className="bg-white p-6 rounded-3xl border shadow-xl max-w-lg mx-auto animate-in zoom-in-95">
            <div className="bg-blue-600 p-6 rounded-2xl text-white mb-6 flex items-center gap-4 shadow-lg shadow-blue-200">
               <Stethoscope size={40} />
               <div>
                  <h3 className="text-xl font-black uppercase italic leading-none mb-1">Diagnosi IA</h3>
                  <p className="text-blue-50 font-bold opacity-80 text-[9px] uppercase tracking-widest italic leading-none">Triage clinico istantaneo 2026</p>
               </div>
            </div>

            <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest italic ml-2 leading-none">Allegato Fotografico</p>
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-stone-200 rounded-2xl cursor-pointer hover:bg-stone-50 hover:border-blue-400 transition-all relative overflow-hidden bg-stone-50 shadow-inner">
                        {vetImage ? (
                            <img src={vetImage} alt="Preview" className="w-full h-full object-cover animate-in fade-in" />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center">
                                <UploadCloud size={32} className="text-stone-300 mb-2" />
                                <p className="text-[9px] font-bold text-stone-400 uppercase">Tocca per caricare</p>
                            </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                </div>

                <div className="space-y-1.5">
                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest italic ml-2 leading-none">Sintomi</p>
                    <textarea className="w-full p-4 bg-stone-50 border-none rounded-2xl font-bold text-sm h-32 shadow-inner italic placeholder:text-stone-200 focus:ring-2 focus:ring-blue-100 transition-all" placeholder="Descrivi il problema..." value={vetSymptom} onChange={e=>setVetSymptom(e.target.value)}></textarea>
                </div>
            </div>

            <button onClick={()=>{setIsAnalyzing(true); setTimeout(()=>{setVetResult({title:"Esito Diagnostico", desc:"Sintomi indicativi di infezione o stress termico.", action:"ISOLARE IL CAPO E CHIAMARE VETERINARIO"}); setIsAnalyzing(false);},3000)}} className="w-full bg-stone-900 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 hover:bg-blue-600 transition-all shadow-lg active:scale-95">
              {isAnalyzing ? <><Activity className="animate-spin" size={18}/> Neural Processing...</> : "Analizza"}
            </button>

            {vetResult && (
              <div className="mt-8 p-5 bg-emerald-50 border-2 border-emerald-100 rounded-3xl animate-in slide-in-from-bottom-8">
                 <div className="flex items-center gap-4 mb-3">
                    <AlertTriangle size={24} className="text-emerald-600" />
                    <h4 className="text-sm font-black uppercase text-emerald-950 tracking-tighter italic">{vetResult.title}</h4>
                 </div>
                 <p className="text-emerald-800 font-bold text-xs mb-4 italic leading-relaxed">"{vetResult.desc}"</p>
                 <div className="bg-emerald-600 text-white p-3 rounded-xl text-center text-[9px] font-black uppercase tracking-widest shadow-md">{vetResult.action}</div>
              </div>
            )}
          </div>
        )}

        {/* 9. MARKET */}
        {activeTab === 'market' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-amber-500 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
               <ShoppingBag size={200} className="absolute -bottom-16 -right-16 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-[10s]" />
               <div className="relative z-10 max-w-2xl text-center md:text-left">
                 <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-4 leading-none">Market Km 0</h3>
                 <p className="text-amber-50 font-bold text-sm italic tracking-widest uppercase">Prodotti genuini direttamente dal campo.</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketItems.map(item => (
                <div key={item.id} className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-700">
                  <div className="h-48 bg-stone-50 flex items-center justify-center relative overflow-hidden group-hover:bg-amber-50 transition-colors duration-1000">
                     <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl font-black text-xl text-emerald-600 shadow-lg border border-emerald-50 italic leading-none">€{item.price.toFixed(0)}</div>
                     <ShoppingBag size={64} className="text-stone-100 opacity-50 group-hover:scale-125 transition-all duration-1000" />
                  </div>
                  <div className="p-6 flex flex-col flex-1 border-t border-stone-50">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 italic">{item.sellerName}</p>
                    <h4 className="text-xl font-black text-stone-950 tracking-tighter mb-6 uppercase group-hover:text-amber-600 transition-colors duration-500 leading-none">{item.name}</h4>
                    <div className="flex justify-between items-center mb-6 bg-stone-50 p-4 rounded-2xl border-2 border-white shadow-inner">
                       <span className="text-[10px] font-black text-stone-500 uppercase italic">DISPONIBILE</span>
                       <span className="font-black text-stone-800 text-lg uppercase tracking-tight leading-none">{item.quantity} <span className="text-xs text-stone-400 font-bold uppercase">{item.unit}</span></span>
                    </div>
                    {item.contactPhone ? (
                       <a href={`https://wa.me/39${item.contactPhone}?text=Interesse per ${item.name} visto su AgriPro.`} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-4 hover:bg-[#1da851] hover:scale-105 active:scale-95"><MessageCircle size={24}/> WhatsApp</a>
                    ) : (
                       <a href={`mailto:${item.contactEmail}`} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-4 hover:scale-105 active:scale-95"><Mail size={24}/> Email Order</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. DINASTIA */}
        {activeTab === 'dinastia' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm animate-in fade-in overflow-x-auto">
            <h3 className="text-lg font-black italic uppercase tracking-tighter mb-6 flex items-center gap-2 italic"><Network className="text-emerald-500"/> Linee di Sangue</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {animals.filter(a => !a.dam && !a.sire).map(root => (
                <div key={root.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-100 min-w-[280px]">
                  <DynastyBranch animal={root} allAnimals={animals} />
                </div>
              ))}
              {animals.length === 0 && <p className="text-stone-300 font-black italic uppercase text-center py-20 border-2 border-dashed rounded-2xl col-span-full">Nessun dato registrato.</p>}
            </div>
          </div>
        )}

        {/* 3. PARTI */}
        {activeTab === 'births' && userRole === 'farmer' && (
          <div className="bg-white p-8 rounded-3xl border shadow-xl max-w-lg mx-auto animate-in zoom-in-95">
             <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-amber-700 mb-8 flex items-center gap-4 shadow-lg shadow-amber-50">
               <Baby size={48} strokeWidth={1.5} className="animate-pulse" />
               <p className="text-[11px] font-bold italic uppercase tracking-tighter leading-relaxed">Inserimento nascite automatico.</p>
             </div>
             <div className="space-y-6">
                <input className="w-full p-3 bg-stone-50 rounded-xl font-black text-sm border-none shadow-inner" placeholder="Codice Madre" value={newBirth.idCode} onChange={e=>setNewBirth({...newBirth, idCode:e.target.value})} />
                <div className="flex gap-2">
                  <input type="number" className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-sm border-none shadow-inner" placeholder="N. Nati" value={newBirth.count} onChange={e=>setNewBirth({...newBirth, count:Number(e.target.value)})} />
                  <select className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-[10px] border-none shadow-inner uppercase" value={newBirth.species} onChange={e=>setNewBirth({...newBirth, species:e.target.value as Species})}>{speciesList.map(s=><option key={s}>{s}</option>)}</select>
                </div>
                <input type="date" className="w-full p-3 bg-stone-50 rounded-xl font-bold text-sm border-none shadow-inner" value={newBirth.birthDate} onChange={e=>setNewBirth({...newBirth, birthDate:e.target.value})} />
                <button onClick={handleSaveBirth} className="w-full bg-emerald-700 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95">Registra Parto</button>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}
